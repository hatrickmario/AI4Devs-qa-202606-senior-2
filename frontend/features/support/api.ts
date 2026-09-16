import { Candidate, Phase } from './PositionContext';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:3010';

type PositionDto = { id: number; title: string };

type InterviewFlowResponseDto = {
  interviewFlow: {
    positionName: string;
    interviewFlow: {
      interviewSteps: Array<{ id: number; name: string; orderIndex: number }>;
    };
  };
};

type CandidateDto = { candidateId: number; fullName: string; currentInterviewStep: string };

export async function fetchPositionTitle(positionId: number): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/positions`);
  const positions: PositionDto[] = await response.json();
  const position = positions.find((p) => p.id === positionId);
  if (!position) {
    throw new Error(
      `Position ${positionId} was not found via GET /positions. Make sure the backend is running and seeded.`,
    );
  }
  return position.title;
}

export async function fetchPositionPhases(positionId: number): Promise<Phase[]> {
  const response = await fetch(`${API_BASE_URL}/positions/${positionId}/interviewflow`);
  const data: InterviewFlowResponseDto = await response.json();
  return data.interviewFlow.interviewFlow.interviewSteps.map((step) => ({
    id: step.id,
    name: step.name,
    orderIndex: step.orderIndex,
  }));
}

export async function fetchCandidates(positionId: number, phases: Phase[]): Promise<Candidate[]> {
  const response = await fetch(`${API_BASE_URL}/positions/${positionId}/candidates`);
  const candidates: CandidateDto[] = await response.json();
  const phaseIdByName = new Map(phases.map((phase) => [phase.name, phase.id]));

  return candidates.map((candidate) => {
    const phaseId = phaseIdByName.get(candidate.currentInterviewStep);
    if (phaseId === undefined) {
      throw new Error(
        `Candidate "${candidate.fullName}" is in phase "${candidate.currentInterviewStep}", which is not ` +
          `part of position ${positionId}'s configured interview flow`,
      );
    }
    return {
      id: candidate.candidateId,
      fullName: candidate.fullName,
      phaseId,
      phaseName: candidate.currentInterviewStep,
    };
  });
}

/** Re-reads a candidate's phase straight from the backend, independent of whatever the UI shows. */
export async function fetchCandidateCurrentPhaseName(positionId: number, candidateId: number): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/positions/${positionId}/candidates`);
  const candidates: CandidateDto[] = await response.json();
  const candidate = candidates.find((c) => c.candidateId === candidateId);
  if (!candidate) {
    throw new Error(`Candidate ${candidateId} was not found via GET /positions/${positionId}/candidates after the move`);
  }
  return candidate.currentInterviewStep;
}
