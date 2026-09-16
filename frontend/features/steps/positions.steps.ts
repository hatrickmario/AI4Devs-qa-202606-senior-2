import { expect } from '@playwright/test';
import { Given, When, Then } from '../fixtures';
import { fetchCandidates, fetchPositionPhases, fetchPositionTitle } from '../support/api';

const POSITION_ID = Number(process.env.POSITION_ID ?? 1);

Given('a published job position exists with a configured interview process', async ({ positionContext }) => {
  positionContext.positionId = POSITION_ID;
  positionContext.title = await fetchPositionTitle(POSITION_ID);
  positionContext.phases = await fetchPositionPhases(POSITION_ID);
  expect(positionContext.phases.length, 'seeded position has no configured interview phases').toBeGreaterThan(0);
});

Given('that position has candidates assigned to different phases of its process', async ({ positionContext }) => {
  positionContext.candidates = await fetchCandidates(positionContext.positionId, positionContext.phases);
  expect(positionContext.candidates.length, 'seeded position has no candidates to validate phase placement').toBeGreaterThan(0);
});

When('I open the detail page for that position', async ({ positionsPage, positionContext }) => {
  // goto() also asserts both backend calls the board depends on responded successfully.
  await positionsPage.goto(positionContext.positionId);
});

Then('the page loads without errors', async ({ positionsPage }) => {
  await expect(positionsPage.title).toBeVisible();
});

Then('the position title is displayed', async ({ positionsPage }) => {
  await expect(positionsPage.title).toBeVisible();
});

Then("a column is displayed for every phase of that position's interview process", async ({
  positionsPage,
  positionContext,
}) => {
  const displayedColumns = await positionsPage.columnNames();
  for (const phase of positionContext.phases) {
    expect(displayedColumns).toContain(phase.name);
  }
});

Then('every candidate assigned to that position is displayed as a card', async ({
  positionsPage,
  positionContext,
}) => {
  for (const candidate of positionContext.candidates) {
    await expect(positionsPage.candidateCard(candidate.id)).toBeVisible();
  }
});

Then('the title shown on the page matches the title of that position', async ({
  positionsPage,
  positionContext,
}) => {
  await expect(positionsPage.title).toHaveText(positionContext.title);
});

Then('the number of columns displayed equals the number of phases configured for that position', async ({
  positionsPage,
  positionContext,
}) => {
  const displayedColumns = await positionsPage.columnNames();
  expect(displayedColumns).toHaveLength(positionContext.phases.length);
});

Then('the columns are displayed in the same order as the phases configured for that position', async ({
  positionsPage,
  positionContext,
}) => {
  const displayedColumns = await positionsPage.columnNames();
  const expectedOrder = positionContext.phases.map((phase) => phase.name);
  expect(displayedColumns).toEqual(expectedOrder);
});

Then("each column's name matches the name of its corresponding configured phase", async ({
  positionsPage,
  positionContext,
}) => {
  const displayedColumns = await positionsPage.columnNames();
  const expectedNames = positionContext.phases.map((phase) => phase.name);
  expect(new Set(displayedColumns)).toEqual(new Set(expectedNames));
});

Then("no column is displayed for a phase that does not belong to that position's interview process", async ({
  positionsPage,
  positionContext,
}) => {
  const displayedColumns = await positionsPage.columnNames();
  const expectedNames = new Set(positionContext.phases.map((phase) => phase.name));
  for (const columnName of displayedColumns) {
    expect(expectedNames.has(columnName)).toBe(true);
  }
});

Then("each candidate card is displayed under the column corresponding to that candidate's current phase", async ({
  positionsPage,
  positionContext,
}) => {
  for (const candidate of positionContext.candidates) {
    await expect(positionsPage.candidateCardInColumn(candidate.phaseId, candidate.id)).toBeVisible();
  }
});

Then('no candidate card is displayed under a column that does not match their current phase', async ({
  positionsPage,
  positionContext,
}) => {
  for (const candidate of positionContext.candidates) {
    const otherPhases = positionContext.phases.filter((phase) => phase.id !== candidate.phaseId);
    for (const phase of otherPhases) {
      await expect(positionsPage.candidateCardInColumn(phase.id, candidate.id)).toHaveCount(0);
    }
  }
});

Then('a column with no candidates currently in that phase is displayed empty', async ({
  positionsPage,
  positionContext,
}) => {
  const phaseIdsWithCandidates = new Set(positionContext.candidates.map((candidate) => candidate.phaseId));
  const emptyPhases = positionContext.phases.filter((phase) => !phaseIdsWithCandidates.has(phase.id));
  for (const phase of emptyPhases) {
    expect(await positionsPage.candidateCountInColumn(phase.id)).toBe(0);
  }
});
