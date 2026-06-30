'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';
import { AdminStep, Match, Team } from '../../../admin/types';

import CreateTournamentStep from '../../../admin/components/CreateTournamentStep';
import CreateTeamsStep from '../../../admin/components/CreateTeamsStep';
import ScheduleMatchStep from '../../../admin/components/ScheduleMatchStep';
import { useScoringStore } from '@/store/useScoringStore';

export default function HostCreateTournamentPage() {
  const router = useRouter();
  const store = useScoringStore();

  const [step, setStep] = useState<AdminStep>('CREATE_TOURNAMENT');
  const [isLoading, setIsLoading] = useState(true);

  // --- TOURNAMENT STATE ---
  const [tournament, setTournament] = useState({ 
    id: '', 
    name: '', 
    location: '', 
    format: 'T20', 
    overs: 20 
  });

  // --- TEAMS STATE ---
  const [teams, setTeams] = useState<Team[]>([]);

  // --- MATCH SCHEDULE STATE ---
  const [matches, setMatches] = useState<Match[]>([]);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        router.push('/cricket/live/login');
        return;
      }
      const data = await res.json();
      if (data.role !== 'HOST' && data.role !== 'SUPER_ADMIN') {
        router.push('/cricket/live');
        return;
      }
      setIsLoading(false);
    } catch (error) {
      router.push('/cricket/live/login');
    }
  };

  // Save tournament to host API
  const saveTournament = async (tournamentData: any) => {
    try {
      const res = await fetch('/api/host/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tournamentData.name,
          location: tournamentData.location,
          format: tournamentData.format,
          numberOfOvers: tournamentData.overs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTournament({ ...tournamentData, id: data.id });
        return data.id;
      } else {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create tournament');
      }
    } catch (error) {
      console.error('Failed to save tournament:', error);
      throw error;
    }
  };

  // Save teams to host API
  const saveTeams = async (tournamentId: string, teamsData: Team[]) => {
    try {
      for (const team of teamsData) {
        await fetch(`/api/host/tournaments/${tournamentId}/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: team.name,
            shortName: team.shortName,
            players: team.players,
          }),
        });
      }
    } catch (error) {
      console.error('Failed to save teams:', error);
      throw error;
    }
  };

  // Handle tournament creation and move to next step
  const handleTournamentNext = async () => {
    try {
      await saveTournament(tournament);
      setStep('CREATE_TEAMS');
    } catch (error) {
      alert('Failed to create tournament. Please try again.');
    }
  };

  // Handle teams save and move to next step
  const handleTeamsNext = async () => {
    if (teams.length < 2) {
      alert('Please add at least 2 teams');
      return;
    }
    try {
      await saveTeams(tournament.id, teams);
      setStep('SCHEDULE_MATCH');
    } catch (error) {
      alert('Failed to save teams. Please try again.');
    }
  };

  // Handle match scheduling completion - navigate to tournament setup
  const handleScheduleComplete = () => {
    router.push(`/cricket/host/tournament/${tournament.id}/setup`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
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
                <h1 className="text-xl font-bold text-emerald-500">Create Tournament</h1>
                <p className="text-xs text-slate-500">
                  {step === 'CREATE_TOURNAMENT' && 'Step 1: Tournament Details'}
                  {step === 'CREATE_TEAMS' && 'Step 2: Add Teams & Players'}
                  {step === 'SCHEDULE_MATCH' && 'Step 3: Schedule Matches'}
                </p>
              </div>
            </div>
            <Link
              href="/cricket/host/dashboard"
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
          {['CREATE_TOURNAMENT', 'CREATE_TEAMS', 'SCHEDULE_MATCH'].map((s, index) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s
                    ? 'bg-emerald-500 text-white'
                    : index < ['CREATE_TOURNAMENT', 'CREATE_TEAMS', 'SCHEDULE_MATCH'].indexOf(step)
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-zinc-800 text-slate-500'
                }`}
              >
                {index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`w-12 h-1 mx-2 ${
                    index < ['CREATE_TOURNAMENT', 'CREATE_TEAMS', 'SCHEDULE_MATCH'].indexOf(step)
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
            onNext={handleTournamentNext} 
          />
        )}

        {step === 'CREATE_TEAMS' && (
          <CreateTeamsStep 
            teams={teams} 
            setTeams={setTeams} 
            onNext={handleTeamsNext} 
          />
        )}

        {step === 'SCHEDULE_MATCH' && (
          <ScheduleMatchStep 
            teams={teams} 
            matches={matches} 
            setMatches={setMatches}
            startPreMatch={handleScheduleComplete}
          />
        )}
      </main>
    </div>
  );
}