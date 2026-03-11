// ── Org Roles ────────────────────────────────────────────
export type OrgRole = 'manager' | 'lead' | 'developer';

export const ROLE_LABELS: Record<OrgRole, string> = {
  manager: 'Manager',
  lead: 'Team Lead',
  developer: 'Developer',
};

// ── Privacy ──────────────────────────────────────────────
export type PrivacyLevel = 'public' | 'team_only' | 'private';

// ── Avatar ───────────────────────────────────────────────
export type HairStyle = 'short' | 'long' | 'buzz' | 'curly' | 'mohawk' | 'none';
export type Accessory = 'none' | 'glasses' | 'sunglasses' | 'headphones' | 'hat' | 'earring';

export interface AvatarConfig {
  skinColor: string;
  hairColor: string;
  hairStyle: HairStyle;
  shirtColor: string;
  pantsColor: string;
  accessory: Accessory;
}

export const SKIN_COLORS = ['#ffd5b3', '#e8b88a', '#c68c5c', '#a0694e', '#6b4226', '#f5d0a9'];
export const HAIR_COLORS = ['#4a3728', '#1a1a2e', '#c9a050', '#b13e53', '#e8e8e8', '#f77622'];
export const SHIRT_COLORS = ['#4A90D9', '#38b764', '#b13e53', '#f77622', '#73eff7', '#5d275d', '#333333', '#ffffff'];
export const PANTS_COLORS = ['#3a3a5c', '#2a2a4c', '#5c4f44', '#1a1a2e'];
export const HAIR_STYLES: HairStyle[] = ['short', 'long', 'buzz', 'curly', 'mohawk', 'none'];
export const ACCESSORIES: Accessory[] = ['none', 'glasses', 'sunglasses', 'headphones', 'hat', 'earring'];

export const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: '#ffd5b3',
  hairColor: '#4a3728',
  hairStyle: 'short',
  shirtColor: '#4A90D9',
  pantsColor: '#3a3a5c',
  accessory: 'none',
};

// ── Desk ─────────────────────────────────────────────────
export type DeskStyle = 'standard' | 'standing' | 'corner' | 'minimal';
export type ChairStyle = 'basic' | 'ergonomic' | 'gaming' | 'stool';
export type MonitorSetup = 'single' | 'dual' | 'ultrawide' | 'laptop';
export type DeskDecoration = 'plant' | 'coffee' | 'figurine' | 'photo' | 'lamp' | 'stickers';

export interface DeskConfig {
  style: DeskStyle;
  chair: ChairStyle;
  monitor: MonitorSetup;
  decorations: DeskDecoration[];
  colorTheme: string;
}

export const DESK_STYLES: { value: DeskStyle; label: string }[] = [
  { value: 'standard', label: 'Standard' },
  { value: 'standing', label: 'Standing' },
  { value: 'corner', label: 'Corner' },
  { value: 'minimal', label: 'Minimal' },
];

export const CHAIR_STYLES: { value: ChairStyle; label: string }[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'ergonomic', label: 'Ergonomic' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'stool', label: 'Stool' },
];

export const MONITOR_SETUPS: { value: MonitorSetup; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'dual', label: 'Dual' },
  { value: 'ultrawide', label: 'Ultrawide' },
  { value: 'laptop', label: 'Laptop' },
];

export const DESK_DECORATIONS: { value: DeskDecoration; label: string; icon: string }[] = [
  { value: 'plant', label: 'Plant', icon: '🌱' },
  { value: 'coffee', label: 'Coffee', icon: '☕' },
  { value: 'figurine', label: 'Figurine', icon: '🤖' },
  { value: 'photo', label: 'Photo', icon: '🖼' },
  { value: 'lamp', label: 'Lamp', icon: '💡' },
  { value: 'stickers', label: 'Stickers', icon: '✨' },
];

export const DESK_COLOR_THEMES = ['#4A90D9', '#38b764', '#b13e53', '#f77622', '#5d275d', '#73eff7', '#3a3a5c'];

export const DEFAULT_DESK: DeskConfig = {
  style: 'standard',
  chair: 'ergonomic',
  monitor: 'dual',
  decorations: ['plant', 'coffee'],
  colorTheme: '#4A90D9',
};

// ── Employee ─────────────────────────────────────────────
export interface Employee {
  id: string;
  email: string;
  displayName: string;
  trigram: string;
  role: OrgRole;
  memberRole: string;
  subTeam: string;
  avatarConfig: AvatarConfig;
  deskConfig: DeskConfig;
  privacyLevel: PrivacyLevel;
  onboarded: boolean;
}

// ── Teams ────────────────────────────────────────────────
export interface SubTeam {
  id: string;
  name: string;
  leadId?: string;
  leadName?: string;
  members?: Employee[];
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  color: string;
  ownerId: string;
  subTeams?: SubTeam[];
  members?: Employee[];
}

// ── Onboarding ───────────────────────────────────────────
export type OnboardingStep = 'profile' | 'avatar' | 'workspace';

export interface OnboardingState {
  step: OnboardingStep;
  profile: {
    displayName: string;
    trigram: string;
    role: OrgRole;
  };
  avatar: AvatarConfig;
  desk: DeskConfig;
  privacyLevel: PrivacyLevel;
}

// ── Analytics Types ──────────────────────────────────────
export interface ActivitySummary {
  coding_minutes: number;
  active_minutes: number;
  session_count: number;
  sprint_count: number;
  learning_minutes: number;
  top_language: string;
}

export interface LanguageStat {
  language: string;
  total_seconds: number;
  percentage: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  today_active: boolean;
}

export interface SprintInfo {
  start_ts: string;
  end_ts: string;
  duration_minutes: number;
  event_count: number;
}

export interface DailyStat {
  date: string;
  total_active_minutes: number;
  coding_minutes: number;
  session_count: number;
}

export interface DeveloperProfile {
  employee: Employee;
  summary: ActivitySummary | null;
  languages: LanguageStat[];
  streak: StreakInfo | null;
  sprints: SprintInfo[];
  daily: DailyStat[];
}

// ── Office Layout Types ──────────────────────────────────
export interface Position {
  x: number;
  y: number;
}

export interface Desk {
  employee: Employee;
  position: Position;
  direction: 'up' | 'down' | 'left' | 'right';
}

export interface TeamZone {
  name: string;
  color: string;
  bounds: { x: number; y: number; width: number; height: number };
  desks: Desk[];
}

export type OfficeObjectType =
  | 'plant'
  | 'sofa'
  | 'coffee-machine'
  | 'water-cooler'
  | 'whiteboard'
  | 'bookshelf'
  | 'table'
  | 'rug';

export interface OfficeObject {
  type: OfficeObjectType;
  position: Position;
}
