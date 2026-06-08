import React, { useState, ChangeEvent } from 'react';
import { Plus, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Team, Player } from '../types';

interface CreateTeamsStepProps {
  teams: Team[];
  setTeams: (teams: Team[]) => void;
  onNext: () => void;
}

export default function CreateTeamsStep({ teams, setTeams, onNext }: CreateTeamsStepProps) {
  const [currentTeamName, setCurrentTeamName] = useState('');
  const [currentTeamShort, setCurrentTeamShort] = useState('');
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [currentPlayerRole, setCurrentPlayerRole] = useState('Batsman');
  const [currentPlayerCaptain, setCurrentPlayerCaptain] = useState(false);
  const [currentTeamPlayers, setCurrentTeamPlayers] = useState<Player[]>([]);

  const handleAddPlayer = () => {
    if (!currentPlayerName) return;
    setCurrentTeamPlayers([
      ...currentTeamPlayers,
      { id: crypto.randomUUID(), name: currentPlayerName, role: currentPlayerRole, isCaptain: currentPlayerCaptain }
    ]);
    setCurrentPlayerName('');
    setCurrentPlayerCaptain(false);
  };

  const handleAddTeam = () => {
    if (!currentTeamName || !currentTeamShort || currentTeamPlayers.length === 0) return;
    setTeams([...teams, { id: crypto.randomUUID(), name: currentTeamName, shortName: currentTeamShort, players: currentTeamPlayers }]);
    setCurrentTeamName('');
    setCurrentTeamShort('');
    setCurrentTeamPlayers([]);
  };

  const handleExcelUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const newTeamsMap: Record<string, Team> = {};
      
      data.forEach((row: any) => {
        const tName = row['TeamName'];
        const tShort = row['ShortName'];
        const pName = row['PlayerName'];
        const pRole = row['Role'] || 'Batsman';
        const pCap = row['IsCaptain'] === 'Yes' || row['IsCaptain'] === true;

        if (!tName || !pName) return;

        if (!newTeamsMap[tName]) {
          newTeamsMap[tName] = {
            id: crypto.randomUUID(),
            name: tName,
            shortName: tShort || tName.substring(0,3).toUpperCase(),
            players: []
          };
        }
        
        newTeamsMap[tName].players.push({
          id: crypto.randomUUID(),
          name: pName,
          role: pRole,
          isCaptain: pCap
        });
      });

      setTeams([...teams, ...Object.values(newTeamsMap)]);
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold flex items-center gap-2">Manage Teams</h2>
        <button onClick={onNext} disabled={teams.length < 2} className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50">
          Continue to Scheduling
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Manual Entry */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4 border-b border-zinc-800 pb-2">Add Team Manually</h3>
          <div className="space-y-3 mb-4">
            <input type="text" placeholder="Team Name" value={currentTeamName} onChange={e => setCurrentTeamName(e.target.value)} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-sm" />
            <input type="text" placeholder="Short Name (e.g. MI)" value={currentTeamShort} onChange={e => setCurrentTeamShort(e.target.value)} className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-sm" />
          </div>
          
          <div className="bg-zinc-950/50 p-4 rounded border border-zinc-800/50 mb-4 space-y-3">
            <h4 className="text-sm font-medium text-slate-400">Add Player</h4>
            <div className="flex gap-2">
              <input type="text" placeholder="Player Name" value={currentPlayerName} onChange={e => setCurrentPlayerName(e.target.value)} className="flex-1 p-2 bg-zinc-900 border border-zinc-800 rounded text-sm" />
              <select value={currentPlayerRole} onChange={e => setCurrentPlayerRole(e.target.value)} className="w-28 p-2 bg-zinc-900 border border-zinc-800 rounded text-sm">
                <option>Batsman</option><option>Bowler</option><option>All-rounder</option><option>Wicketkeeper</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={currentPlayerCaptain} onChange={e => setCurrentPlayerCaptain(e.target.checked)} className="rounded bg-zinc-900 border-zinc-700 text-emerald-500" />
              Is Captain?
            </label>
            <button onClick={handleAddPlayer} className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm flex items-center justify-center gap-2">
              <Plus size={16}/> Add Player to List
            </button>
            {currentTeamPlayers.length > 0 && (
                <div className="text-xs text-slate-400 mt-2">
                  {currentTeamPlayers.map(p => p.name + (p.isCaptain ? ' (C)' : '')).join(', ')}
                </div>
            )}
          </div>
          <button onClick={handleAddTeam} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded">Save Team</button>
        </div>

        {/* Excel Upload */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center space-y-4">
          <Upload size={48} className="text-slate-500" />
          <div>
            <h3 className="text-lg font-semibold">Bulk Upload Teams</h3>
            <p className="text-sm text-slate-400 mb-4">Upload an Excel file to enroll multiple teams instantly.</p>
            <p className="text-xs text-slate-500 mb-4">Columns: TeamName, ShortName, PlayerName, Role, IsCaptain</p>
          </div>
          <label className="bg-zinc-800 hover:bg-zinc-700 cursor-pointer text-slate-200 py-2 px-6 rounded-md border border-zinc-700 transition-colors">
            Select Excel File
            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleExcelUpload} />
          </label>
        </div>
      </div>

      {/* List Teams */}
      {teams.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Enrolled Teams ({teams.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teams.map(t => (
              <div key={t.id} className="p-3 bg-zinc-950 border border-zinc-800 rounded text-center">
                <div className="font-bold">{t.name} ({t.shortName})</div>
                <div className="text-xs text-slate-400">{t.players.length} Players</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}