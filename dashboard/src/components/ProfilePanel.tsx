'use client';

import React from 'react';
import PixelAvatar from './PixelAvatar';
import { useOfficeStore } from '@/store/officeStore';

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f7df1e',
  Python: '#3572A5',
  Go: '#00ADD8',
  Rust: '#dea584',
  CSS: '#563d7c',
  HTML: '#e34c26',
  SQL: '#e38c00',
  Java: '#b07219',
  Ruby: '#701516',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  PHP: '#4F5D95',
  Swift: '#ffac45',
  Kotlin: '#A97BFF',
};

export default function ProfilePanel() {
  const isPanelOpen = useOfficeStore(s => s.isPanelOpen);
  const selectedProfile = useOfficeStore(s => s.selectedProfile);
  const closePanel = useOfficeStore(s => s.closePanel);

  if (!isPanelOpen || !selectedProfile) return null;

  const { employee, summary, languages, streak, sprints, daily } = selectedProfile;
  const longestSprint = sprints.length > 0
    ? Math.max(...sprints.map(s => s.duration_minutes))
    : 0;

  return (
    <div className="fixed right-0 top-0 h-full w-[380px] z-50 animate-slide-up">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#1a1c2c]/95 backdrop-blur-sm" />

      <div className="relative h-full flex flex-col overflow-y-auto p-4">
        {/* Close button */}
        <button
          onClick={closePanel}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center
            bg-[#3a3a5c] hover:bg-[#b13e53] text-white text-[10px] font-pixel
            transition-colors z-10"
        >
          ✕
        </button>

        {/* Header with avatar */}
        <div className="flex items-center gap-4 mb-6 pt-2">
          <div className="pixel-border bg-[#2a2a4c] p-2">
            <PixelAvatar config={employee.avatarConfig} size={48} isActive={streak?.today_active} />
          </div>
          <div>
            <h2 className="text-[12px] font-pixel text-[#73eff7] leading-relaxed">
              {employee.displayName}
            </h2>
            <p className="text-[8px] font-pixel text-[#f4f4f4]/60 mt-1">
              {employee.trigram} • {employee.memberRole}
            </p>
            <p className="text-[7px] font-pixel text-[#f4f4f4]/40 mt-0.5">
              {employee.subTeam} team
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-2 h-2 ${streak?.today_active ? 'bg-[#38b764]' : 'bg-[#5a5a5c]'}`} />
          <span className="text-[7px] font-pixel text-[#f4f4f4]/70">
            {streak?.today_active ? 'Active today' : 'Away'}
          </span>
        </div>

        {/* Stats grid */}
        {summary && (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatBox label="Coding Time" value={formatMinutes(summary.coding_minutes)} color="#41a6f6" icon="⌨" />
            <StatBox label="Active Time" value={formatMinutes(summary.active_minutes)} color="#38b764" icon="◉" />
            <StatBox label="Sessions" value={String(summary.session_count)} color="#f77622" icon="▶" />
            <StatBox label="Sprints" value={String(summary.sprint_count)} color="#b13e53" icon="⚡" />
            <StatBox label="Longest Sprint" value={formatMinutes(longestSprint)} color="#73eff7" icon="🏆" />
            <StatBox label="Learning" value={formatMinutes(summary.learning_minutes)} color="#5d275d" icon="📖" />
          </div>
        )}

        {/* Streak section */}
        {streak && (
          <div className="bg-[#2a2a4c] p-3 mb-4 pixel-border">
            <h3 className="text-[8px] font-pixel text-[#f77622] mb-2">🔥 Streak</h3>
            <div className="flex justify-between">
              <div>
                <div className="text-[14px] font-pixel text-white">{streak.current_streak}</div>
                <div className="text-[6px] font-pixel text-[#f4f4f4]/50">current days</div>
              </div>
              <div>
                <div className="text-[14px] font-pixel text-[#f77622]">{streak.longest_streak}</div>
                <div className="text-[6px] font-pixel text-[#f4f4f4]/50">longest</div>
              </div>
            </div>
          </div>
        )}

        {/* Languages */}
        {languages.length > 0 && (
          <div className="bg-[#2a2a4c] p-3 mb-4 pixel-border">
            <h3 className="text-[8px] font-pixel text-[#41a6f6] mb-3">💻 Languages</h3>
            <div className="space-y-2">
              {languages.slice(0, 6).map(lang => (
                <div key={lang.language}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[7px] font-pixel text-[#f4f4f4]/80">{lang.language}</span>
                    <span className="text-[6px] font-pixel text-[#f4f4f4]/50">{lang.percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#1a1c2c]">
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${lang.percentage}%`,
                        backgroundColor: LANG_COLORS[lang.language] || '#5a5a8c',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily activity chart */}
        {daily.length > 0 && (
          <div className="bg-[#2a2a4c] p-3 mb-4 pixel-border">
            <h3 className="text-[8px] font-pixel text-[#38b764] mb-3">📊 This Week</h3>
            <div className="flex items-end gap-1 h-16">
              {daily.map((day, i) => {
                const maxMins = Math.max(...daily.map(d => d.total_active_minutes), 1);
                const height = (day.total_active_minutes / maxMins) * 100;
                const dayLabel = new Date(day.date).toLocaleDateString('en', { weekday: 'short' }).slice(0, 2);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full relative" style={{ height: '48px' }}>
                      <div
                        className="absolute bottom-0 w-full transition-all duration-300"
                        style={{ height: `${height}%` }}
                      >
                        <div
                          className="w-full h-full"
                          style={{
                            backgroundColor: day.total_active_minutes > 0 ? '#38b764' : '#2a2a3c',
                          }}
                        />
                        {day.coding_minutes > 0 && (
                          <div
                            className="absolute bottom-0 w-full"
                            style={{
                              height: `${(day.coding_minutes / Math.max(day.total_active_minutes, 1)) * 100}%`,
                              backgroundColor: '#41a6f6',
                            }}
                          />
                        )}
                      </div>
                    </div>
                    <span className="text-[5px] font-pixel text-[#f4f4f4]/40">{dayLabel}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 mt-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#41a6f6]" />
                <span className="text-[5px] font-pixel text-[#f4f4f4]/40">coding</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-[#38b764]" />
                <span className="text-[5px] font-pixel text-[#f4f4f4]/40">active</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent sprints */}
        {sprints.length > 0 && (
          <div className="bg-[#2a2a4c] p-3 pixel-border">
            <h3 className="text-[8px] font-pixel text-[#b13e53] mb-3">⚡ Recent Sprints</h3>
            <div className="space-y-1.5">
              {sprints.slice(0, 5).map((sprint, i) => (
                <div key={i} className="flex items-center justify-between bg-[#1a1c2c] px-2 py-1">
                  <span className="text-[6px] font-pixel text-[#f4f4f4]/60">
                    {new Date(sprint.start_ts).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  </span>
                  <span className="text-[7px] font-pixel text-[#73eff7]">
                    {formatMinutes(sprint.duration_minutes)}
                  </span>
                  <span className="text-[6px] font-pixel text-[#f4f4f4]/40">
                    {sprint.event_count} events
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Left border glow */}
      <div className="absolute left-0 top-0 w-[2px] h-full bg-gradient-to-b from-[#41a6f6] via-[#73eff7] to-[#41a6f6]" />
    </div>
  );
}

function StatBox({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <div className="bg-[#2a2a4c] p-2.5 pixel-border hover:bg-[#3a3a5c] transition-colors">
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px]">{icon}</span>
        <span className="text-[6px] font-pixel text-[#f4f4f4]/50 uppercase">{label}</span>
      </div>
      <div className="text-[12px] font-pixel" style={{ color }}>{value}</div>
    </div>
  );
}
