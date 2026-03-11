'use client';
import React, { useState } from 'react';
import { useOfficeStore } from '@/store/officeStore';
import { ROLE_LABELS } from '@/types';
import PixelAvatar from './PixelAvatar';
import TeamManager from './TeamManager';

export default function OfficeHUD() {
  const { currentUser, currentTeam, zoom, setZoom, logout, employees } = useOfficeStore();
  const [showTeamManager, setShowTeamManager] = useState(false);

  if (!currentUser) return null;

  const activeCount = employees.length;

  return (
    <>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-[#1a1d27]/90 backdrop-blur-sm border-b border-[#2e3347]/50">
        {/* Left: Team info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-pixel text-[10px] text-[#4A90D9]">🏘</span>
            <span className="text-sm font-semibold text-white">
              {currentTeam?.name || 'Town'}
            </span>
          </div>
          <div className="w-px h-4 bg-[#2e3347]" />
          <span className="text-xs text-[#555d75]">
            {activeCount} member{activeCount !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Center: Zoom controls */}
        <div className="flex items-center gap-1 bg-[#242837] rounded-lg px-1 py-0.5 border border-[#2e3347]/50">
          <button onClick={() => setZoom(zoom - 0.2)} className="px-2 py-1 text-xs text-[#8b92a8] hover:text-white transition-colors">−</button>
          <span className="text-[10px] text-[#555d75] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.2)} className="px-2 py-1 text-xs text-[#8b92a8] hover:text-white transition-colors">+</button>
          <div className="w-px h-3 bg-[#2e3347]" />
          <button onClick={() => setZoom(1)} className="px-2 py-1 text-[10px] text-[#555d75] hover:text-white transition-colors">Reset</button>
        </div>

        {/* Right: User info & actions */}
        <div className="flex items-center gap-3">
          {currentUser.role === 'manager' && (
            <button
              onClick={() => setShowTeamManager(true)}
              className="text-xs px-3 py-1.5 bg-[#242837] text-[#8b92a8] hover:text-white rounded-lg border border-[#2e3347]/50 transition-colors"
            >
              Team
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="bg-[#242837] rounded-lg p-1 border border-[#2e3347]/50">
              <PixelAvatar config={currentUser.avatarConfig} size={20} direction="down" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-white font-medium leading-tight">{currentUser.displayName}</span>
              <span className="text-[9px] text-[#555d75] leading-tight">{ROLE_LABELS[currentUser.role]}</span>
            </div>
          </div>
          <button onClick={logout} className="text-[10px] text-[#555d75] hover:text-[#b13e53] transition-colors ml-1" title="Logout">
            ↩
          </button>
        </div>
      </div>

      {/* Team Manager Modal */}
      {showTeamManager && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#1a1d27] rounded-2xl border border-[#2e3347] shadow-2xl w-[520px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#2e3347]">
              <h2 className="text-sm font-semibold text-white">Team Management</h2>
              <button onClick={() => setShowTeamManager(false)} className="text-[#555d75] hover:text-white text-lg leading-none p-1">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <TeamManager />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
