import { describe, expect, it } from 'vitest';
import { adjustContrastLevel, clampContrastLevel, contrastForLevel } from '../lib/difficulty';
import { createActiveClock } from '../lib/activeClock';
import { createAngleSequence, GABOR_CHOICES, getCorrectChoiceIndex, renderGabor } from '../lib/gabor';
import { applySessionResult, INITIAL_STORAGE, sanitizeStorage } from '../lib/storage';
import {
  calculateSessionResult,
  createSession,
  GABOR_EXPOSURE_MS,
  GABOR_FIRST_QUESTION_INSTRUCTION_MS,
  sessionReducer,
} from '../lib/session';
import { createBreakWindowController } from '../lib/openBreakWindow';

describe('active-only session clock', () => {
  it('does not consume scene time while the window is hidden or unfocused', () => {
    const clock = createActiveClock(1000);
    expect(clock.now(6000)).toBe(6000);
    expect(clock.setActive(false, 6000)).toBe(6000);
    expect(clock.isActive()).toBe(false);
    expect(clock.now(61_000)).toBe(6000);
    expect(clock.setActive(false, 62_000)).toBe(6000);
    expect(clock.setActive(true, 62_000)).toBe(6000);
    expect(clock.isActive()).toBe(true);
    expect(clock.now(67_000)).toBe(11_000);
    expect(clock.setActive(false, 67_000)).toBe(11_000);
    expect(clock.setActive(true, 87_000)).toBe(11_000);
    expect(clock.now(92_000)).toBe(16_000);
  });

  it('prevents a hidden 40-second interval from skipping the visual phases', () => {
    const clock = createActiveClock(1000);
    let session = createSession(1000, () => 0);
    clock.setActive(false, 6000);
    session = sessionReducer(session, { type: 'tick', now: clock.now(61_000) });
    expect(session.phase).toBe('pseudo-window');
    clock.setActive(true, 61_000);
    session = sessionReducer(session, { type: 'tick', now: clock.now(76_000) });
    expect(session.phase).toBe('gaze-drift');
  });

  it('does not expire the result display while unfocused', () => {
    const clock = createActiveClock(1000);
    clock.setActive(false, 2000);
    expect(clock.now(15_000)).toBe(2000);
    clock.setActive(true, 15_000);
    expect(clock.now(16_000)).toBe(3000);
  });
});

describe('contrast difficulty', () => {
  it('moves one level based on the three answer result and clamps the range', () => {
    expect(adjustContrastLevel(3, 3)).toBe(4);
    expect(adjustContrastLevel(3, 2)).toBe(3);
    expect(adjustContrastLevel(3, 1)).toBe(2);
    expect(adjustContrastLevel(1, 0)).toBe(1);
    expect(adjustContrastLevel(8, 3)).toBe(8);
    expect(clampContrastLevel(99)).toBe(8);
    expect(contrastForLevel(0)).toBe(0.8);
  });
});

describe('storage', () => {
  it('provides defaults for invalid storage and sanitizes individual values', () => {
    expect(sanitizeStorage(null)).toEqual(INITIAL_STORAGE);
    expect(sanitizeStorage({
      sessionCount: -4,
      contrastLevel: 999,
      totalCorrect: 2.8,
      totalQuestions: 'bad',
      lastPlayedAt: Number.NaN,
    })).toEqual({
      sessionCount: 0,
      contrastLevel: 8,
      totalCorrect: 2,
      totalQuestions: 0,
      lastPlayedAt: null,
    });
  });

  it('records a session and adjusts the contrast level', () => {
    expect(applySessionResult(INITIAL_STORAGE, 3, 1234)).toEqual({
      sessionCount: 1,
      contrastLevel: 4,
      totalCorrect: 3,
      totalQuestions: 3,
      lastPlayedAt: 1234,
    });
  });
});

describe('Gabor choices', () => {
  it('maps visual choices to all four angles and chooses three unique angles per session', () => {
    expect(GABOR_CHOICES.map(({ angleDeg }) => angleDeg)).toEqual([90, 45, 0, 135]);
    expect(getCorrectChoiceIndex(0)).toBe(2);

    const sequence = createAngleSequence(() => 0);
    expect(sequence).toHaveLength(3);
    expect(new Set(sequence.map(({ angleDeg }) => angleDeg)).size).toBe(3);
  });

  it('fades the Gabor canvas into its background with the Gaussian envelope', () => {
    const size = 220;
    const image = { data: new Uint8ClampedArray(size * size * 4) };
    const context = {
      createImageData: () => image,
      putImageData: () => undefined,
    } as unknown as CanvasRenderingContext2D;

    renderGabor(context, {
      size,
      angleDeg: 0,
      sigma: 42,
      frequency: 0.045,
      phase: 0,
      contrast: 0.8,
    });

    expect(image.data[3]).toBe(0);
    expect(image.data[((size * Math.floor(size / 2)) * 4) + 3]).toBeLessThan(12);
    expect(image.data[((Math.floor(size / 2) * size + Math.floor(size / 2)) * 4) + 3]).toBe(255);
  });
});

describe('session result', () => {
  it('returns a bounded score out of three', () => {
    expect(calculateSessionResult(2)).toEqual({ correctCount: 2, questionCount: 3 });
    expect(calculateSessionResult(9)).toEqual({ correctCount: 3, questionCount: 3 });
    expect(calculateSessionResult(Number.NaN)).toEqual({ correctCount: 0, questionCount: 3 });
  });

  it('moves through the timed scenes and three answered questions', () => {
    let state = createSession(1000, () => 0);
    state = sessionReducer(state, { type: 'tick', now: 21_000 });
    expect(state.phase).toBe('gaze-drift');
    state = sessionReducer(state, { type: 'tick', now: 41_000 });
    expect(state.phase).toBe('gabor');

    const firstAnswer = sessionReducer(state, {
      type: 'answer',
      choiceIndex: getCorrectChoiceIndex(state.angles[0].angleDeg),
      now: state.questionStartedAt + GABOR_EXPOSURE_MS,
    });
    expect(firstAnswer.feedback).toBeNull();

    for (let index = 0; index < 3; index += 1) {
      const correctIndex = GABOR_CHOICES.findIndex(({ angleDeg }) => angleDeg === state.angles[index].angleDeg);
      const instructionDelay = index === 0 ? GABOR_FIRST_QUESTION_INSTRUCTION_MS : 0;
      state = sessionReducer(state, {
        type: 'answer',
        choiceIndex: correctIndex,
        now: state.questionStartedAt + GABOR_EXPOSURE_MS + instructionDelay,
      });
      state = sessionReducer(state, { type: 'tick', now: state.feedbackUntil ?? 0 });
    }

    expect(state.phase).toBe('result');
    expect(state.correctCount).toBe(3);
  });
});

describe('break window controller', () => {
  it('coalesces rapid launches, focuses the existing window, and clears it on close', async () => {
    let storedId: unknown;
    let creates = 0;
    let focuses = 0;
    const controller = createBreakWindowController({
      create: async () => {
        creates += 1;
        await Promise.resolve();
        return { id: 7 };
      },
      get: async (id) => {
        if (id !== 7) throw new Error('Window is closed');
        return {};
      },
      focus: async () => { focuses += 1; },
      getStoredId: async () => storedId,
      setStoredId: async (id) => { storedId = id; },
      clearStoredId: async () => { storedId = undefined; },
      getUrl: () => 'chrome-extension://test/break.html',
    });

    await Promise.all([controller.open(), controller.open()]);
    expect(creates).toBe(1);
    expect(storedId).toBe(7);

    await controller.open();
    expect(focuses).toBe(1);
    await controller.onWindowRemoved(7);
    expect(storedId).toBeUndefined();
  });
});
