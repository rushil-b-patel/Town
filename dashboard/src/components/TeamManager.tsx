'use client';
import React, { useState } from 'react';
import { useOfficeStore } from '../store/officeStore';
import type { OrgRole } from '../types';
import { ROLE_LABELS } from '../types';

export default function TeamManager() {
  const { currentUser, currentTeam, createTeam, inviteMember, error } = useOfficeStore();
  const [tab, setTab] = useState<'overview' | 'create' | 'invite'>('overview');
  const [teamName, setTeamName] = useState('');
  const [teamSlug, setTeamSlug] = useState('');
  const [teamColor, setTeamColor] = useState('#4A90D9');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('developer');
  const [inviteSubTeam, setInviteSubTeam] = useState('');
  const [msg, setMsg] = useState('');

  if (!currentUser) return null;
  const isManager = currentUser.role === 'manager';

  const handleCreate = async () => {
    if (!teamName.trim()) return;
    const slug = teamSlug.trim() || teamName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await createTeam(teamName, slug, teamColor);
    setMsg('Team created!');
    setTeamName(''); setTeamSlug('');
    setTimeout(() => setMsg(''), 3000);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    await inviteMember(inviteEmail, inviteRole, inviteSubTeam || undefined);
    setMsg('Member invited!');
    setInviteEmail('');
    setTimeout(() => setMsg(''), 3000);
  };

  const TEAM_COLORS = ['#4A90D9', '#38b764', '#b13e53', '#f77622', '#5d275d', '#41a6f6', '#333333'];

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-[#242837] rounded-xl p-1">
        {(['overview', ...(isManager ? ['create', 'invite'] : [])] as const).map(t => (
          <button key={t} onClick={() => setTab(t as any)}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize
              ${tab === t ? 'bg-[#4A90D9] text-white' : 'text-[#8b92a8] hover:text-white'}`}
          >{t}</button>
        ))}
      </div>

      {msg && (
        <div className="bg-[#38b764]/15 border border-[#38b764]/30 text-[#38b764] px-3 py-2 rounded-lg text-xs">{msg}</div>
      )}
      {error && (
        <div className="bg-[#b13e53]/15 border border-[#b13e53]/30 text-[#b13e53] px-3 py-2 rounded-lg text-xs">{error}</div>
      )}

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-3">
          {currentTeam ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentTeam.color }} />
                <span className="text-sm font-semibold text-white">{currentTeam.name}</span>
                <span className="text-xs text-[#555d75]">•</span>
                <span className="text-xs text-[#8b92a8]">{currentTeam.members?.length || 0} members</span>
              </div>

              {currentTeam.subTeams?.map(sub => (
                <div key={sub.id} className="bg-[#242837] rounded-xl p-3 border border-[#2e3347]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">{sub.name}</span>
                    {sub.leadName && <span className="text-[10px] text-[#4A90D9]">Lead: {sub.leadName}</span>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sub.members?.map(m => (
                      <span key={m.id} className="bg-[#1a1d27] px-2 py-1 rounded text-[10px] text-[#8b92a8]">
                        {m.trigram}
                      </span>
                    ))}
                    {(!sub.members || sub.members.length === 0) && (
                      <span className="text-[10px] text-[#555d75]">No members</span>
                    )}
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-[#8b92a8] mb-2">No team yet</p>
              {isManager && (
                <button onClick={() => setTab('create')}
                  className="text-xs text-[#4A90D9] hover:underline">Create one</button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Team */}
      {tab === 'create' && isManager && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Team Name</label>
            <input type="text" value={teamName} onChange={e => setTeamName(e.target.value)}
              placeholder="Engineering" className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Slug</label>
            <input type="text" value={teamSlug} onChange={e => setTeamSlug(e.target.value)}
              placeholder="engineering" className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Color</label>
            <div className="flex gap-2">
              {TEAM_COLORS.map(c => (
                <button key={c} onClick={() => setTeamColor(c)}
                  className={`w-8 h-8 rounded-lg transition-all ${teamColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1d27] scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <button onClick={handleCreate}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-[#4A90D9] hover:bg-[#3a80c9] transition-all">
            Create Team
          </button>
        </div>
      )}

      {/* Invite */}
      {tab === 'invite' && isManager && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Email</label>
            <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              placeholder="member@company.com" className="w-full bg-[#242837] border border-[#2e3347] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#555d75] focus:outline-none focus:border-[#4A90D9]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ROLE_LABELS) as OrgRole[]).map(r => (
                <button key={r} onClick={() => setInviteRole(r)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all
                    ${inviteRole === r ? 'bg-[#4A90D9] text-white' : 'bg-[#242837] text-[#8b92a8] hover:bg-[#2e3347]'}`}
                >{ROLE_LABELS[r]}</button>
              ))}
            </div>
          </div>
          {currentTeam?.subTeams && currentTeam.subTeams.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-[#8b92a8] mb-1.5">Sub-Team</label>
              <div className="flex flex-wrap gap-2">
                {currentTeam.subTeams.map(s => (
                  <button key={s.id} onClick={() => setInviteSubTeam(s.name)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all
                      ${inviteSubTeam === s.name ? 'bg-[#4A90D9] text-white' : 'bg-[#242837] text-[#8b92a8] hover:bg-[#2e3347]'}`}
                  >{s.name}</button>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleInvite}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-white bg-[#4A90D9] hover:bg-[#3a80c9] transition-all">
            Invite Member
          </button>
        </div>
      )}
    </div>
  );
}
