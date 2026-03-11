import { create } from 'zustand';
import type {
  Employee, Team, AvatarConfig, DeskConfig, OrgRole,
  PrivacyLevel, OnboardingState, OnboardingStep,
  DeveloperProfile, Position,
} from '@/types';
import { DEFAULT_AVATAR, DEFAULT_DESK } from '@/types';
import * as api from '@/lib/api';

// ── Demo Employees ───────────────────────────────────────
const DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'd1', email: 'alice@town.dev', displayName: 'Alice Chen', trigram: 'ACH',
    role: 'lead', memberRole: 'Frontend Lead', subTeam: 'Frontend',
    avatarConfig: { skinColor: '#ffd5b3', hairColor: '#4a3728', hairStyle: 'long', shirtColor: '#4A90D9', pantsColor: '#3a3a5c', accessory: 'glasses' },
    deskConfig: { ...DEFAULT_DESK, style: 'standing', monitor: 'ultrawide' }, privacyLevel: 'public', onboarded: true,
  },
  {
    id: 'd2', email: 'bob@town.dev', displayName: 'Bob Martinez', trigram: 'BMZ',
    role: 'developer', memberRole: 'Senior Dev', subTeam: 'Frontend',
    avatarConfig: { skinColor: '#e8b88a', hairColor: '#1a1a2e', hairStyle: 'short', shirtColor: '#38b764', pantsColor: '#2a2a4c', accessory: 'headphones' },
    deskConfig: { ...DEFAULT_DESK, monitor: 'dual', decorations: ['figurine', 'coffee'] }, privacyLevel: 'public', onboarded: true,
  },
  {
    id: 'd3', email: 'carol@town.dev', displayName: 'Carol Wu', trigram: 'CWU',
    role: 'developer', memberRole: 'Developer', subTeam: 'Frontend',
    avatarConfig: { skinColor: '#ffd5b3', hairColor: '#b13e53', hairStyle: 'curly', shirtColor: '#b13e53', pantsColor: '#3a3a5c', accessory: 'earring' },
    deskConfig: { ...DEFAULT_DESK, chair: 'gaming', decorations: ['plant', 'stickers'] }, privacyLevel: 'team_only', onboarded: true,
  },
  {
    id: 'd4', email: 'dan@town.dev', displayName: 'Dan Kim', trigram: 'DKM',
    role: 'lead', memberRole: 'Backend Lead', subTeam: 'Backend',
    avatarConfig: { skinColor: '#c68c5c', hairColor: '#1a1a2e', hairStyle: 'buzz', shirtColor: '#f77622', pantsColor: '#3a3a5c', accessory: 'none' },
    deskConfig: { ...DEFAULT_DESK, style: 'corner', monitor: 'dual' }, privacyLevel: 'public', onboarded: true,
  },
  {
    id: 'd5', email: 'eva@town.dev', displayName: 'Eva Singh', trigram: 'ESG',
    role: 'developer', memberRole: 'Developer', subTeam: 'Backend',
    avatarConfig: { skinColor: '#a0694e', hairColor: '#4a3728', hairStyle: 'long', shirtColor: '#5d275d', pantsColor: '#2a2a4c', accessory: 'glasses' },
    deskConfig: { ...DEFAULT_DESK, decorations: ['lamp', 'photo'] }, privacyLevel: 'public', onboarded: true,
  },
  {
    id: 'd6', email: 'frank@town.dev', displayName: 'Frank Li', trigram: 'FLI',
    role: 'developer', memberRole: 'Developer', subTeam: 'Backend',
    avatarConfig: { skinColor: '#ffd5b3', hairColor: '#c9a050', hairStyle: 'short', shirtColor: '#73eff7', pantsColor: '#3a3a5c', accessory: 'sunglasses' },
    deskConfig: { ...DEFAULT_DESK, chair: 'stool' }, privacyLevel: 'team_only', onboarded: true,
  },
  {
    id: 'd7', email: 'grace@town.dev', displayName: 'Grace Okonjo', trigram: 'GOK',
    role: 'lead', memberRole: 'DevOps Lead', subTeam: 'DevOps',
    avatarConfig: { skinColor: '#6b4226', hairColor: '#1a1a2e', hairStyle: 'curly', shirtColor: '#38b764', pantsColor: '#3a3a5c', accessory: 'headphones' },
    deskConfig: { ...DEFAULT_DESK, style: 'standing', monitor: 'dual', decorations: ['coffee', 'figurine'] }, privacyLevel: 'public', onboarded: true,
  },
  {
    id: 'd8', email: 'hiro@town.dev', displayName: 'Hiro Tanaka', trigram: 'HTK',
    role: 'developer', memberRole: 'SRE', subTeam: 'DevOps',
    avatarConfig: { skinColor: '#ffd5b3', hairColor: '#4a3728', hairStyle: 'mohawk', shirtColor: '#b13e53', pantsColor: '#2a2a4c', accessory: 'hat' },
    deskConfig: { ...DEFAULT_DESK, decorations: ['stickers', 'plant'] }, privacyLevel: 'public', onboarded: true,
  },
  {
    id: 'd9', email: 'ivy@town.dev', displayName: 'Ivy Patel', trigram: 'IPT',
    role: 'developer', memberRole: 'Cloud Engineer', subTeam: 'DevOps',
    avatarConfig: { skinColor: '#e8b88a', hairColor: '#f77622', hairStyle: 'long', shirtColor: '#4A90D9', pantsColor: '#3a3a5c', accessory: 'glasses' },
    deskConfig: { ...DEFAULT_DESK, style: 'minimal', monitor: 'laptop' }, privacyLevel: 'private', onboarded: true,
  },
];

const DEMO_TEAM: Team = {
  id: 't1',
  name: 'Engineering',
  slug: 'engineering',
  color: '#4A90D9',
  ownerId: 'd0',
  subTeams: [
    { id: 'st1', name: 'Frontend', leadId: 'd1', leadName: 'Alice Chen', members: DEMO_EMPLOYEES.filter(e => e.subTeam === 'Frontend') },
    { id: 'st2', name: 'Backend', leadId: 'd4', leadName: 'Dan Kim', members: DEMO_EMPLOYEES.filter(e => e.subTeam === 'Backend') },
    { id: 'st3', name: 'DevOps', leadId: 'd7', leadName: 'Grace Okonjo', members: DEMO_EMPLOYEES.filter(e => e.subTeam === 'DevOps') },
  ],
  members: DEMO_EMPLOYEES,
};

const DEMO_USER: Employee = {
  id: 'd0', email: 'you@town.dev', displayName: 'You', trigram: 'YOU',
  role: 'manager', memberRole: 'Manager', subTeam: 'Engineering',
  avatarConfig: { skinColor: '#ffd5b3', hairColor: '#4a3728', hairStyle: 'short', shirtColor: '#f77622', pantsColor: '#3a3a5c', accessory: 'none' },
  deskConfig: DEFAULT_DESK, privacyLevel: 'public', onboarded: true,
};

// ── Demo Analytics Data ──────────────────────────────────
function makeDemoProfile(emp: Employee): DeveloperProfile {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  return {
    employee: emp,
    summary: {
      coding_minutes: rand(400, 2400),
      active_minutes: rand(600, 3600),
      session_count: rand(15, 80),
      sprint_count: rand(5, 30),
      learning_minutes: rand(0, 300),
      top_language: ['TypeScript', 'Python', 'Go', 'Rust'][rand(0, 3)],
    },
    languages: [
      { language: 'TypeScript', total_seconds: rand(20000, 80000), percentage: rand(30, 55) },
      { language: 'Python', total_seconds: rand(10000, 40000), percentage: rand(15, 30) },
      { language: 'Go', total_seconds: rand(5000, 20000), percentage: rand(5, 20) },
      { language: 'CSS', total_seconds: rand(2000, 8000), percentage: rand(3, 10) },
      { language: 'SQL', total_seconds: rand(1000, 5000), percentage: rand(2, 8) },
    ],
    streak: {
      current_streak: rand(1, 30),
      longest_streak: rand(10, 90),
      today_active: Math.random() > 0.3,
    },
    sprints: Array.from({ length: rand(3, 8) }, (_, i) => ({
      start_ts: new Date(Date.now() - i * 86400000 - rand(0, 43200000)).toISOString(),
      end_ts: new Date(Date.now() - i * 86400000).toISOString(),
      duration_minutes: rand(25, 180),
      event_count: rand(50, 500),
    })),
    daily: Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
      total_active_minutes: rand(0, 480),
      coding_minutes: rand(0, 360),
      session_count: rand(0, 12),
    })),
  };
}

// ── Store ────────────────────────────────────────────────
export type ViewState = 'login' | 'onboarding' | 'office';

interface OfficeState {
  // Auth & view
  view: ViewState;
  isDemo: boolean;
  user: Employee | null;
  currentUser: Employee | null;        // alias (same ref as user)
  currentTeam: Team | null;
  error: string | null;
  loading: boolean;

  // Employees
  employees: Employee[];

  // Player movement
  playerPosition: Position;
  playerDirection: 'up' | 'down' | 'left' | 'right';

  // Zoom
  zoom: number;

  // Selection / profile panel
  selectedEmployee: Employee | null;
  hoveredDesk: string | null;
  isPanelOpen: boolean;
  selectedProfile: DeveloperProfile | null;
  profileCache: Map<string, DeveloperProfile>;

  // Onboarding
  onboarding: OnboardingState;

  // ── Actions ──
  setView: (v: ViewState) => void;
  loginDemo: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, trigram: string, role: OrgRole) => Promise<void>;
  logout: () => void;

  // Player
  movePlayer: (dir: 'up' | 'down' | 'left' | 'right') => void;
  setZoom: (z: number) => void;

  // Selection
  selectEmployee: (emp: Employee) => void;
  closePanel: () => void;
  setHoveredDesk: (id: string | null) => void;
  loadProfile: (emp: Employee) => Promise<void>;

  // Onboarding
  setOnboardingStep: (step: OnboardingStep) => void;
  updateOnboardingProfile: (u: Partial<OnboardingState['profile']>) => void;
  updateOnboardingAvatar: (u: Partial<AvatarConfig>) => void;
  updateOnboardingDesk: (u: Partial<DeskConfig>) => void;
  setOnboardingPrivacy: (p: PrivacyLevel) => void;
  completeOnboarding: () => void;

  // Customization
  updateAvatar: (u: Partial<AvatarConfig>) => void;
  updateDesk: (u: Partial<DeskConfig>) => void;
  updatePrivacy: (p: PrivacyLevel) => void;

  // Teams
  fetchTeams: () => Promise<void>;
  createTeam: (name: string, slug: string, color: string) => Promise<void>;
  inviteMember: (email: string, role: OrgRole, subTeam?: string) => Promise<void>;
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  // ── Initial State ──
  view: 'login',
  isDemo: false,
  user: null,
  currentUser: null,
  currentTeam: null,
  error: null,
  loading: false,
  employees: [],
  playerPosition: { x: 640, y: 500 },
  playerDirection: 'down',
  zoom: 1,
  selectedEmployee: null,
  hoveredDesk: null,
  isPanelOpen: false,
  selectedProfile: null,
  profileCache: new Map(),
  onboarding: {
    step: 'profile',
    profile: { displayName: '', trigram: '', role: 'developer' },
    avatar: { ...DEFAULT_AVATAR },
    desk: { ...DEFAULT_DESK },
    privacyLevel: 'public',
  },

  // ── View ──
  setView: (view) => set({ view }),

  // ── Auth ──
  loginDemo: () => {
    set({
      view: 'office',
      isDemo: true,
      user: DEMO_USER,
      currentUser: DEMO_USER,
      currentTeam: DEMO_TEAM,
      employees: DEMO_EMPLOYEES,
      error: null,
    });
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await api.login(email, password);
      api.setAuthToken(token);
      const emp: Employee = {
        id: user.id, email: user.email,
        displayName: user.display_name, trigram: user.trigram || 'USR',
        role: user.role || 'developer', memberRole: user.role || 'Developer',
        subTeam: user.sub_team || '', avatarConfig: user.avatar_config || DEFAULT_AVATAR,
        deskConfig: user.desk_config || DEFAULT_DESK,
        privacyLevel: user.privacy_level || 'public', onboarded: user.onboarded ?? false,
      };
      set({
        user: emp, currentUser: emp,
        view: emp.onboarded ? 'office' : 'onboarding',
        loading: false,
      });
      if (emp.onboarded) get().fetchTeams();
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  register: async (email, password, name, trigram, role) => {
    set({ loading: true, error: null });
    try {
      const { token, user } = await api.register(email, password, name, trigram, role);
      api.setAuthToken(token);
      const emp: Employee = {
        id: user.id, email: user.email,
        displayName: user.display_name, trigram: user.trigram || trigram,
        role: user.role || role, memberRole: user.role || role,
        subTeam: '', avatarConfig: DEFAULT_AVATAR,
        deskConfig: DEFAULT_DESK, privacyLevel: 'public', onboarded: false,
      };
      set({ user: emp, currentUser: emp, view: 'onboarding', loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  logout: () => {
    api.setAuthToken(null);
    set({
      view: 'login', isDemo: false,
      user: null, currentUser: null, currentTeam: null,
      employees: [], selectedEmployee: null,
      isPanelOpen: false, selectedProfile: null,
      profileCache: new Map(), error: null,
    });
  },

  // ── Player Movement ──
  movePlayer: (dir) => {
    const step = 16;
    set((s) => {
      const pos = { ...s.playerPosition };
      switch (dir) {
        case 'up': pos.y = Math.max(80, pos.y - step); break;
        case 'down': pos.y = Math.min(920, pos.y + step); break;
        case 'left': pos.x = Math.max(16, pos.x - step); break;
        case 'right': pos.x = Math.min(1264, pos.x + step); break;
      }
      return { playerPosition: pos, playerDirection: dir };
    });
  },

  setZoom: (z) => set({ zoom: Math.max(0.3, Math.min(3, z)) }),

  // ── Selection & Profile ──
  selectEmployee: (emp) => {
    const state = get();
    set({ selectedEmployee: emp });
    state.loadProfile(emp);
  },

  closePanel: () => set({ isPanelOpen: false, selectedProfile: null, selectedEmployee: null }),

  setHoveredDesk: (id) => set({ hoveredDesk: id }),

  loadProfile: async (emp) => {
    const cache = get().profileCache;
    if (cache.has(emp.id)) {
      set({ isPanelOpen: true, selectedProfile: cache.get(emp.id)! });
      return;
    }

    if (get().isDemo) {
      const profile = makeDemoProfile(emp);
      cache.set(emp.id, profile);
      set({ isPanelOpen: true, selectedProfile: profile, profileCache: new Map(cache) });
      return;
    }

    try {
      const [summaryRes, langRes, streakRes, sprintRes, dailyRes] = await Promise.all([
        api.getSummary(emp.id).catch(() => null),
        api.getLanguages(emp.id).catch(() => ({ languages: [] })),
        api.getStreaks(emp.id).catch(() => null),
        api.getSprints(emp.id).catch(() => ({ sprints: [] })),
        api.getDailyStats(emp.id).catch(() => ({ daily: [] })),
      ]);
      const profile: DeveloperProfile = {
        employee: emp,
        summary: summaryRes,
        languages: langRes.languages,
        streak: streakRes,
        sprints: sprintRes.sprints,
        daily: dailyRes.daily,
      };
      cache.set(emp.id, profile);
      set({ isPanelOpen: true, selectedProfile: profile, profileCache: new Map(cache) });
    } catch {
      const fallback = makeDemoProfile(emp);
      set({ isPanelOpen: true, selectedProfile: fallback });
    }
  },

  // ── Onboarding ──
  setOnboardingStep: (step) =>
    set((s) => ({ onboarding: { ...s.onboarding, step } })),

  updateOnboardingProfile: (u) =>
    set((s) => ({
      onboarding: { ...s.onboarding, profile: { ...s.onboarding.profile, ...u } },
    })),

  updateOnboardingAvatar: (u) =>
    set((s) => ({
      onboarding: { ...s.onboarding, avatar: { ...s.onboarding.avatar, ...u } },
    })),

  updateOnboardingDesk: (u) =>
    set((s) => ({
      onboarding: { ...s.onboarding, desk: { ...s.onboarding.desk, ...u } },
    })),

  setOnboardingPrivacy: (p) =>
    set((s) => ({ onboarding: { ...s.onboarding, privacyLevel: p } })),

  completeOnboarding: () => {
    const { onboarding, user, isDemo } = get();
    if (!user) return;

    const updated: Employee = {
      ...user,
      displayName: onboarding.profile.displayName || user.displayName,
      trigram: onboarding.profile.trigram || user.trigram,
      role: onboarding.profile.role,
      memberRole: onboarding.profile.role,
      avatarConfig: onboarding.avatar,
      deskConfig: onboarding.desk,
      privacyLevel: onboarding.privacyLevel,
      onboarded: true,
    };

    set({ user: updated, currentUser: updated, view: 'office' });

    if (!isDemo) {
      api.updateProfile({
        display_name: updated.displayName,
        trigram: updated.trigram,
        avatar_config: updated.avatarConfig,
        desk_config: updated.deskConfig,
        privacy_level: updated.privacyLevel,
        onboarded: true,
      }).catch(() => {});
    }
  },

  // ── Customization ──
  updateAvatar: (u) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, avatarConfig: { ...user.avatarConfig, ...u } };
    set({ user: updated, currentUser: updated });
    if (!get().isDemo) {
      api.updateProfile({ avatar_config: updated.avatarConfig }).catch(() => {});
    }
  },

  updateDesk: (u) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, deskConfig: { ...user.deskConfig, ...u } };
    set({ user: updated, currentUser: updated });
    if (!get().isDemo) {
      api.updateProfile({ desk_config: updated.deskConfig }).catch(() => {});
    }
  },

  updatePrivacy: (p) => {
    const user = get().user;
    if (!user) return;
    const updated = { ...user, privacyLevel: p };
    set({ user: updated, currentUser: updated });
    if (!get().isDemo) {
      api.updateProfile({ privacy_level: p }).catch(() => {});
    }
  },

  // ── Teams ──
  fetchTeams: async () => {
    try {
      const { teams } = await api.getTeams();
      if (teams.length > 0) {
        const full = await api.getTeam(teams[0].id);
        set({ currentTeam: full.team, employees: full.team.members || [] });
      }
    } catch {
      // silently fail
    }
  },

  createTeam: async (name, slug, color) => {
    set({ error: null });
    try {
      if (get().isDemo) {
        const team: Team = {
          id: `t${Date.now()}`, name, slug, color,
          ownerId: get().user?.id || '', subTeams: [], members: [],
        };
        set({ currentTeam: team });
        return;
      }
      const { team } = await api.createTeam(name, slug, color);
      set({ currentTeam: team });
    } catch (e: any) {
      set({ error: e.message });
    }
  },

  inviteMember: async (email, role, subTeam) => {
    set({ error: null });
    const team = get().currentTeam;
    if (!team) return;
    try {
      if (get().isDemo) return;
      await api.addTeamMember(team.id, email, role, subTeam);
      await get().fetchTeams();
    } catch (e: any) {
      set({ error: e.message });
    }
  },
}));
