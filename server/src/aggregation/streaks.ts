import { getPool } from '../db/pool';

/**
 * Computes coding streaks for all users that have daily summaries.
 * A streak is consecutive calendar days with total_active_minutes > 0.
 * Updates the streak_days column on each daily_summaries row.
 */
export async function computeStreaks(): Promise<number> {
  const pool = getPool();

  const { rows: users } = await pool.query<{ user_id_hash: string }>(
    'SELECT DISTINCT user_id_hash FROM daily_summaries',
  );

  let updated = 0;

  for (const { user_id_hash } of users) {
    const { rows: days } = await pool.query<{ date: string; total_active_minutes: number }>(
      `SELECT date::text, total_active_minutes
       FROM daily_summaries
       WHERE user_id_hash = $1
       ORDER BY date DESC`,
      [user_id_hash],
    );

    if (days.length === 0) continue;

    // Walk backwards from today counting consecutive active days.
    let currentStreak = 0;
    let longestStreak = 0;
    let streak = 0;
    let prevDate: Date | null = null;

    for (const day of days) {
      const d = new Date(day.date + 'T00:00:00Z');
      const isActive = day.total_active_minutes > 0;

      if (prevDate) {
        const diffDays = Math.round((prevDate.getTime() - d.getTime()) / 86_400_000);
        if (diffDays !== 1 || !isActive) {
          longestStreak = Math.max(longestStreak, streak);
          streak = isActive ? 1 : 0;
        } else {
          streak++;
        }
      } else {
        streak = isActive ? 1 : 0;
      }

      if (currentStreak === 0 && isActive) {
        currentStreak = streak;
      } else if (currentStreak > 0 && streak > currentStreak) {
        currentStreak = streak;
      }

      prevDate = d;
    }

    longestStreak = Math.max(longestStreak, streak);

    // The current streak is the streak length starting from the most recent day.
    // Recalculate simply: count from the top (most recent) while active and consecutive.
    currentStreak = 0;
    let expected: string | null = null;

    for (const day of days) {
      if (day.total_active_minutes === 0) break;

      if (expected !== null && day.date !== expected) break;

      currentStreak++;
      const d = new Date(day.date + 'T00:00:00Z');
      d.setUTCDate(d.getUTCDate() - 1);
      expected = d.toISOString().slice(0, 10);
    }

    // Update the most recent daily summary with the current streak.
    await pool.query(
      `UPDATE daily_summaries SET streak_days = $1
       WHERE user_id_hash = $2 AND date = $3::date`,
      [currentStreak, user_id_hash, days[0].date],
    );

    updated++;
  }

  return updated;
}
