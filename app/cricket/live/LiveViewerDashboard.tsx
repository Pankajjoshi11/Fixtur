'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getPusherClient } from '@/lib/pusher';
import { Trophy, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import LobbyDashboard from './LobbyDashboard';
import AuthButtons from './AuthButtons';
import { signOut } from 'next-auth/react';

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
  user: { id: string; email: string; name?: string; image?: string } | null;
  playerId?: number;
}) {
  const router = useRouter();
  const [activeMatches, setActiveMatches] = useState<ActiveMatchSummary[]>([]);
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
    await signOut({ callbackUrl: '/cricket/live' });
  };

  const handleSelectMatch = (matchId: string) => {
    router.push(`/cricket/live/match/${matchId}`);
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
                className="flex items-center gap-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors pr-3 pl-1 py-1"
              >
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || 'User'}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <UserIcon size={18} className="text-white" />
                  </div>
                )}
                <span className="text-sm text-slate-300 max-w-[100px] truncate">
                  {user.name || user.email}
                </span>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-lg shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-zinc-800">
                    <p className="text-sm font-medium text-slate-200 truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    {playerId && (
                      <p className="text-xs text-slate-400 mt-1">
                        Player ID: <span className="text-emerald-400 font-mono">{playerId}</span>
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/cricket/live/${playerId || ''}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-zinc-800 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <LayoutDashboard size={16} />
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-zinc-800 transition-colors"
                  >
                    <LogOut size={16} />
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

      <LobbyDashboard
        activeMatches={activeMatches}
        loading={loading}
        onSelectMatch={handleSelectMatch}
      />
    </div>
  );
}