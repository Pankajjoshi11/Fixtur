'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { AdminStep, Match, Team } from '../../../types';

import CreateTeamsStep from '../../../components/CreateTeamsStep';
import ScheduleMatchStep from '../../../components/ScheduleMatchStep';
import PreMatchStep from '../../../components/PreMatchStep';
import LiveMatchStep from '../../../components/LiveMatchStep';
import { useScoringStore } from '@/store/useScoringStore';

function TournamentSetupContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const store = useScoringStore();
  const tournamentId = params.id as string;

  const [step, setStep] = useState<AdminStep>('CREATE_TEAMS');
  const [tournament, setTournament] = useState<any>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  useEffect(() => {
    const stepParam = searchParams.get('step') as AdminStep | null;
    if (stepParam) {
      setStep(stepParam);
    }
  }, [searchParams]);

  const fetchTournamentData = async () => {
    try {
      const tournamentRes = await fetch(`/api/tournaments/${tournamentId}`);
      if (tournamentRes.ok) {
        const tournamentData = await tournamentRes.json();
        setTournament(tournamentData);
      }

      const teamsRes = await fetch(`/api/tournaments/${tournamentId}/teams`);
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      const matchesRes = await fetch(`/api/tournaments/${tournamentId}/matches`);
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

  const saveSetup = async (currentStep: AdminStep) => {
    try {
      await fetch(`/api/tournaments/${tournamentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupStep: currentStep }),
      });
    } catch (e) {
      console.error("Failed to save setup data", e);
    }
  };

  const startPreMatch = (match: Match) => {
    setActiveMatch(match);
    setTossWinnerId(match.teamA?.id || '');
    setStep('PRE_MATCH');
  };

  const renderPlayerName = (id: string | null) => {
    if (!id || !activeMatch) return 'Unknown';
    const allPlayers = [
      ...(activeMatch.teamA?.players || []),
      ...(activeMatch.teamB?.players || [])
    ];
    const player = allPlayers.find(p => p.id === id);
    return player ? player.name : id;
  };

  const handleStartMatch = async (openingStrikerId: string, openingNonStrikerId: string, openingBowlerId: string) => {
    if (!activeMatch) return;
    
    try {
      await fetch('/api/scoring/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament, teams, activeMatch, tossWinnerId, tossDecision })
      });
    } catch (e) {
      console.error("Failed to initialize match in DB", e);
    }

    store.initializeMatch(activeMatch.id);
    store.setStateOverride({
      strikerId: openingStrikerId,
      nonStrikerId: openingNonStrikerId,
      bowlerId: openingBowlerId,
      meta: {
        teamA: activeMatch.teamA?.shortName || 'Team A',
        teamB: activeMatch.teamB?.shortName || 'Team B',
        tournament: tournament?.name || 'Tournament',
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
    const firstInningBatting = tossDecision === 'BAT' 
      ? (activeMatch.teamA?.id === tossWinnerId ? activeMatch.teamA : activeMatch.teamB)
      : (activeMatch.teamA?.id === tossWinnerId ? activeMatch.teamB : activeMatch.teamA);
    const firstInningBowling = firstInningBatting?.id === activeMatch.teamA?.id ? activeMatch.teamB : activeMatch.teamA;
    return store.currentInning === 1 ? firstInningBatting : firstInningBowling;
  };

  const getBowlingTeam = () => {
    if (!activeMatch) return null;
    const firstInningBatting = tossDecision === 'BAT' 
      ? (activeMatch.teamA?.id === tossWinnerId ? activeMatch.teamA : activeMatch.teamB)
      : (activeMatch.teamA?.id === tossWinnerId ? activeMatch.teamB : activeMatch.teamA);
    const firstInningBowling = firstInningBatting?.id === activeMatch.teamA?.id ? activeMatch.teamB : activeMatch.teamA;
    return store.currentInning === 1 ? firstInningBowling : firstInningBatting;
  };

  const handleExitToDashboard = () => {
    router.push('/cricket/admin/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50">
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/cricket/admin/tournament/${tournamentId}`} className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <ShieldAlert className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">
                  {tournament?.name || 'Tournament'} - Setup
                </h1>
                <p className="text-xs text-slate-500">
                  {step === 'CREATE_TEAMS' && 'Step 1: Add Teams & Players'}
                  {step === 'SCHEDULE_MATCH' && 'Step 2: Schedule Matches'}
                  {step === 'PRE_MATCH' && 'Step 3: Pre-Match Setup'}
                  {step === 'LIVE_MATCH' && 'Live Match'}
                </p>
              </div>
            </div>
            <Link
              href={`/cricket/admin/tournament/${tournamentId}`}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Tournament
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center gap-2 mb-6">
          {['CREATE_TEAMS', 'SCHEDULE_MATCH', 'PRE_MATCH'].map((s, index) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setStep(s as AdminStep)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step === s
                    ? 'bg-emerald-500 text-white'
                    : index < ['CREATE_TEAMS', 'SCHEDULE_MATCH', 'PRE_MATCH', 'LIVE_MATCH'].indexOf(step)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-slate-500'
                }`}
              >
                {index + 1}
              </button>
              {index < 2 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    index < ['CREATE_TEAMS', 'SCHEDULE_MATCH', 'PRE_MATCH', 'LIVE_MATCH'].indexOf(step)
                      ? 'bg-emerald-500'
                      : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 md:px-8 pb-8">
        {step === 'CREATE_TEAMS' && (
          <CreateTeamsStep 
            teams={teams} 
            setTeams={setTeams} 
            onNext={() => {
              saveSetup('SCHEDULE_MATCH');
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
              saveSetup('PRE_MATCH');
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

export default function TournamentSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    }>
      <TournamentSetupContent />
    </Suspense>
  );
}