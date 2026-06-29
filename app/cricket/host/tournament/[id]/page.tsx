'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft, Users, Calendar, MapPin, Edit, Trash2, Plus, Play } from 'lucide-react';

interface Tournament {
  id: string;
  name: string;
  sport: string;
  location: string | null;
  format: string | null;
  numberOfOvers: number | null;
  startDate: string;
  endDate: string | null;
}

interface Team {
  id: string;
  name: string;
  shortName: string;
  players: Player[];
}

interface Player {
  id: string;
  name: string;
  role: string | null;
  isCaptain: boolean;
  playerId: number | null;
}

interface Match {
  id: string;
  title: string | null;
  status: string;
  homeTeam: Team;
  awayTeam: Team;
}

export default function HostTournamentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      const [tournamentRes, teamsRes, matchesRes] = await Promise.all([
        fetch(`/api/host/tournaments/${tournamentId}`),
        fetch(`/api/host/tournaments/${tournamentId}/teams`),
        fetch(`/api/tournaments/${tournamentId}/matches`),
      ]);

      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      if (matchesRes.ok) {
        const matchesData = await matchesRes.json();
        setMatches(matchesData);
      }
    } catch (error) {
      console.error('Failed to fetch tournament data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTournament = async () => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/host/tournaments/${tournamentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/cricket/host/dashboard');
      } else {
        alert('Failed to delete tournament');
      }
    } catch (error) {
      console.error('Failed to delete tournament:', error);
      alert('Failed to delete tournament');
    }
  };

  const handleAddTeam = async () => {
    const name = prompt('Enter team name:');
    if (!name) return;

    const shortName = prompt('Enter short name:');
    if (!shortName) return;

    try {
      const res = await fetch(`/api/host/tournaments/${tournamentId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, shortName, players: [] }),
      });

      if (res.ok) {
        fetchTournamentData();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to add team');
      }
    } catch (error) {
      alert('Failed to add team');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LIVE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'COMPLETED':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'SCHEDULED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading tournament...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Tournament not found</p>
          <Link href="/cricket/host/dashboard" className="text-emerald-400 hover:text-emerald-300">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/cricket/host/dashboard" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <Trophy className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">{tournament.name}</h1>
                <p className="text-xs text-slate-500">Tournament Management</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/cricket/host/tournament/${tournamentId}/edit`}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
              >
                <Edit size={16} />
                Edit
              </Link>
              <button
                onClick={handleDeleteTournament}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Tournament Info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="text-emerald-500" size={24} />
                <h2 className="text-2xl font-bold">{tournament.name}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                {tournament.location && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {tournament.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {new Date(tournament.startDate).toLocaleDateString()}
                  {tournament.endDate && ` - ${new Date(tournament.endDate).toLocaleDateString()}`}
                </span>
                <span className="flex items-center gap-1">
                  🏆 {tournament.format || 'Cricket'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teams Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Users size={20} />
                Teams ({teams.length})
              </h3>
              <button
                onClick={handleAddTeam}
                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-medium transition-colors"
              >
                <Plus size={14} />
                Add Team
              </button>
            </div>
            <div className="divide-y divide-zinc-800">
              {teams.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No teams added yet. Click "Add Team" to get started.
                </div>
              ) : (
                teams.map((team) => (
                  <div
                    key={team.id}
                    className="px-6 py-4 hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-slate-200">{team.name}</h4>
                        <p className="text-sm text-slate-400">{team.shortName}</p>
                      </div>
                      <span className="text-sm text-slate-500">
                        {team.players.length} players
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Matches Section */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar size={20} />
                Matches ({matches.length})
              </h3>
            </div>
            <div className="divide-y divide-zinc-800">
              {matches.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  No matches scheduled yet.
                </div>
              ) : (
                matches.map((match) => (
                  <div key={match.id} className="px-6 py-4 hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                        </h4>
                        {match.title && (
                          <p className="text-sm text-slate-400">{match.title}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            match.status
                          )}`}
                        >
                          {match.status}
                        </span>
                        {match.status === 'SCHEDULED' && (
                          <Link
                            href={`/cricket/host/tournament/${tournamentId}/match/${match.id}/start`}
                            className="p-1.5 text-emerald-400 hover:bg-zinc-700 rounded-lg transition-colors"
                            title="Start match"
                          >
                            <Play size={16} />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}