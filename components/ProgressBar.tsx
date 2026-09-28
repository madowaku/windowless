import type { SessionPhase } from '../types';

type ProgressBarProps = {
  phase: SessionPhase;
  phaseProgress: number;
  questionIndex: number;
};

export function ProgressBar({ phase, phaseProgress, questionIndex }: ProgressBarProps) {
  const progress = phase === 'gabor'
    ? 0.68 + ((questionIndex + Math.min(1, phaseProgress)) / 3) * 0.27
    : phase === 'result'
      ? 0.95 + phaseProgress * 0.05
      : phase === 'pseudo-window'
        ? phaseProgress * 0.34
        : 0.34 + phaseProgress * 0.34;

  return (
    <div className="progress-track" role="progressbar" aria-label="Session progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
      <div className="progress-fill" style={{ transform: `scaleX(${Math.min(1, Math.max(0, progress))})` }} />
    </div>
  );
}
