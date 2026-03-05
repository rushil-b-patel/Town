import { getPool } from '../db/pool';
import { computeActiveTime } from './activeTime';

interface RawRow {
  user_id_hash: string;
  team_id: string | null;
  ts: string;
  type: string;
  language: string;
  repo_hash: string;
  file_hash: string;
  idle: boolean;
  mode: string;
}

/**
 * Processes raw events for a given hour and upserts into hourly_rollups.
 *
 * @param hourStart  Start of the hour (inclusive), as a Date
 * @param hourEnd    End of the hour (exclusive), as a Date
 * @param idleThresholdMs  Gap threshold for active time calculation
 */
export async function rollupHour(
  hourStart: Date,
  hourEnd: Date,
  idleThresholdMs: number,
): Promise<number> {
  const pool = getPool();
  const startMs = hourStart.getTime();
  const endMs = hourEnd.getTime();

  const { rows } = await pool.query<RawRow>(
    `SELECT user_id_hash, team_id, ts, type, language, repo_hash, file_hash, idle, mode
     FROM raw_events
     WHERE ts >= $1 AND ts < $2
     ORDER BY user_id_hash, ts`,
    [startMs, endMs],
  );

  if (rows.length === 0) return 0;

  // Group by (user, language, repo, mode)
  const groups = new Map<string, RawRow[]>();
  for (const row of rows) {
    const key = `${row.user_id_hash}|${row.language}|${row.repo_hash}|${row.mode}`;
    let arr = groups.get(key);
    if (!arr) { arr = []; groups.set(key, arr); }
    arr.push(row);
  }

  let upserted = 0;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const [, groupRows] of groups) {
      const first = groupRows[0];
      const events = groupRows.map(r => ({ ts: Number(r.ts), idle: r.idle }));
      const { activeMs, idleMs } = computeActiveTime(events, idleThresholdMs);

      const fileHashes = new Set(groupRows.map(r => r.file_hash));

      let editCount = 0, saveCount = 0, switchCount = 0, focusCount = 0;
      for (const r of groupRows) {
        if (r.type === 'edit') editCount++;
        else if (r.type === 'save') saveCount++;
        else if (r.type === 'active_editor_change') switchCount++;
        else if (r.type === 'focus') focusCount++;
      }

      await client.query(
        `INSERT INTO hourly_rollups
          (user_id_hash, team_id, hour_ts, language, repo_hash, mode,
           active_seconds, idle_seconds, edit_count, save_count, switch_count, focus_count, unique_files)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (user_id_hash, hour_ts, language, repo_hash, mode)
         DO UPDATE SET
           active_seconds = EXCLUDED.active_seconds,
           idle_seconds   = EXCLUDED.idle_seconds,
           edit_count     = EXCLUDED.edit_count,
           save_count     = EXCLUDED.save_count,
           switch_count   = EXCLUDED.switch_count,
           focus_count    = EXCLUDED.focus_count,
           unique_files   = EXCLUDED.unique_files`,
        [
          first.user_id_hash, first.team_id, hourStart.toISOString(),
          first.language, first.repo_hash, first.mode,
          Math.round(activeMs / 1000), Math.round(idleMs / 1000),
          editCount, saveCount, switchCount, focusCount, fileHashes.size,
        ],
      );
      upserted++;
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return upserted;
}
