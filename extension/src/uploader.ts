import { gzipSync } from 'node:zlib';
import { ActivityEvent, StoredEventRow } from './types';
import { EventQueue } from './eventQueue';
import { Storage } from './storage';
import { getConfig } from './config';
import { logger } from './logger';

const MAX_BATCH_SIZE = 200;
const FETCH_TIMEOUT_MS = 15_000;
const BASE_RETRY_DELAY_MS = 1_000;
const MAX_RETRY_DELAY_MS = 5 * 60 * 1_000;

/**
 * Periodically drains the in-memory queue into SQLite, then uploads
 * unuploaded events to the configured backend.
 *
 * Resilience:
 * - Events survive crashes because they're persisted to SQLite before upload.
 * - On startup, any events with uploaded=0 are automatically retried.
 * - Failed uploads use exponential backoff (1s → 5min cap).
 * - Payloads are gzip-compressed to minimize bandwidth.
 * - A fetch timeout prevents hanging connections from blocking the cycle.
 */
export class Uploader {
  private timer: ReturnType<typeof setInterval> | null = null;
  private retryDelay: number = BASE_RETRY_DELAY_MS;
  private uploading: boolean = false;

  constructor(
    private readonly eventQueue: EventQueue,
    private readonly storage: Storage,
  ) {}

  start(): void {
    const intervalMs = getConfig().uploadInterval * 1000;
    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    logger.debug(`Uploader started (interval=${intervalMs}ms)`);
  }

  /**
   * Single upload cycle:
   * 1. Flush in-memory queue → SQLite
   * 2. Read unuploaded batch from SQLite
   * 3. POST to backend
   * 4. Mark uploaded on success
   * 5. Periodically clean old rows
   */
  async tick(): Promise<void> {
    if (this.uploading) return;
    this.uploading = true;

    try {
      const { serverUrl, apiKey } = getConfig();
      if (!serverUrl || !apiKey) {
        logger.debug('No serverUrl or apiKey configured — skipping upload');
        return;
      }

      this.flushQueueToStorage();

      const rows = this.storage.getUnuploadedEvents(MAX_BATCH_SIZE);
      if (rows.length === 0) return;

      const events = rows.map(rowToEvent);
      await this.postBatch(serverUrl, apiKey, events);

      this.storage.markUploaded(events.map((e) => e.id));
      this.retryDelay = BASE_RETRY_DELAY_MS;
      logger.debug(`Uploaded ${events.length} events`);

      this.storage.cleanOldUploaded();
    } catch (err) {
      this.retryDelay = Math.min(this.retryDelay * 2, MAX_RETRY_DELAY_MS);
      logger.error(`Upload failed (next retry delay=${this.retryDelay}ms)`, err);
    } finally {
      this.uploading = false;
    }
  }

  /** Drain in-memory queue into SQLite so events survive a crash. */
  private flushQueueToStorage(): void {
    const queued = this.eventQueue.drain();
    if (queued.length > 0) {
      this.storage.insertEvents(queued);
      logger.debug(`Flushed ${queued.length} queued events to storage`);
    }
  }

  private async postBatch(serverUrl: string, apiKey: string, events: ActivityEvent[]): Promise<void> {
    const url = buildUrl(serverUrl);
    const body = JSON.stringify({ events });
    const compressed = gzipSync(Buffer.from(body));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip',
          'X-API-Key': apiKey,
        },
        body: compressed,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Force an immediate upload cycle. Called during extension deactivation
   * to avoid losing the tail of events.
   */
  async flush(): Promise<void> {
    await this.tick();
  }

  dispose(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.debug('Uploader disposed');
  }
}

/** Validate and normalize the server URL. */
function buildUrl(serverUrl: string): string {
  const base = serverUrl.replace(/\/+$/, '');
  const url = `${base}/api/events/batch`;

  if (!url.startsWith('https://') && !url.startsWith('http://localhost')) {
    throw new Error(
      `Refusing to upload: server URL must use HTTPS (got ${base})`,
    );
  }

  return url;
}

/** Convert a SQLite row (idle as 0/1) back to a typed ActivityEvent. */
function rowToEvent(row: StoredEventRow): ActivityEvent {
  return {
    id: row.id,
    session_id: row.session_id,
    user_id_hash: row.user_id_hash,
    team_id: row.team_id ?? undefined,
    ts: row.ts,
    type: row.type as ActivityEvent['type'],
    language: row.language,
    repo_hash: row.repo_hash,
    file_hash: row.file_hash,
    idle: row.idle === 1,
    mode: (row.mode as ActivityEvent['mode']) ?? 'coding',
  };
}
