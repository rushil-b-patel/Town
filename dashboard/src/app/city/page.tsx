'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/auth';
import { api, type Team } from '@/lib/api';
import BuildingPanel from '@/components/BuildingPanel';

const CityCanvas = dynamic(() => import('@/components/CityCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full min-h-[540px]">
      <p className="text-[10px] text-gray-500 animate-pulse">Loading 3D engine...</p>
    </div>
  ),
});

export default function CityPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selected, setSelected] = useState<Team | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    api.get<{ teams: Team[] }>('/api/teams')
      .then(d => setTeams(d.teams))
      .catch(() => {})
      .finally(() => setFetching(false));
  }, [user]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!user) return;
    const iv = setInterval(() => {
      api.get<{ teams: Team[] }>('/api/teams')
        .then(d => setTeams(d.teams))
        .catch(() => {});
    }, 30_000);
    return () => clearInterval(iv);
  }, [user]);

  const handleBuildingClick = useCallback((team: Team) => setSelected(team), []);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-city-accent text-[10px] animate-pulse">Loading city...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b-2 border-city-border bg-city-panel/80">
        <div className="flex items-center gap-4">
          <span className="text-city-accent text-[10px]">CODETOWN</span>
          <span className="text-[8px] text-gray-500">|</span>
          <span className="text-[8px] text-gray-400">{user.displayName}</span>
          <span className="text-[8px] px-1 border border-city-border text-gray-500">{user.trigram}</span>
        </div>
        <div className="flex items-center gap-3">
          {user.role === 'manager' && (
            <Link href="/city/manage" className="text-city-gold text-[8px] hover:underline">
              MANAGE TEAMS
            </Link>
          )}
          <button onClick={logout} className="text-[8px] text-gray-500 hover:text-red-400">
            LOGOUT
          </button>
        </div>
      </header>

      {/* City */}
      <main className="flex-1 relative overflow-hidden">
        {fetching ? (
          <div className="flex items-center justify-center h-full min-h-[540px]">
            <p className="text-[10px] text-gray-500 animate-pulse">Constructing city...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[540px] gap-3">
            <p className="text-[10px] text-gray-400">The city is empty.</p>
            {user.role === 'manager' ? (
              <Link href="/city/manage" className="pixel-btn">
                BUILD YOUR FIRST TEAM
              </Link>
            ) : (
              <p className="text-[8px] text-gray-500">Ask your manager to create a team and add you.</p>
            )}
          </div>
        ) : (
          <CityCanvas teams={teams} onBuildingClick={handleBuildingClick} />
        )}

        {selected && <BuildingPanel team={selected} onClose={() => setSelected(null)} />}
      </main>

      {/* Footer */}
      <footer className="px-4 py-1 border-t border-city-border text-[7px] text-gray-600 text-center">
        {teams.length} building{teams.length !== 1 ? 's' : ''} in the city — refreshes every 30s
      </footer>
    </div>
  );
}
