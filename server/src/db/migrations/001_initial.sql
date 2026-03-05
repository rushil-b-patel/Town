-- Raw events: the source of truth, retained for 30 days.
CREATE TABLE IF NOT EXISTS raw_events (
  id           TEXT PRIMARY KEY,
  session_id   TEXT NOT NULL,
  user_id_hash TEXT NOT NULL,
  team_id      TEXT,
  ts           BIGINT NOT NULL,
  type         TEXT NOT NULL,
  language     TEXT NOT NULL,
  repo_hash    TEXT NOT NULL,
  file_hash    TEXT NOT NULL,
  idle         BOOLEAN NOT NULL DEFAULT FALSE,
  mode         TEXT NOT NULL DEFAULT 'coding',
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_user_ts ON raw_events(user_id_hash, ts);
CREATE INDEX IF NOT EXISTS idx_raw_team_ts ON raw_events(team_id, ts);
CREATE INDEX IF NOT EXISTS idx_raw_ts      ON raw_events(ts);

-- Hourly rollups: pre-aggregated per (user, hour, language, repo, mode).
-- Retained 90 days.
CREATE TABLE IF NOT EXISTS hourly_rollups (
  id             SERIAL PRIMARY KEY,
  user_id_hash   TEXT NOT NULL,
  team_id        TEXT,
  hour_ts        TIMESTAMPTZ NOT NULL,
  language       TEXT NOT NULL,
  repo_hash      TEXT NOT NULL,
  mode           TEXT NOT NULL,
  active_seconds INTEGER NOT NULL DEFAULT 0,
  idle_seconds   INTEGER NOT NULL DEFAULT 0,
  edit_count     INTEGER NOT NULL DEFAULT 0,
  save_count     INTEGER NOT NULL DEFAULT 0,
  switch_count   INTEGER NOT NULL DEFAULT 0,
  focus_count    INTEGER NOT NULL DEFAULT 0,
  unique_files   INTEGER NOT NULL DEFAULT 0,
  UNIQUE(user_id_hash, hour_ts, language, repo_hash, mode)
);

CREATE INDEX IF NOT EXISTS idx_hourly_user_hour ON hourly_rollups(user_id_hash, hour_ts);
CREATE INDEX IF NOT EXISTS idx_hourly_team_hour ON hourly_rollups(team_id, hour_ts);

-- Daily summaries: one row per user per calendar day. Retained indefinitely.
CREATE TABLE IF NOT EXISTS daily_summaries (
  id                      SERIAL PRIMARY KEY,
  user_id_hash            TEXT NOT NULL,
  team_id                 TEXT,
  date                    DATE NOT NULL,
  total_active_minutes    INTEGER NOT NULL DEFAULT 0,
  total_idle_minutes      INTEGER NOT NULL DEFAULT 0,
  coding_minutes          INTEGER NOT NULL DEFAULT 0,
  learning_minutes        INTEGER NOT NULL DEFAULT 0,
  languages               JSONB NOT NULL DEFAULT '{}',
  repos                   JSONB NOT NULL DEFAULT '{}',
  session_count           INTEGER NOT NULL DEFAULT 0,
  sprint_count            INTEGER NOT NULL DEFAULT 0,
  longest_sprint_minutes  INTEGER NOT NULL DEFAULT 0,
  streak_days             INTEGER NOT NULL DEFAULT 0,
  first_event_ts          BIGINT,
  last_event_ts           BIGINT,
  UNIQUE(user_id_hash, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_user_date ON daily_summaries(user_id_hash, date);
CREATE INDEX IF NOT EXISTS idx_daily_team_date ON daily_summaries(team_id, date);

-- Server-side detected sprints.
CREATE TABLE IF NOT EXISTS sprints (
  id               SERIAL PRIMARY KEY,
  user_id_hash     TEXT NOT NULL,
  team_id          TEXT,
  session_id       TEXT NOT NULL,
  start_ts         BIGINT NOT NULL,
  end_ts           BIGINT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  event_count      INTEGER NOT NULL,
  UNIQUE(user_id_hash, start_ts)
);

CREATE INDEX IF NOT EXISTS idx_sprints_user_ts ON sprints(user_id_hash, start_ts);
