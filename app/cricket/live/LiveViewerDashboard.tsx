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
}: {
  user: { id: string; email: string } | null;
}) {
  const [activeMatches, setActiveMatches] = useState<ActiveMatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // --- LOBBY: Fetch active matches & subscribe to global updates ---
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
            <div className="relative group">
              <button className="rounded-full bg-emerald-500 p-2 text-white">
                <UserIcon size={20} />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                <Link
                  href="/cricket/live/dashboard"
                  className="block px-4 py-2 text-.sm text-gray-700 hover:bg-gray-100"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
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
