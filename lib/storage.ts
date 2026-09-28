import { INITIAL_CONTRAST_LEVEL, adjustContrastLevel, clampContrastLevel } from './difficulty';
import type { WindowlessStorage } from '../types';

export const STORAGE_KEY = 'windowless';
export const INITIAL_STORAGE: WindowlessStorage = {
  sessionCount: 0,
  contrastLevel: INITIAL_CONTRAST_LEVEL,
  totalCorrect: 0,
  totalQuestions: 0,
  lastPlayedAt: null,
};

function nonNegativeInteger(value: unknown, fallback = 0): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(value)));
}

export function sanitizeStorage(value: unknown): WindowlessStorage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...INITIAL_STORAGE };
  }

  const candidate = value as Partial<Record<keyof WindowlessStorage, unknown>>;
  const lastPlayedAt = candidate.lastPlayedAt;

  return {
    sessionCount: nonNegativeInteger(candidate.sessionCount),
    contrastLevel:
      typeof candidate.contrastLevel === 'number' && Number.isFinite(candidate.contrastLevel)
        ? clampContrastLevel(candidate.contrastLevel)
        : INITIAL_CONTRAST_LEVEL,
    totalCorrect: nonNegativeInteger(candidate.totalCorrect),
    totalQuestions: nonNegativeInteger(candidate.totalQuestions),
    lastPlayedAt:
      typeof lastPlayedAt === 'number' && Number.isFinite(lastPlayedAt) && lastPlayedAt >= 0
        ? lastPlayedAt
        : null,
  };
}

export function applySessionResult(
  value: unknown,
  correctCount: number,
  playedAt = Date.now(),
): WindowlessStorage {
  const current = sanitizeStorage(value);
  const correct = Math.min(3, Math.max(0, nonNegativeInteger(correctCount)));

  return {
    sessionCount: current.sessionCount + 1,
    contrastLevel: adjustContrastLevel(current.contrastLevel, correct),
    totalCorrect: current.totalCorrect + correct,
    totalQuestions: current.totalQuestions + 3,
    lastPlayedAt: Number.isFinite(playedAt) && playedAt >= 0 ? playedAt : Date.now(),
  };
}

export async function loadWindowlessStorage(): Promise<WindowlessStorage> {
  try {
    const result = await browser.storage.local.get(STORAGE_KEY);
    return sanitizeStorage(result[STORAGE_KEY]);
  } catch {
    return { ...INITIAL_STORAGE };
  }
}

export async function saveSessionResult(
  correctCount: number,
  playedAt = Date.now(),
): Promise<WindowlessStorage> {
  const current = await loadWindowlessStorage();
  const next = applySessionResult(current, correctCount, playedAt);
  await browser.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}
