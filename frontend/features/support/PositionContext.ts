import { Request, Response } from '@playwright/test';

export type Phase = {
  id: number;
  name: string;
  orderIndex: number;
};

export type Candidate = {
  id: number;
  fullName: string;
  phaseId: number;
  phaseName: string;
};

export type CandidateMoveResult = {
  request: Request;
  response: Response | null;
};

/**
 * Shared state passed between Given/When/Then steps for a single scenario.
 * Populated from the real backend API so assertions always compare the UI
 * against that position's actual configured data, never a hardcoded list.
 */
export class PositionContext {
  positionId!: number;
  title!: string;
  /** Phases in the exact order the API returns them (the same order the UI renders). */
  phases!: Phase[];
  candidates!: Candidate[];

  // candidate-phase-transition.feature
  /** The candidate selected to be dragged; phaseId/phaseName reflect their phase *before* the move. */
  candidateToMove!: Candidate;
  nextPhase!: Phase;
  moveResult?: CandidateMoveResult;
  /** Uncaught page errors observed since the board was opened. */
  pageErrors: Error[] = [];
}
