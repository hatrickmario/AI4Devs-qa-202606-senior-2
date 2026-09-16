import { Locator, Page, Request, Response } from '@playwright/test';
import { CandidateMoveResult } from '../support/PositionContext';

function isGetResponseFor(response: Response, pathSuffix: string): boolean {
  return (
    response.request().method() === 'GET' &&
    new RegExp(`${pathSuffix}$`, 'i').test(new URL(response.url()).pathname)
  );
}

export class PositionsPage {
  constructor(private readonly page: Page) {}

  /**
   * Waits for the board's two data requests (GET .../interviewflow and
   * GET .../candidates) to both resolve successfully around whatever
   * navigation action triggers them, then returns control to the caller.
   * This is the "backend communication" half of the double validation: the
   * DOM assertions in the Then steps are the "visual state" half.
   */
  private async awaitBoardDataLoaded(positionId: number, action: () => Promise<void>): Promise<void> {
    const interviewFlowLoaded = this.page.waitForResponse((response) =>
      isGetResponseFor(response, `/positions/${positionId}/interviewFlow`),
    );
    const candidatesLoaded = this.page.waitForResponse((response) =>
      isGetResponseFor(response, `/positions/${positionId}/candidates`),
    );

    await action();

    const [interviewFlowResponse, candidatesResponse] = await Promise.all([
      interviewFlowLoaded,
      candidatesLoaded,
    ]);
    if (!interviewFlowResponse.ok()) {
      throw new Error(
        `GET .../positions/${positionId}/interviewflow responded with ${interviewFlowResponse.status()}`,
      );
    }
    if (!candidatesResponse.ok()) {
      throw new Error(
        `GET .../positions/${positionId}/candidates responded with ${candidatesResponse.status()}`,
      );
    }
  }

  async goto(positionId: number): Promise<void> {
    await this.awaitBoardDataLoaded(positionId, async () => {
      await this.page.goto(`/positions/${positionId}`);
    });
  }

  async reload(positionId: number): Promise<void> {
    await this.awaitBoardDataLoaded(positionId, async () => {
      await this.page.reload();
    });
  }

  get title(): Locator {
    return this.page.getByTestId('position-title');
  }

  async columnNames(): Promise<string[]> {
    return this.page.getByTestId('phase-column-title').allTextContents();
  }

  candidateCard(candidateId: number): Locator {
    return this.page.getByTestId(`candidate-card-${candidateId}`);
  }

  /** Scopes a candidate card lookup to one specific phase column. */
  candidateCardInColumn(phaseId: number, candidateId: number): Locator {
    return this.page.getByTestId(`phase-column-${phaseId}`).getByTestId(`candidate-card-${candidateId}`);
  }

  async candidateCountInColumn(phaseId: number): Promise<number> {
    return this.page
      .getByTestId(`phase-column-${phaseId}`)
      .locator('[data-testid^="candidate-card-"]')
      .count();
  }

  /**
   * Drags a candidate's card from its current phase column and drops it on
   * another phase column, then returns the PUT request that move fired
   * (and its response), so the caller can assert on candidate id / body /
   * status without this Page Object knowing about test expectations.
   *
   * react-beautiful-dnd ignores Playwright's built-in dragTo()/native HTML5
   * DnD events - it only reacts to a real mouse sequence: press, a small
   * initial move to arm its sensor, then a slower multi-step move to the
   * drop target before releasing.
   */
  async dragCandidateToPhase(
    candidateId: number,
    fromPhaseId: number,
    toPhaseId: number,
  ): Promise<CandidateMoveResult> {
    const updateRequestReceived = this.page.waitForRequest(
      (request) =>
        request.method() === 'PUT' &&
        new RegExp(`/candidates/${candidateId}$`).test(new URL(request.url()).pathname),
    );

    const card = this.candidateCardInColumn(fromPhaseId, candidateId);
    const targetColumn = this.page.getByTestId(`phase-column-${toPhaseId}`);
    const [cardBox, targetBox] = await Promise.all([card.boundingBox(), targetColumn.boundingBox()]);
    if (!cardBox || !targetBox) {
      throw new Error('Could not compute bounding boxes to perform the drag-and-drop.');
    }

    const start = { x: cardBox.x + cardBox.width / 2, y: cardBox.y + cardBox.height / 2 };
    const end = { x: targetBox.x + targetBox.width / 2, y: targetBox.y + targetBox.height / 2 };

    await this.page.mouse.move(start.x, start.y);
    await this.page.mouse.down();
    await this.page.mouse.move(start.x + 10, start.y + 10, { steps: 5 });
    await this.page.mouse.move(end.x, end.y, { steps: 20 });
    await this.page.mouse.up();

    const request: Request = await updateRequestReceived;
    const response = await request.response();
    return { request, response };
  }
}
