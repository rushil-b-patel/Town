'use client';

import { useEffect, useState } from 'react';
import { api, type Team, type TeamDetail, type TeamMember } from '@/lib/api';

interface Props {
  team: Team;
  onClose: () => void;
}

export default function BuildingPanel({ team, onClose }: Props) {
  const [detail, setDetail] = useState<TeamDetail | null>(null);
  const [error, setError] = useState('');
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    api.get<TeamDetail>(`/api/teams/${team.slug}`)
      .then(setDetail)
      .catch(e => setError(e.message));
  }, [team.slug]);

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-city-panel/95 border-l-2 border-city-border overflow-y-auto backdrop-blur-sm animate-slide-in">
      {/* Header */}
      <div className="p-4 border-b-2 border-city-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4" style={{ backgroundColor: team.color }} />
          <h2 className="text-city-accent text-[10px]">{team.name.toUpperCase()}</h2>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-white text-xs">
          [X]
        </button>
      </div>

      {error && <p className="p-4 text-red-400 text-[8px]">{error}</p>}

      {!detail && !error && (
        <p className="p-4 text-gray-500 text-[8px] animate-pulse">Loading team data...</p>
      )}

      {detail && (
        <div className="p-4 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2">
            <StatBox label="MEMBERS" value={String(detail.members.length)} />
            <StatBox label="YOUR ROLE" value={team.my_role.toUpperCase()} />
          </div>

          {/* API Key (managers only) */}
          {team.my_role === 'manager' && (
            <div className="pixel-card text-[8px]">
              <p className="text-gray-400 mb-1">EXTENSION API KEY</p>
              <div className="flex items-center gap-1">
                <code className="flex-1 text-city-gold break-all">
                  {showKey ? detail.api_key : '••••••••••••••••'}
                </code>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-city-accent hover:underline"
                >
                  {showKey ? 'HIDE' : 'SHOW'}
                </button>
              </div>
              <p className="text-gray-600 mt-1">Share with team for VS Code extension</p>
            </div>
          )}

          {/* Member list */}
          <div>
            <h3 className="text-[8px] text-gray-400 mb-2">RESIDENTS</h3>
            <div className="space-y-1">
              {detail.members.map(m => (
                <MemberRow key={m.id} member={m} teamColor={team.color} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="pixel-card text-center">
      <p className="text-[8px] text-gray-500">{label}</p>
      <p className="text-sm text-city-accent mt-1">{value}</p>
    </div>
  );
}

function MemberRow({ member, teamColor }: { member: TeamMember; teamColor: string }) {
  return (
    <div className="flex items-center gap-2 p-2 border border-city-border hover:border-city-accent/30 transition-colors">
      <div className="w-6 h-6 flex items-center justify-center text-[6px] text-white font-pixel" style={{ backgroundColor: teamColor }}>
        {member.trigram}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[8px] text-white truncate">{member.display_name}</p>
        <p className="text-[7px] text-gray-500">{member.role}{member.sub_team ? ` / ${member.sub_team}` : ''}</p>
      </div>
    </div>
  );
}
