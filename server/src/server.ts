import 'dotenv/config';
import { loadConfig } from './config';
import { initPool } from './db/pool';
import { runMigrations } from './db/migrate';
import { startScheduler } from './aggregation/scheduler';
import { createApp } from './app';

async function main(): Promise<void> {
  const config = loadConfig();
  const pool = initPool(config.databaseUrl);

  // Wait for Postgres to be ready (handles Docker startup ordering).
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch {
      retries--;
      if (retries === 0) throw new Error('Could not connect to PostgreSQL');
      console.log(`[server] Waiting for PostgreSQL... (${retries} retries left)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  await runMigrations(pool);
  startScheduler(config);

  const app = createApp(config);

  app.listen(config.port, () => {
    console.log(`[server] CodeTown server listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error('[server] Fatal:', err);
  process.exit(1);
});
