'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Trophy, Target, TrendingUp, Award } from 'lucide-react';

interface PlayerStats {
  player: {
    id: string;
    name: string;
    role: string | null;
    isCaptain: boolean;
    playerId: number;
  };
  summary: {
    matchesPlayed: number;
    tournamentsPlayed: number;
  };
  batting: {
    totalRuns: number;
    totalBallsFaced: number;
    totalFours: number;
    totalSixes: number;
    timesOut: number;
    highestScore: number;
    average: number;
    strikeRate: number;
  };
  bowling: {
    totalWickets: number;
    totalRunsConceded: number;
    totalBallsBowled: number;
    totalOversBowled: number;
    economyRate: number;
    bestBowling: string;
  };
  perMatchBatting: Array<{
    matchId: string;
    tournament: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    notOut: boolean;
  }>;
  perMatchBowling: Array<{
    matchId: string;
    tournament: string;
    wickets: number;
    runs: number;
    overs: number;
  }>;
}

export default function PlayerDashboardPage() {
  const params = useParams();
  const playerId = params.playerId as string;
  
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/users/${playerId}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError('Failed to load stats');
        }
      } catch (err) {
        setError('An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (playerId) {
      fetchStats();
    }
  }, [playerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Loading stats...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <p className="text-red-400">{error || 'No stats available'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-500 mb-2">{stats.player.name}</h1>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Player ID: <span className="text-emerald-400 font-mono">{stats.player.playerId}</span></span>
            {stats.player.role && <span>• {stats.player.role}</span>}
            {stats.player.isCaptain && <span>• <span className="text-yellow-400">Captain</span></span>}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Trophy size={16} />
              <span className="text-sm">Matches</span>
            </div>
            <p className="text-2xl font-bold">{stats.summary.matchesPlayed}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Award size={16} />
              <span className="text-sm">Tournaments</span>
            </div>
            <p className="text-2xl font-bold">{stats.summary.tournamentsPlayed}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Target size={16} />
              <span className="text-sm">Total Runs</span>
            </div>
            <p className="text-2xl font-bold">{stats.batting.totalRuns}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <TrendingUp size={16} />
              <span className="text-sm">Wickets</span>
            </div>
            <p className="text-2xl font-bold">{stats.bowling.totalWickets}</p>
          </div>
        </div>

        {/* Batting Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Target size={20} className="text-emerald-500" />
            Batting Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Total Runs</p>
              <p className="text-2xl font-bold text-emerald-400">{stats.batting.totalRuns}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Balls Faced</p>
              <p className="text-2xl font-bold">{stats.batting.totalBallsFaced}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Fours / Sixes</p>
              <p className="text-2xl font-bold">{stats.batting.totalFours} / {stats.batting.totalSixes}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Highest Score</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.batting.highestScore}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Average</p>
              <p className="text-2xl font-bold">{stats.batting.average}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Strike Rate</p>
              <p className="text-2xl font-bold">{stats.batting.strikeRate}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Times Out</p>
              <p className="text-2xl font-bold">{stats.batting.timesOut}</p>
            </div>
          </div>
        </div>

        {/* Bowling Stats */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-violet-500" />
            Bowling Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Total Wickets</p>
              <p className="text-2xl font-bold text-violet-400">{stats.bowling.totalWickets}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Runs Conceded</p>
              <p className="text-2xl font-bold">{stats.bowling.totalRunsConceded}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Overs Bowled</p>
              <p className="text-2xl font-bold">{stats.bowling.totalOversBowled}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Best Bowling</p>
              <p className="text-2xl font-bold text-yellow-400">{stats.bowling.bestBowling}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Economy Rate</p>
              <p className="text-2xl font-bold">{stats.bowling.economyRate}</p>
            </div>
          </div>
        </div>

        {/* Per Match Batting */}
        {stats.perMatchBatting.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Batting by Match</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-zinc-800">
                    <th className="text-left py-2">Tournament</th>
                    <th className="text-center py-2">Runs</th>
                    <th className="text-center py-2">Balls</th>
                    <th className="text-center py-2">4s</th>
                    <th className="text-center py-2">6s</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perMatchBatting.map((match) => (
                    <tr key={match.matchId} className="border-b border-zinc-800/50">
                      <td className="py-2 text-slate-300">{match.tournament}</td>
                      <td className="text-center py-2 font-semibold">{match.runs}</td>
                      <td className="text-center py-2">{match.balls}</td>
                      <td className="text-center py-2">{match.fours}</td>
                      <td className="text-center py-2">{match.sixes}</td>
                      <td className="text-center py-2">
                        {match.notOut ? (
                          <span className="text-emerald-400">Not Out</span>
                        ) : (
                          <span className="text-slate-400">Out</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Per Match Bowling */}
        {stats.perMatchBowling.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Bowling by Match</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-zinc-800">
                    <th className="text-left py-2">Tournament</th>
                    <th className="text-center py-2">Overs</th>
                    <th className="text-center py-2">Wickets</th>
                    <th className="text-center py-2">Runs</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.perMatchBowling.map((match) => (
                    <tr key={match.matchId} className="border-b border-zinc-800/50">
                      <td className="py-2 text-slate-300">{match.tournament}</td>
                      <td className="text-center py-2">{match.overs.toFixed(1)}</td>
                      <td className="text-center py-2 font-semibold text-violet-400">{match.wickets}</td>
                      <td className="text-center py-2">{match.runs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}