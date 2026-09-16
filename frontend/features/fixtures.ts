import { test as base, createBdd } from 'playwright-bdd';
import { PositionsPage } from './pages/PositionsPage';
import { PositionContext } from './support/PositionContext';

type Fixtures = {
  positionsPage: PositionsPage;
  positionContext: PositionContext;
};

export const test = base.extend<Fixtures>({
  positionsPage: async ({ page }, use) => {
    await use(new PositionsPage(page));
  },
  positionContext: async ({}, use) => {
    await use(new PositionContext());
  },
});

export const { Given, When, Then } = createBdd(test);
