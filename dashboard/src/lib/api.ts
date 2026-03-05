const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ct_token') : null;

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
};

export interface User {
  id: number;
  email: string;
  displayName: string;
  trigram: string;
  role: string;
  avatarConfig: Record<string, string>;
  userIdHash?: string;
}

export interface Team {
  id: number;
  name: string;
  slug: string;
  color: string;
  api_key: string;
  my_role: string;
  member_count: number;
}

export interface TeamDetail extends Team {
  members: TeamMember[];
}

export interface TeamMember {
  id: number;
  display_name: string;
  trigram: string;
  avatar_config: Record<string, string>;
  user_id_hash: string;
  role: string;
  sub_team: string | null;
}
