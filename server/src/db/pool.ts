import { Pool } from 'pg';

let pool: Pool;

export function initPool(connectionString: string): Pool {
  pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  });

  pool.on('error', (err) => {
    console.error('[db] Unexpected pool error:', err.message);
  });

  return pool;
}

export function getPool(): Pool {
  if (!pool) throw new Error('Database pool not initialized — call initPool first');
  return pool;
}
