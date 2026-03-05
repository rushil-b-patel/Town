import { getPool } from '../db/pool';

/**
 * Aggregates hourly rollups for a calendar day into a single daily_summaries row.
 *
 * @param date  The calendar date to summarize (UTC), e.g. '2026-03-03'
 */
export async function summarizeDay(date: string): Promise<number> {
  const pool = getPool();

  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);

  const { rows } = await pool.query(
    `SELECT
       user_id_hash,
       team_id,
       SUM(active_seconds) AS active_sec,
       SUM(idle_seconds) AS idle_sec,
       SUM(CASE WHEN mode = 'coding'   THEN active_seconds ELSE 0 END) AS coding_sec,
       SUM(CASE WHEN mode = 'learning' THEN active_seconds ELSE 0 END) AS learning_sec,
       SUM(edit_count)   AS edits,
       SUM(save_count)   AS saves,
       SUM(switch_count) AS switches,
       json_object_agg(language, lang_sec) FILTER (WHERE lang_sec > 0) AS languages
     FROM (
       SELECT
         user_id_hash, team_id, mode, language,
         SUM(active_seconds) AS active_seconds,
         SUM(idle_seconds) AS idle_seconds,
         SUM(edit_count)   AS edit_count,
         SUM(save_count)   AS save_count,
         SUM(switch_count) AS switch_count,
         SUM(active_seconds) AS lang_sec
       FROM hourly_rollups
       WHERE hour_ts >= $1 AND hour_ts < $2
       GROUP BY user_id_hash, team_id, mode, language
     ) sub
     GROUP BY user_id_hash, team_id`,
    [dayStart.toISOString(), dayEnd.toISOString()],
  );

  if (rows.length === 0) return 0;

  // Get session counts and time bounds from raw events for the day.
  const dayStartMs = dayStart.getTime();
  const dayEndMs = dayEnd.getTime();

  const sessionData = await pool.query(
    `SELECT
       user_id_hash,
       COUNT(DISTINCT session_id) AS session_count,
       MIN(ts) AS first_ts,
       MAX(ts) AS last_ts
     FROM raw_events
     WHERE ts >= $1 AND ts < $2
     GROUP BY user_id_hash`,
    [dayStartMs, dayEndMs],
  );

  const sessionMap = new Map<string, { sessions: number; first: number; last: number }>();
  for (const r of sessionData.rows) {
    sessionMap.set(r.user_id_hash, {
      sessions: parseInt(r.session_count, 10),
      first: parseInt(r.first_ts, 10),
      last: parseInt(r.last_ts, 10),
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const row of rows) {
      const sd = sessionMap.get(row.user_id_hash);

      await client.query(
        `INSERT INTO daily_summaries
          (user_id_hash, team_id, date, total_active_minutes, total_idle_minutes,
           coding_minutes, learning_minutes, languages, session_count,
           first_event_ts, last_event_ts)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
         ON CONFLICT (user_id_hash, date)
         DO UPDATE SET
           total_active_minutes   = EXCLUDED.total_active_minutes,
           total_idle_minutes     = EXCLUDED.total_idle_minutes,
           coding_minutes         = EXCLUDED.coding_minutes,
           learning_minutes       = EXCLUDED.learning_minutes,
           languages              = EXCLUDED.languages,
           session_count          = EXCLUDED.session_count,
           first_event_ts         = EXCLUDED.first_event_ts,
           last_event_ts          = EXCLUDED.last_event_ts`,
        [
          row.user_id_hash, row.team_id, date,
          Math.round(parseInt(row.active_sec, 10) / 60),
          Math.round(parseInt(row.idle_sec, 10) / 60),
          Math.round(parseInt(row.coding_sec, 10) / 60),
          Math.round(parseInt(row.learning_sec, 10) / 60),
          row.languages ?? {},
          sd?.sessions ?? 0,
          sd?.first ?? null,
          sd?.last ?? null,
        ],
      );
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return rows.length;
}
