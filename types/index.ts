export type SessionPhase = 'pseudo-window' | 'gaze-drift' | 'gabor' | 'result';

export type WindowlessStorage = {
  sessionCount: number;
  contrastLevel: number;
  totalCorrect: number;
  totalQuestions: number;
  lastPlayedAt: number | null;
};

export type GaborChoice = {
  angleDeg: 0 | 45 | 90 | 135;
  symbol: '─' | '╱' | '│' | '╲';
  label: string;
};
