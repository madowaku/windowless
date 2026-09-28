export const CONTRAST_LEVELS = [0.8, 0.72, 0.65, 0.59, 0.53, 0.48, 0.43, 0.39] as const;
export const MIN_CONTRAST_LEVEL = 1;
export const MAX_CONTRAST_LEVEL = CONTRAST_LEVELS.length;
export const INITIAL_CONTRAST_LEVEL = 3;

export function clampContrastLevel(level: number): number {
  if (!Number.isFinite(level)) return INITIAL_CONTRAST_LEVEL;
  return Math.min(MAX_CONTRAST_LEVEL, Math.max(MIN_CONTRAST_LEVEL, Math.round(level)));
}

export function contrastForLevel(level: number): number {
  return CONTRAST_LEVELS[clampContrastLevel(level) - 1];
}

export function adjustContrastLevel(level: number, correctCount: number): number {
  const change = correctCount === 3 ? 1 : correctCount <= 1 ? -1 : 0;
  return clampContrastLevel(clampContrastLevel(level) + change);
}
