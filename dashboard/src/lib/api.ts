const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('town_token', token);
  else localStorage.removeItem('town_token');
}

export function getAuthToken(): string | null {
  if (authToken) return authToken;
  if (typeof window !== 'undefined') {
    authToken = localStorage.getItem('town_token');
  }
  return authToken;
}

async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `API ${res.status}`);
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────
export async function login(email: string, password: string) {
  return apiFetch<{ token: string; user: any }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(
  email: string,
  password: string,
  displayName: string,
  trigram: string,
  role: string,
) {
  return apiFetch<{ token: string; user: any }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, display_name: displayName, trigram, role }),
  });
}

export async function getMe() {
  return apiFetch<{ user: any }>('/api/auth/me');
}

export async function updateProfile(updates: Record<string, any>) {
  return apiFetch<{ user: any }>('/api/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ── Teams ─────────────────────────────────────────────────
export async function getTeams() {
  return apiFetch<{ teams: any[] }>('/api/teams');
}

export async function getTeam(id: string) {
  return apiFetch<{ team: any }>(`/api/teams/${id}`);
}

export async function createTeam(name: string, slug: string, color: string) {
  return apiFetch<{ team: any }>('/api/teams', {
    method: 'POST',
    body: JSON.stringify({ name, slug, color }),
  });
}

export async function addTeamMember(teamId: string, email: string, role: string, subTeam?: string) {
  return apiFetch<{ member: any }>(`/api/teams/${teamId}/members`, {
    method: 'POST',
    body: JSON.stringify({ email, role, sub_team: subTeam }),
  });
}

export async function createSubTeam(teamId: string, name: string, leadId?: string) {
  return apiFetch<{ subTeam: any }>(`/api/teams/${teamId}/sub-teams`, {
    method: 'POST',
    body: JSON.stringify({ name, lead_id: leadId }),
  });
}

// ── Analytics ─────────────────────────────────────────────
export async function getSummary(userId: string, days = 30) {
  return apiFetch<any>(`/api/analytics/summary/${userId}?days=${days}`);
}

export async function getDailyStats(userId: string, days = 7) {
  return apiFetch<{ daily: any[] }>(`/api/analytics/daily/${userId}?days=${days}`);
}

export async function getLanguages(userId: string, days = 30) {
  return apiFetch<{ languages: any[] }>(`/api/analytics/languages/${userId}?days=${days}`);
}

export async function getStreaks(userId: string) {
  return apiFetch<any>(`/api/analytics/streaks/${userId}`);
}

export async function getSprints(userId: string, limit = 10) {
  return apiFetch<{ sprints: any[] }>(`/api/analytics/sprints/${userId}?limit=${limit}`);
}

export async function getTeamAnalytics(teamId: string, days = 30) {
  return apiFetch<any>(`/api/analytics/team/${teamId}?days=${days}`);
}
