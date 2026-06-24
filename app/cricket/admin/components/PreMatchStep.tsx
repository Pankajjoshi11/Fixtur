import React, { useState } from 'react';
import { Match, Team } from '../types';

interface PreMatchStepProps {
  activeMatch: Match;
  tossWinnerId: string;
  setTossWinnerId: (id: string) => void;
  tossDecision: 'BAT' | 'BOWL';
  setTossDecision: (dec: 'BAT' | 'BOWL') => void;
  onStartMatch: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
  battingTeam: Team | null;
  bowlingTeam: Team | null;
}

export default function PreMatchStep({
  activeMatch, tossWinnerId, setTossWinnerId, tossDecision, setTossDecision, onStartMatch, battingTeam, bowlingTeam
}: PreMatchStepProps) {
  const [openingStrikerId, setOpeningStrikerId] = useState('');
  const [openingNonStrikerId, setOpeningNonStrikerId] = useState('');
  const [openingBowlerId, setOpeningBowlerId] = useState('');

  // Handle both teamA/teamB (local) and homeTeam/awayTeam (from API)
  const teamA = activeMatch.teamA || (activeMatch as any).homeTeam;
  const teamB = activeMatch.teamB || (activeMatch as any).awayTeam;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openingStrikerId || !openingNonStrikerId || !openingBowlerId) return;
    onStartMatch(openingStrikerId, openingNonStrikerId, openingBowlerId);
  };

  // Safely get players array
  const battingPlayers = battingTeam?.players || [];
  const bowlingPlayers = bowlingTeam?.players || [];

  return (
    <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-lg animate-fade-in-up">
      <h2 className="text-2xl font-bold mb-2 text-center">{teamA?.name || 'Team A'} vs {teamB?.name || 'Team B'}</h2>
      <p className="text-center text-slate-400 mb-8">Pre-match Setup</p>

      <form onSubmit={handleStart} className="space-y-8">
        <div className="bg-zinc-950 p-6 rounded border border-zinc-800">
          <h3 className="font-semibold mb-4 text-emerald-400">Toss Decision</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Toss Winner</label>
              <select 
                value={tossWinnerId} 
                onChange={e => setTossWinnerId(e.target.value)} 
                className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-slate-200"
                aria-label="Select toss winner"
              >
                <option value={teamA?.id}>{teamA?.name || 'Team A'}</option>
                <option value={teamB?.id}>{teamB?.name || 'Team B'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Decision</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setTossDecision('BAT')} className={`flex-1 py-2 rounded ${tossDecision === 'BAT' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>Bat</button>
                <button type="button" onClick={() => setTossDecision('BOWL')} className={`flex-1 py-2 rounded ${tossDecision === 'BOWL' ? 'bg-emerald-600' : 'bg-zinc-800'}`}>Bowl</button>
              </div>
            </div>
          </div>
        </div>

        {battingTeam && bowlingTeam && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-zinc-950 p-6 rounded border border-zinc-800">
              <h3 className="font-semibold mb-4 text-blue-400">Opening Batsmen ({battingTeam.shortName})</h3>
              <div className="space-y-3">
                <select 
                  required 
                  value={openingStrikerId} 
                  onChange={e => setOpeningStrikerId(e.target.value)} 
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200"
                  aria-label="Select opening striker"
                >
                  <option value="">Select Striker</option>
                  {battingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select 
                  required 
                  value={openingNonStrikerId} 
                  onChange={e => setOpeningNonStrikerId(e.target.value)} 
                  className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200"
                  aria-label="Select opening non-striker"
                >
                  <option value="">Select Non-Striker</option>
                  {battingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div className="bg-zinc-950 p-6 rounded border border-zinc-800">
              <h3 className="font-semibold mb-4 text-orange-400">Opening Bowler ({bowlingTeam.shortName})</h3>
              <select 
                required 
                value={openingBowlerId} 
                onChange={e => setOpeningBowlerId(e.target.value)} 
                className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200"
                aria-label="Select opening bowler"
              >
                <option value="">Select Bowler</option>
                {bowlingPlayers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
        )}

        <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl text-lg tracking-wide uppercase transition-all shadow-lg hover:shadow-emerald-500/20">
          Start Scoring
        </button>
      </form>
    </div>
  );
}