'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { api, type Team } from '@/lib/api';

export default function ManageTeamsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamName, setTeamName] = useState('');
  const [teamColor, setTeamColor] = useState('#4A90D9');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Add member form state
  const [addSlug, setAddSlug] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState<'developer' | 'lead'>('developer');
  const [addMsg, setAddMsg] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'manager')) {
      router.replace('/city');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.get<{ teams: Team[] }>('/api/teams').then(d => setTeams(d.teams)).catch(() => {});
  }, [user]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/api/teams', { name: teamName, color: teamColor });
      setTeamName('');
      const d = await api.get<{ teams: Team[] }>('/api/teams');
      setTeams(d.teams);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  }

  async function handleAddMember(e: FormEvent) {
    e.preventDefault();
    setAddMsg('');
    try {
      await api.post(`/api/teams/${addSlug}/members`, { email: memberEmail, role: memberRole });
      setMemberEmail('');
      setAddMsg('Member added!');
    } catch (err) {
      setAddMsg(err instanceof Error ? err.message : 'Failed');
    }
  }

  if (loading || !user) return null;

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-city-gold text-xs">TEAM MANAGEMENT</h1>
        <Link href="/city" className="text-[8px] text-city-accent hover:underline">
          BACK TO CITY
        </Link>
      </div>

      {/* Create team */}
      <div className="pixel-card mb-6">
        <h2 className="text-[10px] text-gray-400 mb-3">BUILD A NEW TEAM</h2>
        <form onSubmit={handleCreate} className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-[8px] text-gray-500 mb-1">TEAM NAME</label>
            <input
              className="pixel-input"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[8px] text-gray-500 mb-1">COLOR</label>
            <input
              type="color"
              className="w-10 h-[38px] bg-city-panel border-2 border-city-border cursor-pointer"
              value={teamColor}
              onChange={e => setTeamColor(e.target.value)}
            />
          </div>
          <button type="submit" className="pixel-btn whitespace-nowrap" disabled={creating}>
            {creating ? '...' : 'CREATE'}
          </button>
        </form>
        {error && <p className="text-red-400 text-[8px] mt-2">{error}</p>}
      </div>

      {/* Existing teams */}
      <div className="space-y-3 mb-8">
        {teams.map(t => (
          <div key={t.id} className="pixel-card flex items-center gap-3">
            <div className="w-4 h-4" style={{ backgroundColor: t.color }} />
            <div className="flex-1">
              <p className="text-[10px] text-white">{t.name}</p>
              <p className="text-[8px] text-gray-500">{t.member_count} members</p>
            </div>
            <button
              onClick={() => setAddSlug(addSlug === t.slug ? '' : t.slug)}
              className="text-[8px] text-city-accent hover:underline"
            >
              {addSlug === t.slug ? 'CLOSE' : '+ MEMBER'}
            </button>
          </div>
        ))}
      </div>

      {/* Add member panel */}
      {addSlug && (
        <div className="pixel-card">
          <h2 className="text-[10px] text-gray-400 mb-3">
            ADD MEMBER TO {teams.find(t => t.slug === addSlug)?.name.toUpperCase()}
          </h2>
          <form onSubmit={handleAddMember} className="space-y-2">
            <div>
              <label className="block text-[8px] text-gray-500 mb-1">EMAIL (must be registered)</label>
              <input
                type="email"
                className="pixel-input"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[8px] text-gray-500 mb-1">ROLE</label>
              <select
                className="pixel-input"
                value={memberRole}
                onChange={e => setMemberRole(e.target.value as 'developer' | 'lead')}
              >
                <option value="developer">Developer</option>
                <option value="lead">Lead</option>
              </select>
            </div>
            <button type="submit" className="pixel-btn">ADD</button>
            {addMsg && <p className="text-[8px] text-city-accent">{addMsg}</p>}
          </form>
        </div>
      )}
    </div>
  );
}
