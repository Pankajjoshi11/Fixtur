'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';

type Step = 'CREATE_TOURNAMENT' | 'CREATE_TEAMS' | 'SCHEDULE_MATCH';

export default function HostCreateTournamentPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('CREATE_TOURNAMENT');

  const [tournament, setTournament] = useState({
    id: crypto.randomUUID(),
    name: '',
    location: '',
    format: 'T20',
    overs: 20,
  });

  const [teams, setTeams] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const handleCreateTournament = async () => {
    try {
      const res = await fetch('/api/host/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tournament.name,
          location: tournament.location,
          format: tournament.format,
          numberOfOvers: tournament.overs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setTournament({ ...tournament, id: data.id });
        setStep('CREATE_TEAMS');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to create tournament');
      }
    } catch (error) {
      alert('Failed to create tournament');
    }
  };

  const handleSaveTeams = async () => {
    try {
      for (const team of teams) {
        await fetch(`/api/host/tournaments/${tournament.id}/teams`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: team.name,
            shortName: team.shortName,
            players: team.players,
          }),
        });
      }
      setStep('SCHEDULE_MATCH');
    } catch (error) {
      alert('Failed to save teams');
    }
  };

  const handleAddTeam = () => {
    setTeams([
      ...teams,
      { id: crypto.randomUUID(), name: '', shortName: '', players: [] },
    ]);
  };

  const handleUpdateTeam = (index: number, field: string, value: string) => {
    const updated = [...teams];
    updated[index] = { ...updated[index], [field]: value };
    setTeams(updated);
  };

  const handleRemoveTeam = (index: number) => {
    setTeams(teams.filter((_, i) => i !== index));
  };

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
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Tournament Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Tournament Name *</label>
                <input
                  type="text"
                  value={tournament.name}
                  onChange={(e) => setTournament({ ...tournament, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter tournament name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={tournament.location}
                  onChange={(e) => setTournament({ ...tournament, location: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                  placeholder="Enter location"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Format</label>
                  <select
                    value={tournament.format}
                    onChange={(e) => setTournament({ ...tournament, format: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                  >
                    <option value="T20">T20</option>
                    <option value="ODI">ODI</option>
                    <option value="Test">Test</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Number of Overs</label>
                  <input
                    type="number"
                    value={tournament.overs}
                    onChange={(e) => setTournament({ ...tournament, overs: parseInt(e.target.value) || 20 })}
                    className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateTournament}
                disabled={!tournament.name}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
              >
                Create Tournament
              </button>
            </div>
          </div>
        )}

        {step === 'CREATE_TEAMS' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Teams ({teams.length})</h2>
              <button
                onClick={handleAddTeam}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm font-medium transition-colors"
              >
                Add Team
              </button>
            </div>

            {teams.length === 0 ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center">
                <Trophy size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No teams added yet. Click "Add Team" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {teams.map((team, index) => (
                  <div key={team.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-slate-400">Team {index + 1}</span>
                      <button
                        onClick={() => handleRemoveTeam(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Team Name</label>
                        <input
                          type="text"
                          value={team.name}
                          onChange={(e) => handleUpdateTeam(index, 'name', e.target.value)}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                          placeholder="Team name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Short Name</label>
                        <input
                          type="text"
                          value={team.shortName}
                          onChange={(e) => handleUpdateTeam(index, 'shortName', e.target.value)}
                          className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500"
                          placeholder="e.g., CSK"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleSaveTeams}
              disabled={teams.length < 2}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              Save Teams & Continue
            </button>
          </div>
        )}

        {step === 'SCHEDULE_MATCH' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Schedule Matches</h2>
            <p className="text-slate-400 mb-4">
              You have {teams.length} teams. Create matches by pairing them up.
            </p>
            <div className="text-center py-8">
              <p className="text-slate-500">
                Match scheduling coming soon. For now, you can view your tournament in the dashboard.
              </p>
              <button
                onClick={() => router.push('/cricket/host/dashboard')}
                className="mt-4 px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}