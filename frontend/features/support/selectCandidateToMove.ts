import { Candidate, Phase } from './PositionContext';

/**
 * Deterministically picks the first candidate (in API order) who is not
 * already in the last configured phase, and the phase immediately after
 * theirs. Never hardcodes a phase or candidate name - it adapts to whatever
 * the position's real interview flow and candidates are.
 */
export function pickCandidateWithNextPhase(
  phases: Phase[],
  candidates: Candidate[],
): { candidate: Candidate; nextPhase: Phase } {
  const phaseIndexById = new Map(phases.map((phase, index) => [phase.id, index]));
  const lastIndex = phases.length - 1;

  for (const candidate of candidates) {
    const currentIndex = phaseIndexById.get(candidate.phaseId);
    if (currentIndex !== undefined && currentIndex < lastIndex) {
      return { candidate, nextPhase: phases[currentIndex + 1] };
    }
  }

  throw new Error(
    "No candidate is currently in a phase with a following phase to move them into. Seed data must include " +
      'at least one candidate who is not already in the last configured phase.',
  );
}
