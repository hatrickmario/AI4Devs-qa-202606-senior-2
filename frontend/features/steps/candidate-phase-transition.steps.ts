import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import { fetchCandidateCurrentPhaseName, fetchCandidates, fetchPositionPhases, fetchPositionTitle } from '../support/api';
import { pickCandidateWithNextPhase } from '../support/selectCandidateToMove';

const POSITION_ID = Number(process.env.POSITION_ID ?? 1);

Given('a published job position exists with a configured interview process that has at least two phases', async ({
  positionContext,
}) => {
  positionContext.positionId = POSITION_ID;
  positionContext.title = await fetchPositionTitle(POSITION_ID);
  positionContext.phases = await fetchPositionPhases(POSITION_ID);
  expect(positionContext.phases.length, 'seeded position must have at least two configured phases').toBeGreaterThanOrEqual(2);
});

Given('that position has a candidate currently placed in a phase that is not the last one in that process', async ({
  positionContext,
}) => {
  positionContext.candidates = await fetchCandidates(positionContext.positionId, positionContext.phases);
  const { candidate, nextPhase } = pickCandidateWithNextPhase(positionContext.phases, positionContext.candidates);
  positionContext.candidateToMove = candidate;
  positionContext.nextPhase = nextPhase;
});

Given('I have opened the detail page for that position', async ({ page, positionsPage, positionContext }) => {
  page.on('pageerror', (error) => positionContext.pageErrors.push(error));
  await positionsPage.goto(positionContext.positionId);
});

When("I drag that candidate's card from their current phase column and drop it onto the column for the next phase", async ({
  positionsPage,
  positionContext,
}) => {
  const { candidateToMove, nextPhase } = positionContext;
  positionContext.moveResult = await positionsPage.dragCandidateToPhase(
    candidateToMove.id,
    candidateToMove.phaseId,
    nextPhase.id,
  );
});

Then('the candidate\'s card is displayed under the column for the next phase', async ({
  positionsPage,
  positionContext,
}) => {
  await expect(
    positionsPage.candidateCardInColumn(positionContext.nextPhase.id, positionContext.candidateToMove.id),
  ).toBeVisible();
});

Then("the candidate's phase is saved as the next phase", async ({ positionContext }) => {
  const persistedPhaseName = await fetchCandidateCurrentPhaseName(
    positionContext.positionId,
    positionContext.candidateToMove.id,
  );
  expect(persistedPhaseName).toBe(positionContext.nextPhase.name);
});

Then('the drag-and-drop action completes without error', async ({ positionContext }) => {
  expect(positionContext.pageErrors).toHaveLength(0);
});

Then("the candidate's card is no longer displayed under their previous phase column", async ({
  positionsPage,
  positionContext,
}) => {
  await expect(
    positionsPage.candidateCardInColumn(positionContext.candidateToMove.phaseId, positionContext.candidateToMove.id),
  ).toHaveCount(0);
});

Then('the candidate\'s card is displayed in that column together with any other candidates already there', async ({
  positionsPage,
  positionContext,
}) => {
  const alreadyThere = positionContext.candidates.filter(
    (candidate) => candidate.phaseId === positionContext.nextPhase.id,
  );
  for (const candidate of alreadyThere) {
    await expect(positionsPage.candidateCardInColumn(positionContext.nextPhase.id, candidate.id)).toBeVisible();
  }
  await expect(
    positionsPage.candidateCardInColumn(positionContext.nextPhase.id, positionContext.candidateToMove.id),
  ).toBeVisible();
});

Then("the system requests the backend to update that specific candidate's phase", async ({ positionContext }) => {
  expect(positionContext.moveResult?.request.method()).toBe('PUT');
});

Then('the update request identifies the candidate that was moved', async ({ positionContext }) => {
  const url = new URL(positionContext.moveResult!.request.url());
  expect(url.pathname).toMatch(new RegExp(`/candidates/${positionContext.candidateToMove.id}$`));
});

Then("the update request specifies the next phase as the candidate's new phase", async ({ positionContext }) => {
  const body = positionContext.moveResult!.request.postDataJSON() as { currentInterviewStep: number };
  expect(body.currentInterviewStep).toBe(positionContext.nextPhase.id);
});

Then('the backend confirms the update completed successfully', async ({ positionContext }) => {
  expect(positionContext.moveResult?.response?.ok()).toBe(true);
});

Then("the candidate's phase remains the next phase after the position detail page is reloaded", async ({
  positionsPage,
  positionContext,
}) => {
  await positionsPage.reload(positionContext.positionId);
  await expect(
    positionsPage.candidateCardInColumn(positionContext.nextPhase.id, positionContext.candidateToMove.id),
  ).toBeVisible();
});
