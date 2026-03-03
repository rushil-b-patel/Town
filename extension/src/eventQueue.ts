import { ActivityEvent } from './types';
import { logger } from './logger';

/**
 * Hard cap prevents unbounded memory growth if uploads stall.
 * At ~500 bytes/event, 10k events ≈ 5 MB — acceptable headroom.
 */
const MAX_QUEUE_SIZE = 10_000;

/**
 * In-memory buffer that sits between the tracker (producer) and the
 * uploader/storage (consumers).
 *
 * Thread safety: VS Code extensions run on a single JS thread so no
 * mutex is needed, but the API is still designed to be re-entrant safe
 * (no shared mutable iteration).
 */
export class EventQueue {
  private queue: ActivityEvent[] = [];

  /** Enqueue an event, dropping the oldest if the cap is exceeded. */
  push(event: ActivityEvent): void {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      const dropCount = Math.floor(MAX_QUEUE_SIZE * 0.1);
      this.queue.splice(0, dropCount);
      logger.warn(`Queue pressure: dropped ${dropCount} oldest events`);
    }
    this.queue.push(event);
  }

  /**
   * Remove and return up to `size` events from the front of the queue.
   * The caller owns the returned array — the queue no longer references them.
   */
  getBatch(size: number = 200): ActivityEvent[] {
    return this.queue.splice(0, Math.min(size, this.queue.length));
  }

  /** Remove and return all events. Used during flush/shutdown. */
  drain(): ActivityEvent[] {
    const all = this.queue;
    this.queue = [];
    return all;
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }
}
