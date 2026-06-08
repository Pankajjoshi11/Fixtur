'use client';

import { useState } from 'react';
import { useScoringStore } from '@/store/useScoringStore';
import { ShieldAlert } from 'lucide-react';
import { AdminStep, Match, Team } from './types';

import LoginStep from './components/LoginStep';
import CreateTournamentStep from './components/CreateTournamentStep';
import CreateTeamsStep from './components/CreateTeamsStep';
import ScheduleMatchStep from './components/ScheduleMatchStep';
import PreMatchStep from './components/PreMatchStep';
import LiveMatchStep from './components/LiveMatchStep';

export default function AdminScoringDashboard() {
  const store = useScoringStore();

  const [step, setStep] = useState<AdminStep>('LOGIN');

  // --- TOURNAMENT STATE ---
  const [tournament, setTournament] = useState({ name: '', location: '', format: 'T20', overs: 20 });

  // --- TEAMS STATE ---
  const [teams, setTeams] = useState<Team[]>([]);

  // --- MATCH SCHEDULE STATE ---
  const [matches, setMatches] = useState<Match[]>([]);

  // --- PRE MATCH STATE ---
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');

  const startPreMatch = (match: Match) => {
    setActiveMatch(match);
    setTossWinnerId(match.teamA.id);
    setStep('PRE_MATCH');
  };

  const renderPlayerName = (id: string | null) => {
    if (!id || !activeMatch) return 'Unknown';
    const player = [...activeMatch.teamA.players, ...activeMatch.teamB.players].find(p => p.id === id);
    return player ? player.name : id;
  };

  const handleStartMatch = (openingStrikerId: string, openingNonStrikerId: string, openingBowlerId: string) => {
    if (!activeMatch) return;
    
    // Initialize Zustand Store with meta names
    store.initializeMatch(activeMatch.id);
    store.setStateOverride({
      strikerId: openingStrikerId,
      nonStrikerId: openingNonStrikerId,
      bowlerId: openingBowlerId,
      meta: {
        teamA: activeMatch.teamA.shortName,
        teamB: activeMatch.teamB.shortName,
        tournament: tournament.name,
        strikerName: renderPlayerName(openingStrikerId),
        nonStrikerName: renderPlayerName(openingNonStrikerId),
        bowlerName: renderPlayerName(openingBowlerId)
      },
      overs: 0,
      ballsInCurrentOver: 0,
      totalRuns: 0,
      totalWickets: 0,
      deliveryHistory: []
    });

    setStep('LIVE_MATCH');
  };

  const getBattingTeam = () => {
    if (!activeMatch) return null;
    let firstInningBatting = tossDecision === 'BAT' 
      ? (activeMatch.teamA.id === tossWinnerId ? activeMatch.teamA : activeMatch.teamB)
      : (activeMatch.teamA.id === tossWinnerId ? activeMatch.teamB : activeMatch.teamA);
      
    let firstInningBowling = firstInningBatting.id === activeMatch.teamA.id ? activeMatch.teamB : activeMatch.teamA;

    return store.currentInning === 1 ? firstInningBatting : firstInningBowling;
  };

  const getBowlingTeam = () => {
    if (!activeMatch) return null;
    let firstInningBatting = tossDecision === 'BAT' 
      ? (activeMatch.teamA.id === tossWinnerId ? activeMatch.teamA : activeMatch.teamB)
      : (activeMatch.teamA.id === tossWinnerId ? activeMatch.teamB : activeMatch.teamA);
      
    let firstInningBowling = firstInningBatting.id === activeMatch.teamA.id ? activeMatch.teamB : activeMatch.teamA;

    return store.currentInning === 1 ? firstInningBowling : firstInningBatting;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {step !== 'LIVE_MATCH' && (
          <header className="border-b border-zinc-800 pb-4 mb-8">
             <h1 className="text-2xl font-bold text-emerald-500 flex items-center gap-2">
              <ShieldAlert /> Fixtur Admin
            </h1>
          </header>
        )}

        {step === 'LOGIN' && (
          <LoginStep onLoginSuccess={() => setStep('CREATE_TOURNAMENT')} />
        )}

        {step === 'CREATE_TOURNAMENT' && (
          <CreateTournamentStep 
            tournament={tournament} 
            setTournament={setTournament} 
            onNext={() => setStep('CREATE_TEAMS')} 
          />
        )}

        {step === 'CREATE_TEAMS' && (
          <CreateTeamsStep 
            teams={teams} 
            setTeams={setTeams} 
            onNext={() => setStep('SCHEDULE_MATCH')} 
          />
        )}

        {step === 'SCHEDULE_MATCH' && (
          <ScheduleMatchStep 
            teams={teams} 
            matches={matches} 
            setMatches={setMatches} 
            startPreMatch={startPreMatch} 
          />
        )}

        {step === 'PRE_MATCH' && activeMatch && (
          <PreMatchStep 
            activeMatch={activeMatch} 
            tossWinnerId={tossWinnerId} 
            setTossWinnerId={setTossWinnerId} 
            tossDecision={tossDecision} 
            setTossDecision={setTossDecision} 
            onStartMatch={handleStartMatch} 
            battingTeam={getBattingTeam()} 
            bowlingTeam={getBowlingTeam()} 
          />
        )}

        {step === 'LIVE_MATCH' && (
          <LiveMatchStep 
            activeMatch={activeMatch} 
            tournament={tournament} 
            battingTeam={getBattingTeam()} 
            bowlingTeam={getBowlingTeam()} 
            onExit={() => setStep('SCHEDULE_MATCH')} 
          />
        )}

      </div>
    </div>
  );
}