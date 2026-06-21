'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { AdminStep, Match, Team } from '../../types';

import CreateTournamentStep from '../../components/CreateTournamentStep';
import CreateTeamsStep from '../../components/CreateTeamsStep';
import ScheduleMatchStep from '../../components/ScheduleMatchStep';
import PreMatchStep from '../../components/PreMatchStep';
import LiveMatchStep from '../../components/LiveMatchStep';
import { useScoringStore } from '@/store/useScoringStore';

export default function CreateTournamentPage() {
  const router = useRouter();
  const store = useScoringStore();

  const [step, setStep] = useState<AdminStep>('CREATE_TOURNAMENT');

  // --- TOURNAMENT STATE ---
  const [tournament, setTournament] = useState({ 
    id: crypto.randomUUID(), 
    name: '', 
    location: '', 
    format: 'T20', 
    overs: 20 
  });

  // --- TEAMS STATE ---
  const [teams, setTeams] = useState<Team[]>([]);

  // --- MATCH SCHEDULE STATE ---
  const [matches, setMatches] = useState<Match[]>([]);

  // --- PRE MATCH STATE ---
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');

  const saveSetup = async (currentTournament: any, currentTeams: Team[], currentMatches: Match[]) => {
    try {
      await fetch('/api/tournament/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament: currentTournament,
          teams: currentTeams,
          matches: currentMatches
        })
      });
    } catch (e) {
      console.error("Failed to save setup data", e);
    }
  };

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

  const handleStartMatch = async (openingStrikerId: string, openingNonStrikerId: string, openingBowlerId: string) => {
    if (!activeMatch) return;
    
    try {
      await fetch('/api/scoring/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament,
          teams,
          activeMatch,
          tossWinnerId,
          tossDecision
        })
      });
    } catch (e) {
      console.error("Failed to initialize match in DB", e);
    }

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

  const handleExitToDashboard = () => {
    router.push('/cricket/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/cricket/admin/dashboard" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <ShieldAlert className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">Create Tournament</h1>
                <p className="text-xs text-slate-500">
                  {step === 'CREATE_TOURNAMENT' && 'Step 1: Tournament Details'}
                  {step === 'CREATE_TEAMS' && 'Step 2: Add Teams & Players'}
                  {step === 'SCHEDULE_MATCH' && 'Step 3: Schedule Matches'}
                  {step === 'PRE_MATCH' && 'Step 4: Pre-Match Setup'}
                  {step === 'LIVE_MATCH' && 'Live Match'}
                </p>
              </div>
            </div>
            <Link
              href="/cricket/admin/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center gap-2 mb-6">
          {['CREATE_TOURNAMENT', 'CREATE_TEAMS', 'SCHEDULE_MATCH', 'PRE_MATCH'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-emerald-500 text-white'
                    : index < ['CREATE_TOURNAMENT', 'CREATE_TEAMS', 'SCHEDULE_MATCH', 'PRE_MATCH', 'LIVE_MATCH'].indexOf(step)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-slate-500'
                }`}
              >
                {index + 1}
              </div>
              {index < 3 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    index < ['CREATE_TOURNAMENT', 'CREATE_TEAMS', 'SCHEDULE_MATCH', 'PRE_MATCH', 'LIVE_MATCH'].indexOf(step)
                      ? 'bg-emerald-500'
                      : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 pb-8">
        {step === 'CREATE_TOURNAMENT' && (
          <CreateTournamentStep 
            tournament={tournament} 
            setTournament={setTournament} 
            onNext={() => {
              saveSetup(tournament, teams, matches);
              setStep('CREATE_TEAMS');
            }} 
          />
        )}

        {step === 'CREATE_TEAMS' && (
          <CreateTeamsStep 
            teams={teams} 
            setTeams={setTeams} 
            onNext={() => {
              saveSetup(tournament, teams, matches);
              setStep('SCHEDULE_MATCH');
            }} 
          />
        )}

        {step === 'SCHEDULE_MATCH' && (
          <ScheduleMatchStep 
            teams={teams} 
            matches={matches} 
            setMatches={(newMatches) => {
              setMatches(newMatches);
              saveSetup(tournament, teams, newMatches);
            }} 
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
            onExit={handleExitToDashboard} 
          />
        )}
      </main>
    </div>
  );
}