'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft, Save } from 'lucide-react';

function EditTournamentContent() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tournament, setTournament] = useState({
    name: '',
    location: '',
    format: 'T20',
    numberOfOvers: 20,
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/host/tournaments/${tournamentId}`);
      if (res.ok) {
        const data = await res.json();
        setTournament({
          name: data.name || '',
          location: data.location || '',
          format: data.format || 'T20',
          numberOfOvers: data.numberOfOvers || 20,
          startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : '',
          endDate: data.endDate ? new Date(data.endDate).toISOString().split('T')[0] : '',
        });
      } else {
        alert('Failed to fetch tournament');
        router.push('/cricket/host/dashboard');
      }
    } catch (error) {
      console.error('Failed to fetch tournament:', error);
      alert('Failed to fetch tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch(`/api/host/tournaments/${tournamentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tournament.name,
          location: tournament.location,
          format: tournament.format,
          numberOfOvers: tournament.numberOfOvers,
          startDate: tournament.startDate || null,
          endDate: tournament.endDate || null,
        }),
      });

      if (res.ok) {
        router.push(`/cricket/host/tournament/${tournamentId}`);
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update tournament');
      }
    } catch (error) {
      console.error('Failed to update tournament:', error);
      alert('Failed to update tournament');
    } finally {
      setSaving(false);
    }
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
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href={`/cricket/host/tournament/${tournamentId}`} className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <Trophy className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">Edit Tournament</h1>
                <p className="text-xs text-slate-500">Update tournament details</p>
              </div>
            </div>
            <Link
              href={`/cricket/host/tournament/${tournamentId}`}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Cancel
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 md:px-8 py-8">
        <form onSubmit={handleSave} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-6">Tournament Details</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Tournament Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={tournament.name}
                onChange={(e) => setTournament({ ...tournament, name: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-200"
                placeholder="Enter tournament name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Location
              </label>
              <input
                type="text"
                value={tournament.location}
                onChange={(e) => setTournament({ ...tournament, location: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-200"
                placeholder="Enter location"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="format" className="block text-sm font-medium text-slate-400 mb-1">
                  Format
                </label>
                <select
                  id="format"
                  value={tournament.format}
                  onChange={(e) => setTournament({ ...tournament, format: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-200"
                  aria-label="Tournament format"
                >
                  <option value="T20">T20</option>
                  <option value="ODI">ODI</option>
                  <option value="Test">Test</option>
                </select>
              </div>

              <div>
                <label htmlFor="overs" className="block text-sm font-medium text-slate-400 mb-1">
                  Number of Overs
                </label>
                <input
                  id="overs"
                  type="number"
                  value={tournament.numberOfOvers}
                  onChange={(e) => setTournament({ ...tournament, numberOfOvers: parseInt(e.target.value) || 20 })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-200"
                  min="1"
                  max="50"
                  aria-label="Number of overs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-400 mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={tournament.startDate}
                  onChange={(e) => setTournament({ ...tournament, startDate: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-200"
                  aria-label="Start date"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-400 mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={tournament.endDate}
                  onChange={(e) => setTournament({ ...tournament, endDate: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg focus:outline-none focus:border-emerald-500 text-slate-200"
                  aria-label="End date"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={saving || !tournament.name}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/cricket/host/tournament/${tournamentId}`)}
              className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function EditTournamentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    }>
      <EditTournamentContent />
    </Suspense>
  );
}