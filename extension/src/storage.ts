import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ActivityEvent, StoredEventRow } from './types';
import { logger } from './logger';

/**
 * SQLite persistence layer using sql.js (pure WASM — no native bindings).
 *
 * sql.js operates on an in-memory database. We load from disk on init
 * and flush to disk after every mutating batch to ensure crash safety.
 * A debounced save prevents excessive I/O during rapid event bursts.
 */
export class Storage {
  private db!: SqlJsDatabase;
  private dbPath: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SAVE_DEBOUNCE_MS = 1000;

  private constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Factory — async because sql.js must load its WASM binary first.
   * If a database file already exists on disk it is loaded; otherwise
   * a fresh database is created with the schema applied.
   */
  static async create(storagePath: string): Promise<Storage> {
    fs.mkdirSync(storagePath, { recursive: true });
    const dbPath = path.join(storagePath, 'codetown.db');

    const wasmPath = path.join(__dirname, 'sql-wasm.wasm');
    const SQL = await initSqlJs({
      locateFile: () => wasmPath,
    });
    const instance = new Storage(dbPath);

    if (fs.existsSync(dbPath)) {
      const fileBuffer = fs.readFileSync(dbPath);
      instance.db = new SQL.Database(fileBuffer);
      logger.debug(`Storage loaded existing DB at ${dbPath}`);
    } else {
      instance.db = new SQL.Database();
      logger.debug(`Storage created new DB at ${dbPath}`);
    }

    instance.migrate();
    return instance;
  }

  private migrate(): void {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id          TEXT PRIMARY KEY,
        session_id  TEXT NOT NULL,
        user_id_hash TEXT NOT NULL,
        team_id     TEXT,
        ts          INTEGER NOT NULL,
        type        TEXT NOT NULL,
        language    TEXT NOT NULL,
        repo_hash   TEXT NOT NULL,
        file_hash   TEXT NOT NULL,
        idle        INTEGER NOT NULL DEFAULT 0,
        uploaded    INTEGER NOT NULL DEFAULT 0
      )
    `);
    this.db.run(
      'CREATE INDEX IF NOT EXISTS idx_events_uploaded ON events(uploaded)'
    );
    this.db.run(
      'CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts)'
    );
  }

  /** Insert a single event. Failures are swallowed and logged. */
  insertEvent(event: ActivityEvent): void {
    try {
      this.runInsert(event);
      this.scheduleSave();
    } catch (err) {
      logger.error('Failed to insert event', err);
    }
  }

  /** Batch insert with a single save at the end for performance. */
  insertEvents(events: ActivityEvent[]): void {
    if (events.length === 0) return;
    try {
      this.db.run('BEGIN TRANSACTION');
      for (const event of events) {
        this.runInsert(event);
      }
      this.db.run('COMMIT');
      this.scheduleSave();
    } catch (err) {
      try { this.db.run('ROLLBACK'); } catch { /* already rolled back */ }
      logger.error('Failed to batch-insert events', err);
    }
  }

  /** Retrieve up to `limit` events that have not yet been uploaded. */
  getUnuploadedEvents(limit: number = 200): StoredEventRow[] {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM events WHERE uploaded = 0 ORDER BY ts ASC LIMIT ?'
      );
      stmt.bind([limit]);

      const rows: StoredEventRow[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as StoredEventRow);
      }
      stmt.free();
      return rows;
    } catch (err) {
      logger.error('Failed to read unuploaded events', err);
      return [];
    }
  }

  /**
   * Mark a batch of event IDs as uploaded.
   * Uses a transaction to keep it atomic.
   */
  markUploaded(ids: string[]): void {
    if (ids.length === 0) return;
    try {
      this.db.run('BEGIN TRANSACTION');
      for (const id of ids) {
        this.db.run('UPDATE events SET uploaded = 1 WHERE id = ?', [id]);
      }
      this.db.run('COMMIT');
      this.scheduleSave();
    } catch (err) {
      try { this.db.run('ROLLBACK'); } catch { /* already rolled back */ }
      logger.error('Failed to mark events as uploaded', err);
    }
  }

  /** Retrieve the most recent `limit` events regardless of upload status. */
  getRecentEvents(limit: number = 50): StoredEventRow[] {
    try {
      const stmt = this.db.prepare(
        'SELECT * FROM events ORDER BY ts DESC LIMIT ?'
      );
      stmt.bind([limit]);

      const rows: StoredEventRow[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as unknown as StoredEventRow);
      }
      stmt.free();
      return rows;
    } catch (err) {
      logger.error('Failed to read recent events', err);
      return [];
    }
  }

  /** Get count of total events and unuploaded events. */
  getStats(): { total: number; pending: number } {
    try {
      const allResult = this.db.exec('SELECT COUNT(*) FROM events');
      const pendingResult = this.db.exec(
        'SELECT COUNT(*) FROM events WHERE uploaded = 0'
      );
      const total = allResult[0]?.values[0]?.[0] as number ?? 0;
      const pending = pendingResult[0]?.values[0]?.[0] as number ?? 0;
      return { total, pending };
    } catch (err) {
      logger.error('Failed to read stats', err);
      return { total: 0, pending: 0 };
    }
  }

  /** Remove uploaded events older than `maxAgeMs` (default 7 days). */
  cleanOldUploaded(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
    try {
      const cutoff = Date.now() - maxAgeMs;
      this.db.run('DELETE FROM events WHERE uploaded = 1 AND ts < ?', [cutoff]);
      this.scheduleSave();
    } catch (err) {
      logger.error('Failed to clean old events', err);
    }
  }

  /** Flush in-memory database to disk immediately. */
  saveToDisk(): void {
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch (err) {
      logger.error('Failed to persist database to disk', err);
    }
  }

  /** Gracefully close: cancel pending saves, flush to disk, free memory. */
  close(): void {
    try {
      if (this.saveTimer) {
        clearTimeout(this.saveTimer);
        this.saveTimer = null;
      }
      this.saveToDisk();
      this.db.close();
      logger.debug('Storage closed');
    } catch (err) {
      logger.error('Failed to close database', err);
    }
  }

  private runInsert(event: ActivityEvent): void {
    this.db.run(
      `INSERT OR IGNORE INTO events
        (id, session_id, user_id_hash, team_id, ts, type, language, repo_hash, file_hash, idle, uploaded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        event.id,
        event.session_id,
        event.user_id_hash,
        event.team_id ?? null,
        event.ts,
        event.type,
        event.language,
        event.repo_hash,
        event.file_hash,
        event.idle ? 1 : 0,
      ],
    );
  }

  /**
   * Debounce disk writes so rapid single-event inserts don't thrash I/O.
   * Batch inserts and shutdown bypass the debounce via direct saveToDisk().
   */
  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveToDisk();
    }, this.SAVE_DEBOUNCE_MS);
  }
}
