import React, { useState } from 'react';
import { Team, Match } from '../types';

interface ScheduleMatchStepProps {
  teams: Team[];
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  startPreMatch: (match: Match) => void;
}

export default function ScheduleMatchStep({ teams, matches, setMatches, startPreMatch }: ScheduleMatchStepProps) {
  const [selectedTeamA, setSelectedTeamA] = useState('');
  const [selectedTeamB, setSelectedTeamB] = useState('');

  const handleScheduleMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamA || !selectedTeamB || selectedTeamA === selectedTeamB) return;
    const teamA = teams.find(t => t.id === selectedTeamA);
    const teamB = teams.find(t => t.id === selectedTeamB);
    if (teamA && teamB) {
      setMatches([...matches, { id: crypto.randomUUID(), teamA, teamB, date: new Date().toISOString(), status: 'SCHEDULED' }]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-lg animate-fade-in-up">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">Schedule Matches</h2>
      
      <form onSubmit={handleScheduleMatch} className="flex gap-4 items-end mb-8">
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-1">Team 1</label>
          <select required value={selectedTeamA} onChange={e => setSelectedTeamA(e.target.value)} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:border-emerald-500">
            <option value="">Select Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="pb-2 font-bold text-slate-500">VS</div>
        <div className="flex-1">
          <label className="block text-sm text-slate-400 mb-1">Team 2</label>
          <select required value={selectedTeamB} onChange={e => setSelectedTeamB(e.target.value)} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:border-emerald-500">
            <option value="">Select Team</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded h-10">Add</button>
      </form>

      <div className="space-y-3">
        {matches.map(m => (
          <div key={m.id} className="flex items-center justify-between p-4 bg-zinc-950 border border-zinc-800 rounded">
            <div className="font-semibold text-lg">{m.teamA.shortName} <span className="text-slate-500 text-sm mx-2">vs</span> {m.teamB.shortName}</div>
            <button onClick={() => startPreMatch(m)} className="bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 py-1 px-4 rounded text-sm transition-colors">
              Start Match
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}