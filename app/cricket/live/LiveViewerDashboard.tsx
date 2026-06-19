'use client';

import { useState, useEffect } from 'react';
import { getPusherClient } from '@/lib/pusher';
import { Trophy, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import LobbyDashboard from './LobbyDashboard';
import MatchDetailView from './MatchDetailView';
import AuthButtons from './AuthButtons';

type ActiveMatchSummary = {
  matchId: string;
  teamA: string;
  teamB: string;
  tournament: string;
  totalRuns: number;
  totalWickets: number;
  overs: number;
  ballsInCurrentOver: number;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  lastUpdated: number;
};

export default function LiveViewerDashboard({
  user,
  playerId,
}: {
  user: { id: string; email: string } | null;
  playerId?: string;
}) {
  const [activeMatches, setActiveMatches] = useState<ActiveMatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('/api/scoring/sync');
        if (res.ok) {
          const data = await res.json();
          setActiveMatches(data.matches || []);
        } else {
          console.error('Failed to fetch lobby matches:', res.statusText);
        }
      } catch (err) {
        console.error('Error fetching lobby matches:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();

    const pusher = getPusherClient();
    if (!pusher) return;

    const channel = pusher.subscribe('global-lobby');
    channel.bind('matches-update', (updatedMatches: ActiveMatchSummary[]) => {
      setActiveMatches(updatedMatches);
    });

    return () => {
      channel.unbind('matches-update');
      pusher.unsubscribe('global-lobby');
    };
  }, []);

  const handleLogout = async () => {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 p-4 md:p-8 font-sans">
      <header className="max-w-4xl mx-auto border-b border-zinc-800 pb-4 mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-emerald-500 tracking-tight flex items-center gap-3">
            <Trophy size={32} /> Fixtur Live
          </h1>
          <p className="text-slate-400 mt-1">Real-time match center.</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link
            href="/"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/cricket/admin"
            className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Admin Panel
          </Link>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                aria-label="User menu"
                className="rounded-full bg-emerald-500 p-2 text-white hover:bg-emerald-600 transition-colors"
              >
                <UserIcon size={20} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-md shadow-lg py-1 z-50">
                  {playerId && (
                    <div className="px-4 py-2 text-xs text-slate-400 border-b border-zinc-800">
                      Player ID: <span className="text-emerald-400 font-mono">{playerId}</span>
                    </div>
                  )}
                  <Link
                    href={`/cricket/live/${playerId || ''}`}
                    className="block px-4 py-2 text-sm text-slate-200 hover:bg-zinc-800"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-zinc-800"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <AuthButtons />
          )}
        </div>
      </header>

      {selectedMatchId ? (
        <MatchDetailView
          matchId={selectedMatchId}
          onBackToLobby={() => setSelectedMatchId(null)}
        />
      ) : (
        <LobbyDashboard
          activeMatches={activeMatches}
          loading={loading}
          onSelectMatch={setSelectedMatchId}
        />
      )}
    </div>
  );
}