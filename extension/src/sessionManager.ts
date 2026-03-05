import { randomUUID } from 'node:crypto';
import { SprintInfo } from './types';

/**
 * Session timeout: 30 minutes of inactivity rotates the session.
 * This groups activity into logical "coding sessions" for analytics.
 */
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Sprint detection constants.
 * A sprint is continuous activity >= 25 minutes with no idle gap > 120 seconds.
 */
const SPRINT_MIN_DURATION_MS = 25 * 60 * 1000;
const SPRINT_MAX_GAP_MS = 120 * 1000; // 2 minutes

export class SessionManager {
  private sessionId: string;
  private sessionStartTs: number;
  private lastEventTs: number;

  private sprintStartTs: number | null = null;
  private sprintLastEventTs: number | null = null;
  private sprintEventCount: number = 0;
  private completedSprints: SprintInfo[] = [];

  constructor() {
    const now = Date.now();
    this.sessionId = randomUUID();
    this.sessionStartTs = now;
    this.lastEventTs = now;
  }

  /**
   * Returns the current session ID, rotating if the session has timed out.
   * Must be called before building each event to get the correct session.
   */
  getSessionId(): string {
    this.maybeRotateSession();
    return this.sessionId;
  }

  /** Record that an event just occurred — keeps session and sprint alive. */
  recordEvent(): void {
    const now = Date.now();
    this.lastEventTs = now;
    this.updateSprint(now);
  }

  getSessionStartTs(): number {
    return this.sessionStartTs;
  }

  /** Returns completed sprints detected during this extension lifetime. */
  getCompletedSprints(): readonly SprintInfo[] {
    return this.completedSprints;
  }

  private maybeRotateSession(): void {
    const elapsed = Date.now() - this.lastEventTs;
    if (elapsed > SESSION_TIMEOUT_MS) {
      this.finalizeSprint();
      this.sessionId = randomUUID();
      this.sessionStartTs = Date.now();
      this.lastEventTs = Date.now();
    }
  }

  /**
   * Sprint state machine:
   * - If no sprint is in progress and an event arrives, start one.
   * - If a sprint is in progress and the gap since last event <= 60s, extend it.
   * - If the gap exceeds 60s, finalize the sprint (if it met the minimum duration).
   */
  private updateSprint(now: number): void {
    if (this.sprintStartTs === null || this.sprintLastEventTs === null) {
      this.sprintStartTs = now;
      this.sprintLastEventTs = now;
      this.sprintEventCount = 1;
      return;
    }

    const gap = now - this.sprintLastEventTs;

    if (gap > SPRINT_MAX_GAP_MS) {
      this.finalizeSprint();
      this.sprintStartTs = now;
      this.sprintLastEventTs = now;
      this.sprintEventCount = 1;
    } else {
      this.sprintLastEventTs = now;
      this.sprintEventCount++;
    }
  }

  private finalizeSprint(): void {
    if (this.sprintStartTs === null || this.sprintLastEventTs === null) return;

    const duration = this.sprintLastEventTs - this.sprintStartTs;
    if (duration >= SPRINT_MIN_DURATION_MS) {
      const sprint: SprintInfo = {
        startTs: this.sprintStartTs,
        endTs: this.sprintLastEventTs,
        durationMinutes: Math.round(duration / 60_000),
        eventCount: this.sprintEventCount,
      };
      this.completedSprints.push(sprint);
    }

    this.sprintStartTs = null;
    this.sprintLastEventTs = null;
    this.sprintEventCount = 0;
  }
}
