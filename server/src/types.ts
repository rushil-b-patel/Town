import { z } from 'zod';

export const EventTypeSchema = z.enum([
  'edit', 'save', 'focus', 'blur', 'active_editor_change',
]);

export const DeveloperModeSchema = z.enum(['coding', 'learning', 'idle']);

export const ActivityEventSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  user_id_hash: z.string().min(64).max(64),
  team_id: z.string().optional(),
  ts: z.number().int().positive(),
  type: EventTypeSchema,
  language: z.string().max(100),
  repo_hash: z.string().min(64).max(64),
  file_hash: z.string().min(64).max(64),
  idle: z.boolean(),
  mode: DeveloperModeSchema,
});

export const BatchPayloadSchema = z.object({
  events: z.array(ActivityEventSchema).min(1).max(200),
});

export type ActivityEvent = z.infer<typeof ActivityEventSchema>;
export type BatchPayload = z.infer<typeof BatchPayloadSchema>;

export const RangeSchema = z.enum(['1d', '7d', '30d', '90d', '365d']).default('7d');

export type Range = z.infer<typeof RangeSchema>;

export function rangeToDays(range: Range): number {
  const map: Record<Range, number> = { '1d': 1, '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
  return map[range];
}

export interface HourlyRollup {
  user_id_hash: string;
  team_id: string | null;
  hour_ts: Date;
  language: string;
  repo_hash: string;
  mode: string;
  active_seconds: number;
  idle_seconds: number;
  edit_count: number;
  save_count: number;
  switch_count: number;
  focus_count: number;
  unique_files: number;
}

export interface DailySummary {
  user_id_hash: string;
  team_id: string | null;
  date: string;
  total_active_minutes: number;
  total_idle_minutes: number;
  coding_minutes: number;
  learning_minutes: number;
  languages: Record<string, number>;
  repos: Record<string, number>;
  session_count: number;
  sprint_count: number;
  longest_sprint_minutes: number;
  streak_days: number;
  first_event_ts: number | null;
  last_event_ts: number | null;
}
