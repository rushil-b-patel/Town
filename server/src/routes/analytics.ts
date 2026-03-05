import { Router, Request, Response } from 'express';
import { getPool } from '../db/pool';
import { RangeSchema, rangeToDays } from '../types';
import { computeActiveTime } from '../aggregation/activeTime';

const router = Router();

// GET /api/analytics/summary

router.get('/summary', async (req: Request, res: Response) => {
  const teamId = res.locals.teamId as string;
  const user = req.query.user as string | undefined;
  const range = RangeSchema.parse(req.query.range ?? '7d');
  const days = rangeToDays(range);

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffDate = cutoff.toISOString().slice(0, 10);

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  // Historical from daily summaries.
  const histQ = await getPool().query(
    `SELECT
       COALESCE(SUM(total_active_minutes), 0)  AS active,
       COALESCE(SUM(total_idle_minutes), 0)     AS idle,
       COALESCE(SUM(coding_minutes), 0)         AS coding,
       COALESCE(SUM(learning_minutes), 0)       AS learning,
       COALESCE(SUM(session_count), 0)          AS sessions,
       COALESCE(SUM(sprint_count), 0)           AS sprints
     FROM daily_summaries
     WHERE team_id = $1 AND date >= $2::date
       ${user ? 'AND user_id_hash = $3' : ''}`,
    user ? [teamId, cutoffDate, user] : [teamId, cutoffDate],
  );

  // Real-time "today" from raw events.
  const todayRaw = await queryTodayActive(teamId, todayStart.getTime(), user);

  const hist = histQ.rows[0];

  res.json({
    range,
    active_minutes:   parseInt(hist.active, 10) + todayRaw.activeMinutes,
    idle_minutes:     parseInt(hist.idle, 10) + todayRaw.idleMinutes,
    coding_minutes:   parseInt(hist.coding, 10) + todayRaw.codingMinutes,
    learning_minutes: parseInt(hist.learning, 10) + todayRaw.learningMinutes,
    session_count:    parseInt(hist.sessions, 10) + todayRaw.sessions,
    sprint_count:     parseInt(hist.sprints, 10),
  });
});

// GET /api/analytics/daily

router.get('/daily', async (req: Request, res: Response) => {
  const teamId = res.locals.teamId as string;
  const user = req.query.user as string | undefined;
  const range = RangeSchema.parse(req.query.range ?? '7d');
  const days = rangeToDays(range);

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  const { rows } = await getPool().query(
    `SELECT date::text, total_active_minutes, coding_minutes, learning_minutes,
            languages, session_count, sprint_count, streak_days
     FROM daily_summaries
     WHERE team_id = $1 AND date >= $2::date
       ${user ? 'AND user_id_hash = $3' : ''}
     ORDER BY date`,
    user ? [teamId, cutoff.toISOString().slice(0, 10), user] : [teamId, cutoff.toISOString().slice(0, 10)],
  );

  res.json({ range, days: rows });
});

// GET /api/analytics/languages

router.get('/languages', async (req: Request, res: Response) => {
  const teamId = res.locals.teamId as string;
  const user = req.query.user as string | undefined;
  const range = RangeSchema.parse(req.query.range ?? '30d');
  const days = rangeToDays(range);

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  const { rows } = await getPool().query(
    `SELECT language, SUM(active_seconds) / 60 AS minutes
     FROM hourly_rollups
     WHERE team_id = $1 AND hour_ts >= $2
       ${user ? 'AND user_id_hash = $3' : ''}
     GROUP BY language
     ORDER BY minutes DESC`,
    user
      ? [teamId, cutoff.toISOString(), user]
      : [teamId, cutoff.toISOString()],
  );

  const total = rows.reduce((s, r) => s + parseInt(r.minutes, 10), 0);
  res.json({
    range,
    languages: rows.map(r => ({
      language: r.language,
      minutes: parseInt(r.minutes, 10),
      percentage: total > 0 ? Math.round(parseInt(r.minutes, 10) / total * 100) : 0,
    })),
  });
});

// GET /api/analytics/streaks

router.get('/streaks', async (req: Request, res: Response) => {
  const teamId = res.locals.teamId as string;
  const user = req.query.user as string;
  if (!user) { res.status(400).json({ error: 'user query param required' }); return; }

  const { rows } = await getPool().query(
    `SELECT date::text, total_active_minutes, streak_days
     FROM daily_summaries
     WHERE team_id = $1 AND user_id_hash = $2
     ORDER BY date DESC
     LIMIT 365`,
    [teamId, user],
  );

  let currentStreak = 0;
  if (rows.length > 0) currentStreak = rows[0].streak_days ?? 0;

  let longestStreak = 0;
  for (const r of rows) {
    if (r.streak_days > longestStreak) longestStreak = r.streak_days;
  }

  const todayActive = rows.length > 0 && rows[0].total_active_minutes > 0;

  res.json({ current_streak: currentStreak, longest_streak: longestStreak, today_active: todayActive });
});

// GET /api/analytics/sprints

router.get('/sprints', async (req: Request, res: Response) => {
  const teamId = res.locals.teamId as string;
  const user = req.query.user as string | undefined;
  const range = RangeSchema.parse(req.query.range ?? '7d');
  const days = rangeToDays(range);

  const cutoff = Date.now() - days * 86_400_000;

  const { rows } = await getPool().query(
    `SELECT start_ts, end_ts, duration_minutes, event_count
     FROM sprints
     WHERE team_id = $1 AND start_ts >= $2
       ${user ? 'AND user_id_hash = $3' : ''}
     ORDER BY start_ts DESC`,
    user ? [teamId, cutoff, user] : [teamId, cutoff],
  );

  res.json({ range, sprints: rows });
});

// GET /api/analytics/team

router.get('/team', async (req: Request, res: Response) => {
  const teamId = res.locals.teamId as string;
  const range = RangeSchema.parse(req.query.range ?? '7d');
  const days = rangeToDays(range);

  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  const { rows } = await getPool().query(
    `SELECT
       user_id_hash,
       SUM(total_active_minutes) AS active_minutes,
       SUM(coding_minutes)       AS coding_minutes,
       SUM(learning_minutes)     AS learning_minutes,
       SUM(session_count)        AS sessions,
       SUM(sprint_count)         AS sprints
     FROM daily_summaries
     WHERE team_id = $1 AND date >= $2::date
     GROUP BY user_id_hash
     ORDER BY active_minutes DESC`,
    [teamId, cutoff.toISOString().slice(0, 10)],
  );

  res.json({
    range,
    members: rows.map(r => ({
      user_id_hash: r.user_id_hash,
      active_minutes: parseInt(r.active_minutes, 10),
      coding_minutes: parseInt(r.coding_minutes, 10),
      learning_minutes: parseInt(r.learning_minutes, 10),
      sessions: parseInt(r.sessions, 10),
      sprints: parseInt(r.sprints, 10),
    })),
  });
});

// Real-time "today" helper

async function queryTodayActive(
  teamId: string, todayStartMs: number, user?: string,
): Promise<{
  activeMinutes: number; idleMinutes: number;
  codingMinutes: number; learningMinutes: number;
  sessions: number;
}> {
  const { rows } = await getPool().query(
    `SELECT ts, idle, mode, session_id
     FROM raw_events
     WHERE team_id = $1 AND ts >= $2
       ${user ? 'AND user_id_hash = $3' : ''}
     ORDER BY ts`,
    user ? [teamId, todayStartMs, user] : [teamId, todayStartMs],
  );

  if (rows.length === 0) {
    return { activeMinutes: 0, idleMinutes: 0, codingMinutes: 0, learningMinutes: 0, sessions: 0 };
  }

  const events = rows.map(r => ({ ts: parseInt(r.ts, 10), idle: r.idle, mode: r.mode as string }));
  const { activeMs, idleMs } = computeActiveTime(events, 120_000);

  let codingMs = 0;
  let learningMs = 0;
  for (let i = 1; i < events.length; i++) {
    const gap = events[i].ts - events[i - 1].ts;
    if (gap < 120_000 && !events[i - 1].idle) {
      if (events[i - 1].mode === 'coding') codingMs += gap;
      else if (events[i - 1].mode === 'learning') learningMs += gap;
    }
  }

  const sessions = new Set(rows.map(r => r.session_id)).size;

  return {
    activeMinutes: Math.round(activeMs / 60_000),
    idleMinutes: Math.round(idleMs / 60_000),
    codingMinutes: Math.round(codingMs / 60_000),
    learningMinutes: Math.round(learningMs / 60_000),
    sessions,
  };
}

export default router;
