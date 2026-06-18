'use client';

import { Activity, Radio, MapPin, ChevronRight } from 'lucide-react';
import { useState } from 'react';

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

interface LobbyDashboardProps {
  activeMatches: ActiveMatchSummary[];
  loading: boolean;
  onSelectMatch: (matchId: string) => void;
}

export default function LobbyDashboard({ activeMatches, loading, onSelectMatch }: LobbyDashboardProps) {
  // Placeholder for upcoming tournaments (can be fetched from API later)
  const [upcomingTournaments] = useState<any[]>([]); 

  return (
    <main className="max-w-4xl mx-auto space-y-8">
      {/* Live Matches Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2"><Radio className="text-red-500 animate-pulse" /> Live Matches</h2>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 animate-pulse">Loading active matches...</div>
      ) : activeMatches.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-slate-400 shadow-lg">
          <Activity size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No live matches at the moment.</p>
          <p className="text-sm">Matches scheduled by the Admin will automatically appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeMatches.map((match) => (
            <div 
              key={match.matchId} 
              onClick={() => onSelectMatch(match.matchId)}
              className="group bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 cursor-pointer transition-all shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded">Live</span>
                <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {match.tournament}</span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-200">{match.teamA} <span className="text-slate-500 text-sm mx-1">vs</span> {match.teamB}</h3>
              </div>

              <div className="bg-zinc-950 rounded-lg p-4 flex justify-between items-center border border-zinc-800/50">
                <div>
                  <div className="text-2xl font-extrabold text-white">{match.totalRuns}/{match.totalWickets}</div>
                  <div className="text-xs text-slate-400">Overs: {match.overs}.{match.ballsInCurrentOver}</div>
                </div>
                <ChevronRight className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Tournaments Section (Placeholder) */}
      <div className="py-8 border-t border-zinc-800">
        <h2 className="text-xl font-bold mb-4">Upcoming Tournaments</h2>
        {upcomingTournaments.length === 0 ? (
          <p className="text-slate-400">No upcoming tournaments scheduled yet.</p>
        ) : (
          // Render upcoming tournaments here
          <p className="text-slate-400">Display list of upcoming tournaments...</p>
        )}
      </div>
    </main>
  );
}