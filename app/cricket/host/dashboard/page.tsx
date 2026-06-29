'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Plus, Users, Calendar, Activity, MapPin, Trash2, Edit, Eye } from 'lucide-react';

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

export default function HostDashboard() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const response = await fetch('/api/host/tournaments');
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this tournament?')) {
      return;
    }

    try {
      const res = await fetch(`/api/host/tournaments/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTournaments(tournaments.filter(t => t.id !== id));
      } else {
        alert('Failed to delete tournament');
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      alert('Failed to delete tournament');
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
              <Trophy className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">Host Dashboard</h1>
                <p className="text-xs text-slate-500">Manage your tournaments</p>
              </div>
            </div>
            <Link
              href="/cricket/host/tournament/create"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus size={16} />
              Create Tournament
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-sm">Total</span>
              <Trophy size={20} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-bold">{tournaments.length}</p>
            <p className="text-xs text-slate-500 mt-1">Tournaments</p>
          </div>
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
            <h2 className="text-lg font-semibold">Your Tournaments</h2>
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
                href="/cricket/host/tournament/create"
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
                        <Link
                          href={`/cricket/host/tournament/${tournament.id}`}
                          className="font-semibold text-lg text-slate-200 hover:text-emerald-400 transition-colors"
                        >
                          {tournament.name}
                        </Link>
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
                            <MapPin size={14} />
                            {tournament.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          🏆 {tournament.format || 'Cricket'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {tournament.teamCount} teams
                        </span>
                        <span className="flex items-center gap-1">
                          🏏 {tournament.matchCount} matches
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/cricket/host/tournament/${tournament.id}`}
                        className="p-2 text-slate-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                        title="View tournament"
                      >
                        <Eye size={18} />
                      </Link>
                      <Link
                        href={`/cricket/host/tournament/${tournament.id}/edit`}
                        className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Edit tournament"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(tournament.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Delete tournament"
                      >
                        <Trash2 size={18} />
                      </button>
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