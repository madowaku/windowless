/**
 * Maps performance.now() to time actually spent with the break window active.
 * Switching away must not silently consume a visual scene or its result.
 * All timestamps (including answers) must use the same clock.
 */
export function createActiveClock(startedAt: number) {
  let pausedAt: number | null = null;
  let pausedDuration = 0;

  return {
    isActive: () => pausedAt === null,
    now(realNow: number): number {
      return (pausedAt ?? realNow) - pausedDuration;
    },
    setActive(active: boolean, realNow: number): number {
      if (!active && pausedAt === null) {
        pausedAt = realNow;
      } else if (active && pausedAt !== null) {
        pausedDuration += Math.max(0, realNow - pausedAt);
        pausedAt = null;
      }
      return (pausedAt ?? realNow) - pausedDuration;
    },
  };
}
