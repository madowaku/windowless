import { createAngleSequence, getCorrectChoiceIndex } from './gabor';
import type { SessionPhase } from '../types';

export const PSEUDO_WINDOW_MS = 20_000;
export const GAZE_DRIFT_MS = 20_000;
export const RESULT_MS = 3_000;
export const GABOR_EXPOSURE_MS = 1_250;
export const GABOR_FIRST_QUESTION_INSTRUCTION_MS = 1_800;
export const ANSWER_FEEDBACK_MS = 420;

export type SessionState = {
  phase: SessionPhase;
  phaseStartedAt: number;
  now: number;
  questionIndex: number;
  correctCount: number;
  angles: ReturnType<typeof createAngleSequence>;
  questionStartedAt: number;
  feedback: 'correct' | 'incorrect' | null;
  selectedChoice: number | null;
  feedbackUntil: number | null;
};

export type SessionAction =
  | { type: 'tick'; now: number }
  | { type: 'answer'; choiceIndex: number; now: number };

export function createSession(now: number, random: () => number = Math.random): SessionState {
  return {
    phase: 'pseudo-window',
    phaseStartedAt: now,
    now,
    questionIndex: 0,
    correctCount: 0,
    angles: createAngleSequence(random),
    questionStartedAt: now,
    feedback: null,
    selectedChoice: null,
    feedbackUntil: null,
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  if (action.type === 'answer') {
    if (
      state.phase !== 'gabor' ||
      state.feedbackUntil !== null ||
      action.now - state.questionStartedAt < GABOR_EXPOSURE_MS
        + (state.questionIndex === 0 ? GABOR_FIRST_QUESTION_INSTRUCTION_MS : 0)
    ) return state;

    const isCorrect = action.choiceIndex === getCorrectChoiceIndex(state.angles[state.questionIndex].angleDeg);
    return {
      ...state,
      now: action.now,
      feedback: isCorrect ? 'correct' : 'incorrect',
      selectedChoice: action.choiceIndex,
      feedbackUntil: action.now + ANSWER_FEEDBACK_MS,
      correctCount: state.correctCount + Number(isCorrect),
    };
  }

  let next = { ...state, now: action.now };

  if (state.phase === 'pseudo-window' && action.now - state.phaseStartedAt >= PSEUDO_WINDOW_MS) {
    next = {
      ...next,
      phase: 'gaze-drift',
      phaseStartedAt: state.phaseStartedAt + PSEUDO_WINDOW_MS,
    };
  }

  if (next.phase === 'gaze-drift' && action.now - next.phaseStartedAt >= GAZE_DRIFT_MS) {
    next = {
      ...next,
      phase: 'gabor',
      phaseStartedAt: next.phaseStartedAt + GAZE_DRIFT_MS,
      questionStartedAt: action.now,
    };
  }

  if (next.phase === 'gabor' && next.feedbackUntil !== null && action.now >= next.feedbackUntil) {
    const nextQuestionIndex = next.questionIndex + 1;
    if (nextQuestionIndex >= next.angles.length) {
      next = {
        ...next,
        phase: 'result',
        phaseStartedAt: next.feedbackUntil,
        questionIndex: nextQuestionIndex,
        feedback: null,
        feedbackUntil: null,
      };
    } else {
      next = {
        ...next,
        questionIndex: nextQuestionIndex,
        questionStartedAt: action.now,
        feedback: null,
        selectedChoice: null,
        feedbackUntil: null,
      };
    }
  }

  return next;
}

export function calculateSessionResult(correctCount: number) {
  const boundedCount = Number.isFinite(correctCount)
    ? Math.min(3, Math.max(0, Math.floor(correctCount)))
    : 0;
  return { correctCount: boundedCount, questionCount: 3 };
}
