import React from 'react';
import { Activity } from 'lucide-react';

interface CreateTournamentStepProps {
  tournament: { name: string; location: string; format: string; overs: number };
  setTournament: (t: any) => void;
  onNext: () => void;
}

export default function CreateTournamentStep({ tournament, setTournament, onNext }: CreateTournamentStepProps) {
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-lg animate-fade-in-up">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Activity /> Create Tournament</h2>
      <form onSubmit={handleCreateTournament} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Tournament Name</label>
            <input type="text" required value={tournament.name} onChange={e => setTournament({...tournament, name: e.target.value})} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Location</label>
            <input type="text" required value={tournament.location} onChange={e => setTournament({...tournament, location: e.target.value})} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Format</label>
            <select value={tournament.format} onChange={e => setTournament({...tournament, format: e.target.value})} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:border-emerald-500">
              <option value="T20">T20</option>
              <option value="ODI">ODI</option>
              <option value="TEST">Test</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Number of Overs</label>
            <input type="number" required value={tournament.overs} onChange={e => setTournament({...tournament, overs: parseInt(e.target.value)})} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:border-emerald-500" />
          </div>
        </div>
        <div className="pt-4 flex justify-end">
          <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded">Next: Create Teams</button>
        </div>
      </form>
    </div>
  );
}