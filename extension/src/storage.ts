import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ActivityEvent, StoredEventRow } from './types';
import { logger } from './logger';

/**
 * SQLite persistence layer using sql.js (pure WASM — no native bindings).
 *
 * The database lives in memory and is flushed to disk after mutations
 * via a debounced save. This gives us crash-safe persistence without
 * blocking the extension host on every insert.
 */
export class Storage {
  private db!: SqlJsDatabase;
  private dbPath: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly SAVE_DEBOUNCE_MS = 1000;

  private constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  static async create(storagePath: string): Promise<Storage> {
    fs.mkdirSync(storagePath, { recursive: true });
    const dbPath = path.join(storagePath, 'codetown.db');

    const wasmPath = path.join(__dirname, 'sql-wasm.wasm');
    const SQL = await initSqlJs({ locateFile: () => wasmPath });
    const instance = new Storage(dbPath);

    if (fs.existsSync(dbPath)) {
      instance.db = new SQL.Database(fs.readFileSync(dbPath));
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
        id           TEXT PRIMARY KEY,
        session_id   TEXT NOT NULL,
        user_id_hash TEXT NOT NULL,
        team_id      TEXT,
        ts           INTEGER NOT NULL,
        type         TEXT NOT NULL,
        language     TEXT NOT NULL,
        repo_hash    TEXT NOT NULL,
        file_hash    TEXT NOT NULL,
        idle         INTEGER NOT NULL DEFAULT 0,
        mode         TEXT NOT NULL DEFAULT 'coding',
        uploaded     INTEGER NOT NULL DEFAULT 0
      )
    `);
    this.db.run('CREATE INDEX IF NOT EXISTS idx_events_uploaded ON events(uploaded)');
    this.db.run('CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts)');

    // Migrate older databases that lack the mode column.
    try {
      this.db.run("ALTER TABLE events ADD COLUMN mode TEXT NOT NULL DEFAULT 'coding'");
    } catch {
      // Column already exists — expected on normal startups.
    }
  }

  insertEvent(event: ActivityEvent): void {
    try {
      this.runInsert(event);
      this.scheduleSave();
    } catch (err) {
      logger.error('Failed to insert event', err);
    }
  }

  insertEvents(events: ActivityEvent[]): void {
    if (events.length === 0) return;
    try {
      this.db.run('BEGIN TRANSACTION');
      for (const event of events) this.runInsert(event);
      this.db.run('COMMIT');
      this.scheduleSave();
    } catch (err) {
      try { this.db.run('ROLLBACK'); } catch { /* already rolled back */ }
      logger.error('Failed to batch-insert events', err);
    }
  }

  getUnuploadedEvents(limit: number = 200): StoredEventRow[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM events WHERE uploaded = 0 ORDER BY ts ASC LIMIT ?');
      stmt.bind([limit]);
      const rows: StoredEventRow[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as unknown as StoredEventRow);
      stmt.free();
      return rows;
    } catch (err) {
      logger.error('Failed to read unuploaded events', err);
      return [];
    }
  }

  getRecentEvents(limit: number = 50): StoredEventRow[] {
    try {
      const stmt = this.db.prepare('SELECT * FROM events ORDER BY ts DESC LIMIT ?');
      stmt.bind([limit]);
      const rows: StoredEventRow[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as unknown as StoredEventRow);
      stmt.free();
      return rows;
    } catch (err) {
      logger.error('Failed to read recent events', err);
      return [];
    }
  }

  getStats(): { total: number; pending: number } {
    try {
      const all = this.db.exec('SELECT COUNT(*) FROM events');
      const pending = this.db.exec('SELECT COUNT(*) FROM events WHERE uploaded = 0');
      return {
        total: (all[0]?.values[0]?.[0] as number) ?? 0,
        pending: (pending[0]?.values[0]?.[0] as number) ?? 0,
      };
    } catch (err) {
      logger.error('Failed to read stats', err);
      return { total: 0, pending: 0 };
    }
  }

  markUploaded(ids: string[]): void {
    if (ids.length === 0) return;
    try {
      this.db.run('BEGIN TRANSACTION');
      for (const id of ids) this.db.run('UPDATE events SET uploaded = 1 WHERE id = ?', [id]);
      this.db.run('COMMIT');
      this.scheduleSave();
    } catch (err) {
      try { this.db.run('ROLLBACK'); } catch { /* already rolled back */ }
      logger.error('Failed to mark events as uploaded', err);
    }
  }

  cleanOldUploaded(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): void {
    try {
      this.db.run('DELETE FROM events WHERE uploaded = 1 AND ts < ?', [Date.now() - maxAgeMs]);
      this.scheduleSave();
    } catch (err) {
      logger.error('Failed to clean old events', err);
    }
  }

  saveToDisk(): void {
    try {
      const data = this.db.export();
      fs.writeFileSync(this.dbPath, Buffer.from(data));
    } catch (err) {
      logger.error('Failed to persist database to disk', err);
    }
  }

  close(): void {
    try {
      if (this.saveTimer) { clearTimeout(this.saveTimer); this.saveTimer = null; }
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
        (id, session_id, user_id_hash, team_id, ts, type, language, repo_hash, file_hash, idle, mode, uploaded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [
        event.id, event.session_id, event.user_id_hash,
        event.team_id ?? null, event.ts, event.type,
        event.language, event.repo_hash, event.file_hash,
        event.idle ? 1 : 0, event.mode,
      ],
    );
  }

  private scheduleSave(): void {
    if (this.saveTimer) return;
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveToDisk();
    }, this.SAVE_DEBOUNCE_MS);
  }
}
