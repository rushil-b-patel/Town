import { DeveloperMode, EventType, LearningMetrics } from './types';

/**
 * Sliding window entry. Stores only what's needed for pattern analysis —
 * no PII, no content.
 */
interface WindowEntry {
  ts: number;
  type: EventType;
  fileHash: string;
}

const WINDOW_MS = 5 * 60 * 1000;
const MIN_DATA_MS = 30 * 1000;
const MIN_EVENTS = 3;

/**
 * Detects whether a developer is actively coding or in a learning/exploration
 * phase by analyzing behavioral patterns over a sliding time window.
 *
 * Learning signals:
 *  - High tab-switch rate with low edit rate → browsing, not writing
 *  - Many distinct files touched with few edits → exploring a codebase
 *
 * The detector makes no judgment about productivity — learning is a
 * legitimate and important part of development work.
 */
export class LearningDetector {
  private window: WindowEntry[] = [];
  private currentMode: DeveloperMode = 'coding';

  /**
   * Feed an event into the detector. Call this on every tracker emission.
   * The idle flag comes from IdleManager so the detector doesn't need
   * its own timing logic.
   */
  recordEvent(type: EventType, fileHash: string, isIdle: boolean): void {
    const now = Date.now();
    this.window.push({ ts: now, type, fileHash });
    this.prune(now);
    this.currentMode = this.classify(isIdle);
  }

  getMode(): DeveloperMode {
    return this.currentMode;
  }

  getMetrics(): LearningMetrics {
    const now = Date.now();
    this.prune(now);

    if (this.window.length < MIN_EVENTS) {
      return {
        mode: this.currentMode,
        windowSeconds: 0,
        tabSwitchRate: 0,
        editRate: 0,
        uniqueFiles: 0,
        editToSwitchRatio: 0,
      };
    }

    const span = this.window[this.window.length - 1].ts - this.window[0].ts;
    const minutes = Math.max(span / 60_000, 0.5);
    const switches = this.countType('active_editor_change');
    const edits = this.countType('edit');
    const unique = this.countUniqueFiles();

    return {
      mode: this.currentMode,
      windowSeconds: Math.round(span / 1000),
      tabSwitchRate: round2(switches / minutes),
      editRate: round2(edits / minutes),
      uniqueFiles: unique,
      editToSwitchRatio: switches > 0 ? round2(edits / switches) : edits > 0 ? 1 : 0,
    };
  }

  private classify(isIdle: boolean): DeveloperMode {
    if (isIdle) return 'idle';
    if (this.window.length < MIN_EVENTS) return 'coding';

    const span = this.window[this.window.length - 1].ts - this.window[0].ts;
    if (span < MIN_DATA_MS) return 'coding';

    const minutes = span / 60_000;
    const switches = this.countType('active_editor_change');
    const edits = this.countType('edit');
    const unique = this.countUniqueFiles();
    const switchRate = switches / minutes;
    const editRate = edits / minutes;
    const ratio = switches > 0 ? edits / switches : edits > 0 ? 1 : 0;

    if (switchRate > 3 && editRate < 1) return 'learning';
    if (unique >= 5 && ratio < 0.3) return 'learning';

    return 'coding';
  }

  private prune(now: number): void {
    const cutoff = now - WINDOW_MS;
    let i = 0;
    while (i < this.window.length && this.window[i].ts < cutoff) i++;
    if (i > 0) this.window.splice(0, i);
  }

  private countType(type: EventType): number {
    let n = 0;
    for (const e of this.window) if (e.type === type) n++;
    return n;
  }

  private countUniqueFiles(): number {
    const set = new Set<string>();
    for (const e of this.window) set.add(e.fileHash);
    return set.size;
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
