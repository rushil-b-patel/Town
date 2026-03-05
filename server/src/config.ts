export interface Config {
  port: number;
  databaseUrl: string;
  apiKeys: Map<string, string>;
  idleThresholdMs: number;
  rawEventRetentionDays: number;
  hourlyRollupRetentionDays: number;
}

export function loadConfig(): Config {
  const databaseUrl = requireEnv('DATABASE_URL');
  const port = parseInt(process.env.PORT ?? '3000', 10);

  const apiKeys = new Map<string, string>();
  const raw = process.env.API_KEYS ?? '';
  for (const entry of raw.split(',').filter(Boolean)) {
    const [key, teamId] = entry.split(':');
    if (key && teamId) apiKeys.set(key.trim(), teamId.trim());
  }

  if (apiKeys.size === 0) {
    console.warn('[config] No API_KEYS configured — all requests will be rejected');
  }

  return {
    port,
    databaseUrl,
    apiKeys,
    idleThresholdMs: 120_000,
    rawEventRetentionDays: 30,
    hourlyRollupRetentionDays: 90,
  };
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}
