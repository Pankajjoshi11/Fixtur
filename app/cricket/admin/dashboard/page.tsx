'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, Plus, Trophy, Users, Calendar, Activity } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  sport: string;
  location: string | null;
  format: string | null;
  numberOfOvers: number | null;
  startDate: string;
  endDate: string | null;
  status: 'upcoming' | 'ongoing' | 'completed';
  matchCount: number;
  teamCount: number;
  playerCount: number;
}

export default function AdminDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/tournaments');
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'completed':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'upcoming':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <Activity size={14} />;
      case 'completed':
        return <Trophy size={14} />;
      case 'upcoming':
        return <Calendar size={14} />;
      default:
        return null;
    }
  };

  const upcomingCount = tournaments.filter(t => t.status === 'upcoming').length;
  const ongoingCount = tournaments.filter(t => t.status === 'ongoing').length;
  const completedCount = tournaments.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldAlert className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">Fixtur Admin</h1>
                <p className="text-xs text-slate-500">Tournament Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/cricket/admin/users"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Users size={16} />
                Users
              </Link>
              <Link
                href="/cricket/admin/tournament/create"
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Create Tournament
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Upcoming</span>
              <Calendar size={20} className="text-blue-400" />
            </div>
            <p className="text-3xl font-bold">{upcomingCount}</p>
            <p className="text-xs text-slate-500 mt-1">Tournaments scheduled</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Ongoing</span>
              <Activity size={20} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-bold">{ongoingCount}</p>
            <p className="text-xs text-slate-500 mt-1">Tournaments in progress</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Completed</span>
              <Trophy size={20} className="text-slate-400" />
            </div>
            <p className="text-3xl font-bold">{completedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Tournaments finished</p>
          </div>
        </div>

        {/* Tournaments List */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-800">
            <h2 className="text-lg font-semibold">All Tournaments</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Loading tournaments...
            </div>
          ) : tournaments.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-400 mb-2">No tournaments yet</h3>
              <p className="text-sm text-slate-500 mb-6">Create your first tournament to get started</p>
              <Link
                href="/cricket/admin/tournament/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus size={16} />
                Create Tournament
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="px-6 py-4 hover:bg-zinc-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-lg">{tournament.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            tournament.status
                          )}`}
                        >
                          {getStatusIcon(tournament.status)}
                          {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        {tournament.location && (
                          <span className="flex items-center gap-1">
                            📍 {tournament.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          🏆 {tournament.format || 'Cricket'}
                        </span>
                        <span className="flex items-center gap-1">
                          👥 {tournament.teamCount} teams
                        </span>
                        <span className="flex items-center gap-1">
                          🏏 {tournament.matchCount} matches
                        </span>
                        <span className="flex items-center gap-1">
                          🧑 {tournament.playerCount} players
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-sm text-slate-500">
                      <p>{new Date(tournament.startDate).toLocaleDateString()}</p>
                      {tournament.endDate && (
                        <p>to {new Date(tournament.endDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}