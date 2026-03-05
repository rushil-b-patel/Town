import { getPool } from '../db/pool';

const SPRINT_MIN_MS = 25 * 60 * 1000;
const SPRINT_GAP_MS = 60 * 1000;

interface EventRow {
  user_id_hash: string;
  team_id: string | null;
  session_id: string;
  ts: string;
  idle: boolean;
}

/**
 * Detects sprints from raw events within a time range and upserts them.
 * A sprint: continuous non-idle activity >= 25 min with no gap > 60s.
 */
export async function detectSprints(startMs: number, endMs: number): Promise<number> {
  const pool = getPool();

  const { rows } = await pool.query<EventRow>(
    `SELECT user_id_hash, team_id, session_id, ts, idle
     FROM raw_events
     WHERE ts >= $1 AND ts < $2 AND idle = false
     ORDER BY user_id_hash, ts`,
    [startMs, endMs],
  );

  if (rows.length === 0) return 0;

  const sprints: Array<{
    user: string; team: string | null; session: string;
    start: number; end: number; count: number;
  }> = [];

  let currentUser = '';
  let sprintStart = 0;
  let sprintEnd = 0;
  let sprintSession = '';
  let sprintCount = 0;

  function finalizeSprint(): void {
    const duration = sprintEnd - sprintStart;
    if (duration >= SPRINT_MIN_MS) {
      sprints.push({
        user: currentUser, team: rows[0]?.team_id ?? null,
        session: sprintSession, start: sprintStart, end: sprintEnd, count: sprintCount,
      });
    }
  }

  for (const row of rows) {
    const ts = parseInt(row.ts, 10);

    if (row.user_id_hash !== currentUser) {
      if (currentUser) finalizeSprint();
      currentUser = row.user_id_hash;
      sprintStart = ts;
      sprintEnd = ts;
      sprintSession = row.session_id;
      sprintCount = 1;
      continue;
    }

    const gap = ts - sprintEnd;
    if (gap <= SPRINT_GAP_MS) {
      sprintEnd = ts;
      sprintCount++;
    } else {
      finalizeSprint();
      sprintStart = ts;
      sprintEnd = ts;
      sprintSession = row.session_id;
      sprintCount = 1;
    }
  }

  if (currentUser) finalizeSprint();

  if (sprints.length === 0) return 0;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const s of sprints) {
      await client.query(
        `INSERT INTO sprints (user_id_hash, team_id, session_id, start_ts, end_ts, duration_minutes, event_count)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (user_id_hash, start_ts) DO NOTHING`,
        [s.user, s.team, s.session, s.start, s.end, Math.round((s.end - s.start) / 60_000), s.count],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  return sprints.length;
}
