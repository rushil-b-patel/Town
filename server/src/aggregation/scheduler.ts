import cron from 'node-cron';
import { Config } from '../config';
import { getPool } from '../db/pool';
import { rollupHour } from './hourlyRollup';
import { summarizeDay } from './dailySummary';
import { detectSprints } from './sprints';
import { computeStreaks } from './streaks';

/**
 * Schedules all periodic aggregation jobs.
 *
 * Hourly  (HH:05) — roll up the previous hour + detect sprints
 * Nightly (00:15)  — summarize the previous day + compute streaks
 * Cleanup (03:00)  — delete raw events older than retention period
 */
export function startScheduler(config: Config): void {
  // Every hour at :05, process the previous hour.
  cron.schedule('5 * * * *', async () => {
    const now = new Date();
    const hourEnd = new Date(now);
    hourEnd.setMinutes(0, 0, 0);
    const hourStart = new Date(hourEnd.getTime() - 3_600_000);

    try {
      const rollups = await rollupHour(hourStart, hourEnd, config.idleThresholdMs);
      const sprints = await detectSprints(hourStart.getTime(), hourEnd.getTime());
      console.log(`[scheduler] Hourly rollup: ${rollups} groups, ${sprints} sprints`);
    } catch (err) {
      console.error('[scheduler] Hourly rollup failed:', (err as Error).message);
    }
  });

  // Every day at 00:15 UTC, summarize the previous day.
  cron.schedule('15 0 * * *', async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 10);

    try {
      const summaries = await summarizeDay(dateStr);
      const streaks = await computeStreaks();
      console.log(`[scheduler] Daily summary: ${summaries} users, ${streaks} streaks updated`);
    } catch (err) {
      console.error('[scheduler] Daily summary failed:', (err as Error).message);
    }
  });

  // Every day at 03:00 UTC, clean old raw events.
  cron.schedule('0 3 * * *', async () => {
    const cutoff = Date.now() - config.rawEventRetentionDays * 86_400_000;
    try {
      const result = await getPool().query(
        'DELETE FROM raw_events WHERE ts < $1', [cutoff],
      );
      console.log(`[scheduler] Cleanup: deleted ${result.rowCount} old raw events`);

      const hCutoff = new Date(Date.now() - config.hourlyRollupRetentionDays * 86_400_000);
      const hResult = await getPool().query(
        'DELETE FROM hourly_rollups WHERE hour_ts < $1', [hCutoff.toISOString()],
      );
      console.log(`[scheduler] Cleanup: deleted ${hResult.rowCount} old hourly rollups`);
    } catch (err) {
      console.error('[scheduler] Cleanup failed:', (err as Error).message);
    }
  });

  console.log('[scheduler] Cron jobs registered');
}
