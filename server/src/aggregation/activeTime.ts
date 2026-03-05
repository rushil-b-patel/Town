/**
 * Core time-tracking algorithm used by WakaTime, RescueTime, etc.
 *
 * For each consecutive pair of events (e1, e2):
 *   gap = e2.ts - e1.ts
 *   If gap < threshold AND e1 was not idle → count gap as active time.
 *   Otherwise → count as idle time.
 *
 * Events MUST be sorted by ts ascending before calling this.
 */
export function computeActiveTime(
  events: Array<{ ts: number; idle: boolean }>,
  idleThresholdMs: number,
): { activeMs: number; idleMs: number } {
  let activeMs = 0;
  let idleMs = 0;

  for (let i = 1; i < events.length; i++) {
    const gap = events[i].ts - events[i - 1].ts;
    if (gap < idleThresholdMs && !events[i - 1].idle) {
      activeMs += gap;
    } else {
      idleMs += Math.min(gap, idleThresholdMs);
    }
  }

  return { activeMs, idleMs };
}
