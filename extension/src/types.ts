/**
 * Canonical event types emitted by the tracker.
 * Each maps to a specific VS Code lifecycle event.
 */
export type EventType =
  | 'edit'
  | 'save'
  | 'focus'
  | 'blur'
  | 'active_editor_change';

/**
 * Core activity event — the unit of data collected by CodeTown.
 * All identifying fields are SHA-256 hashed before persistence.
 */
export interface ActivityEvent {
  id: string;
  session_id: string;
  user_id_hash: string;
  team_id?: string;
  ts: number;
  type: EventType;
  language: string;
  repo_hash: string;
  file_hash: string;
  idle: boolean;
}

/**
 * Row shape as stored in SQLite.
 * `idle` is stored as INTEGER 0/1; `uploaded` tracks sync state.
 */
export interface StoredEventRow {
  id: string;
  session_id: string;
  user_id_hash: string;
  team_id: string | null;
  ts: number;
  type: string;
  language: string;
  repo_hash: string;
  file_hash: string;
  idle: number;
  uploaded: number;
}

/** Payload shape sent to the backend API. */
export interface UploadPayload {
  events: ActivityEvent[];
}

/** Resolved configuration from VS Code settings. */
export interface CodetownConfig {
  enabled: boolean;
  serverUrl: string;
  teamId: string;
  idleThreshold: number;
  uploadInterval: number;
  debug: boolean;
}

/** Represents a detected coding sprint. */
export interface SprintInfo {
  startTs: number;
  endTs: number;
  durationMinutes: number;
  eventCount: number;
}
