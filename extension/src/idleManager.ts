import { getConfig } from './config';

/**
 * Tracks user activity timing to determine idle state.
 *
 * A user is considered idle when ANY of these conditions hold:
 * 1. Time since last activity exceeds the configured threshold.
 * 2. The VS Code window has lost focus.
 * 3. There is no active text editor.
 *
 * The tracker calls `recordActivity()` on every meaningful interaction.
 * Window state and editor presence are updated by the tracker as well.
 */
export class IdleManager {
  private lastActivityTs: number = Date.now();
  private windowFocused: boolean = true;
  private hasActiveEditor: boolean = false;

  /** Call on every user-initiated event (edit, save, focus, editor switch). */
  recordActivity(): void {
    this.lastActivityTs = Date.now();
  }

  setWindowFocused(focused: boolean): void {
    this.windowFocused = focused;
    if (focused) {
      this.recordActivity();
    }
  }

  setHasActiveEditor(has: boolean): void {
    this.hasActiveEditor = has;
  }

  /**
   * Returns true when the user should be considered idle.
   * Active time is only counted when:
   *   gap < threshold AND window focused AND editor is open.
   */
  isIdle(): boolean {
    const thresholdMs = getConfig().idleThreshold * 1000;
    const elapsed = Date.now() - this.lastActivityTs;
    return elapsed >= thresholdMs || !this.windowFocused || !this.hasActiveEditor;
  }

  getLastActivityTs(): number {
    return this.lastActivityTs;
  }

  isWindowFocused(): boolean {
    return this.windowFocused;
  }

  /** Milliseconds since last recorded activity. */
  getIdleDurationMs(): number {
    return Date.now() - this.lastActivityTs;
  }
}
