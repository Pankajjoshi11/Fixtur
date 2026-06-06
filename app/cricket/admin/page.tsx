'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useScoringStore } from '@/store/useScoringStore';
import { Mic, MicOff, RotateCcw, Activity, ShieldAlert, Zap, Upload, Plus } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

type AdminStep = 'LOGIN' | 'CREATE_TOURNAMENT' | 'CREATE_TEAMS' | 'SCHEDULE_MATCH' | 'PRE_MATCH' | 'LIVE_MATCH';

type Player = { id: string; name: string; role: string; isCaptain: boolean };
type Team = { id: string; name: string; shortName: string; players: Player[] };
type Match = { id: string; teamA: Team; teamB: Team; date: string; status: string };

export default function AdminScoringDashboard() {
  const store = useScoringStore();

  const [step, setStep] = useState<AdminStep>('LOGIN');

  // --- LOGIN STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // --- TOURNAMENT STATE ---
  const [tournament, setTournament] = useState({ name: '', location: '', format: 'T20', overs: 20 });

  // --- TEAMS STATE ---
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamName, setCurrentTeamName] = useState('');
  const [currentTeamShort, setCurrentTeamShort] = useState('');
  const [currentPlayerName, setCurrentPlayerName] = useState('');
  const [currentPlayerRole, setCurrentPlayerRole] = useState('Batsman');
  const [currentPlayerCaptain, setCurrentPlayerCaptain] = useState(false);
  const [currentTeamPlayers, setCurrentTeamPlayers] = useState<Player[]>([]);

  // --- MATCH SCHEDULE STATE ---
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedTeamA, setSelectedTeamA] = useState('');
  const [selectedTeamB, setSelectedTeamB] = useState('');

  // --- PRE MATCH STATE ---
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [tossWinnerId, setTossWinnerId] = useState('');
  const [tossDecision, setTossDecision] = useState<'BAT' | 'BOWL'>('BAT');
  const [openingStrikerId, setOpeningStrikerId] = useState('');
  const [openingNonStrikerId, setOpeningNonStrikerId] = useState('');
  const [openingBowlerId, setOpeningBowlerId] = useState('');

  // --- LIVE MATCH STATE ---
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  // Over Management
  const [showOverModal, setShowOverModal] = useState(false);
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [nextBowlerId, setNextBowlerId] = useState('');
  const [nextStrikerId, setNextStrikerId] = useState('');
  const [nextNonStrikerId, setNextNonStrikerId] = useState('');

  // Wicket Management
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [newBatsmanId, setNewBatsmanId] = useState('');

  // --- HANDLERS ---


  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@gmail.com' && password === 'admin') {
      setStep('CREATE_TOURNAMENT');
      setLoginError('');
    } else {
      setLoginError('Invalid credentials');
    }
  };

  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('CREATE_TEAMS');
  };

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
      
      // Expected Excel format: TeamName, ShortName, PlayerName, Role, IsCaptain
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

  const handleScheduleMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamA || !selectedTeamB || selectedTeamA === selectedTeamB) return;
    const teamA = teams.find(t => t.id === selectedTeamA);
    const teamB = teams.find(t => t.id === selectedTeamB);
    if (teamA && teamB) {
      setMatches([...matches, { id: crypto.randomUUID(), teamA, teamB, date: new Date().toISOString(), status: 'SCHEDULED' }]);
    }
  };

  const startPreMatch = (match: Match) => {
    setActiveMatch(match);
    setTossWinnerId(match.teamA.id);
    setStep('PRE_MATCH');
  };

  const handleStartMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMatch || !openingStrikerId || !openingNonStrikerId || !openingBowlerId) return;
    
    // Initialize Zustand Store
    store.initializeMatch(activeMatch.id);
    store.setStateOverride({
      strikerId: openingStrikerId,
      nonStrikerId: openingNonStrikerId,
      bowlerId: openingBowlerId,
      overs: 0,
      ballsInCurrentOver: 0,
      totalRuns: 0,
      totalWickets: 0,
      deliveryHistory: []
    });

    setNextStrikerId(openingStrikerId);
    setNextNonStrikerId(openingNonStrikerId);
    
    setStep('LIVE_MATCH');
  };

  // --- LIVE MATCH SYNC & VOICE ---
  useEffect(() => {
    if (step !== 'LIVE_MATCH' || !store.matchId) return;
    const syncState = async () => {
      try {
        await fetch('/api/scoring/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            matchId: store.matchId, 
            state: store,
            meta: {
              teamA: activeMatch?.teamA.shortName,
              teamB: activeMatch?.teamB.shortName,
              tournament: tournament.name,
              strikerName: renderPlayerName(store.strikerId),
              nonStrikerName: renderPlayerName(store.nonStrikerId),
              bowlerName: renderPlayerName(store.bowlerId)
            }
          })
        });
      } catch (err) {}
    };
    syncState();
  }, [store.totalRuns, store.totalWickets, store.overs, store.ballsInCurrentOver, store.deliveryHistory.length, step, store, activeMatch, tournament]);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        const lowerTranscript = currentTranscript.toLowerCase();
        if (lowerTranscript.includes('one run')) handleRun(1);
        if (lowerTranscript.includes('four runs')) handleRun(4);
        if (lowerTranscript.includes('six runs')) handleRun(6);
        if (lowerTranscript.includes('out') || lowerTranscript.includes('wicket')) handleWicket();
      };
    }
  }, []);

  const toggleVoiceScoring = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setTranscript('');
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  // Intercept over completion and innings completion
  useEffect(() => {
    if (step === 'LIVE_MATCH') {
      const isOverComplete = store.ballsInCurrentOver === 0 && store.overs > 0 && store.deliveryHistory.length > 0;
      const isAllOut = store.totalWickets >= 10;
      const isOversFinished = store.overs >= tournament.overs;
      
      const lastDelivery = store.deliveryHistory[store.deliveryHistory.length - 1];

      if (store.currentInning === 1 && (isOversFinished || isAllOut)) {
         if (!showInningsModal) {
            setShowInningsModal(true);
            setShowOverModal(false);
         }
      } else if (store.currentInning === 2 && (isOversFinished || isAllOut || (store.targetScore && store.totalRuns >= store.targetScore))) {
         // Match complete logic could go here
         if (isOverComplete && lastDelivery && lastDelivery.isLegalDelivery && !isOversFinished && !isAllOut) {
            setShowOverModal(true);
         }
      } else if (isOverComplete && lastDelivery && lastDelivery.isLegalDelivery && !isOversFinished && !isAllOut) {
         setShowOverModal(true);
      }
    }
  }, [store.overs, store.ballsInCurrentOver, step, store.deliveryHistory, store.totalWickets, store.totalRuns, tournament.overs, store.currentInning, showInningsModal, store.targetScore]);

  const handleNextOverSetup = () => {
    store.setStateOverride({
      bowlerId: nextBowlerId,
      strikerId: nextStrikerId,
      nonStrikerId: nextNonStrikerId
    });
    setShowOverModal(false);
  };

  const handleStartSecondInnings = () => {
    store.switchInnings();
    store.setStateOverride({
      strikerId: nextStrikerId,
      nonStrikerId: nextNonStrikerId,
      bowlerId: nextBowlerId
    });
    setShowInningsModal(false);
  };

  const handleRun = (runs: number) => {
    if (showOverModal || showInningsModal) return;
    store.recordDelivery({
      runs,
      extras: 0,
      isWicket: false,
      strikerId: store.strikerId || 'unknown',
      nonStrikerId: store.nonStrikerId || 'unknown',
      bowlerId: store.bowlerId || 'unknown',
      isLegalDelivery: true,
    });
  };

  const handleExtra = (type: 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE') => {
    if (showOverModal || showInningsModal) return;
    store.recordDelivery({
      runs: 0,
      extras: 1,
      extraType: type,
      isWicket: false,
      strikerId: store.strikerId || 'unknown',
      nonStrikerId: store.nonStrikerId || 'unknown',
      bowlerId: store.bowlerId || 'unknown',
      isLegalDelivery: type === 'BYE' || type === 'LEG_BYE',
    });
  };

  const handleWicket = () => {
    if (showOverModal || showInningsModal) return;
    store.recordDelivery({
      runs: 0,
      extras: 0,
      isWicket: true,
      wicketType: 'CAUGHT',
      strikerId: store.strikerId || 'unknown',
      nonStrikerId: store.nonStrikerId || 'unknown',
      bowlerId: store.bowlerId || 'unknown',
      isLegalDelivery: true,
    });
    setShowWicketModal(true);
  };

  const handleNextBatsmanSetup = () => {
    if (!newBatsmanId) return;
    store.setStateOverride({
      strikerId: newBatsmanId // replace striker with new batsman by default for simplicity
    });
    setNewBatsmanId('');
    setShowWicketModal(false);
  };

  // Helper to get players of currently batting/bowling teams based on toss and current inning
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

  const battingTeam = getBattingTeam();
  const bowlingTeam = getBowlingTeam();

  const renderPlayerName = (id: string | null) => {
    if (!id || !activeMatch) return 'Unknown';
    const player = [...activeMatch.teamA.players, ...activeMatch.teamB.players].find(p => p.id === id);
    return player ? player.name : id;
  };

  const getBatsmanStats = (id: string | null) => {
    if (!id) return { runs: 0, balls: 0 };
    const runs = store.deliveryHistory
      .filter(d => d.strikerId === id && !d.isWicket && !d.extraType?.includes('WIDE'))
      .reduce((sum, d) => sum + d.runs, 0);
    const balls = store.deliveryHistory
      .filter(d => d.strikerId === id && !d.extraType?.includes('WIDE'))
      .length;
    return { runs, balls };
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

        {/* --- LOGIN --- */}
        {step === 'LOGIN' && (
          <div className="max-w-md mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-xl font-bold mb-6">Admin Login</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-2 bg-zinc-950 border border-zinc-800 rounded text-slate-200 focus:outline-none focus:border-emerald-500" />
              </div>
              {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded transition-colors">
                Login
              </button>
            </form>
          </div>
        )}

        {/* --- CREATE TOURNAMENT --- */}
        {step === 'CREATE_TOURNAMENT' && (
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
        )}

        {/* --- CREATE TEAMS --- */}
        {step === 'CREATE_TEAMS' && (
          <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">Manage Teams</h2>
              <button onClick={() => setStep('SCHEDULE_MATCH')} disabled={teams.length < 2} className="bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50">
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
        )}

        {/* --- SCHEDULE MATCH --- */}
        {step === 'SCHEDULE_MATCH' && (
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
        )}

        {/* --- PRE MATCH TOSS & SELECTION --- */}
        {step === 'PRE_MATCH' && activeMatch && (
          <div className="max-w-3xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-lg animate-fade-in-up">
            <h2 className="text-2xl font-bold mb-2 text-center">{activeMatch.teamA.name} vs {activeMatch.teamB.name}</h2>
            <p className="text-center text-slate-400 mb-8">Pre-match Setup</p>

            <form onSubmit={handleStartMatch} className="space-y-8">
              
              <div className="bg-zinc-950 p-6 rounded border border-zinc-800">
                <h3 className="font-semibold mb-4 text-emerald-400">Toss Decision</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Toss Winner</label>
                    <select value={tossWinnerId} onChange={e => setTossWinnerId(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-slate-200">
                      <option value={activeMatch.teamA.id}>{activeMatch.teamA.name}</option>
                      <option value={activeMatch.teamB.id}>{activeMatch.teamB.name}</option>
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
                      <select required value={openingStrikerId} onChange={e => setOpeningStrikerId(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200">
                        <option value="">Select Striker</option>
                        {battingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <select required value={openingNonStrikerId} onChange={e => setOpeningNonStrikerId(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200">
                        <option value="">Select Non-Striker</option>
                        {battingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="bg-zinc-950 p-6 rounded border border-zinc-800">
                    <h3 className="font-semibold mb-4 text-orange-400">Opening Bowler ({bowlingTeam.shortName})</h3>
                    <select required value={openingBowlerId} onChange={e => setOpeningBowlerId(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200">
                      <option value="">Select Bowler</option>
                      {bowlingTeam.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl text-lg tracking-wide uppercase transition-all shadow-lg hover:shadow-emerald-500/20">
                Start Scoring
              </button>
            </form>
          </div>
        )}

        {/* --- LIVE MATCH UI --- */}
        {step === 'LIVE_MATCH' && (
          <>
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                  <Activity className="text-emerald-500" /> Live Scoring
                </h1>
                <p className="text-sm text-slate-400">
                  {activeMatch?.teamA.shortName} vs {activeMatch?.teamB.shortName}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('SCHEDULE_MATCH')} className="px-4 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm hover:bg-zinc-800 transition-colors">
                  Exit Match
                </button>
                <button 
                  onClick={store.undoLastDelivery}
                  disabled={store.deliveryHistory.length === 0}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw size={16} /> Undo
                </button>
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Live Score Board */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 text-center shadow-lg relative">
                  <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Score</h2>
                  <div className="text-6xl font-extrabold tracking-tighter text-emerald-400 mb-2">
                    {store.totalRuns} <span className="text-4xl text-slate-300 font-bold">/ {store.totalWickets}</span>
                  </div>
                  <div className="text-xl text-slate-300 font-medium mb-2">
                    Overs: {store.overs}.{store.ballsInCurrentOver}
                  </div>
                  {store.targetScore && (
                    <div className="text-sm font-bold text-blue-400 uppercase tracking-wide bg-blue-900/20 py-2 rounded-md border border-blue-500/20 mt-2">
                      Target: {store.targetScore}
                    </div>
                  )}
                </div>

                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 space-y-4">
                  <h3 className="font-medium text-slate-200 border-b border-zinc-800 pb-2">Active Players</h3>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-emerald-400 font-semibold flex items-center gap-2">
                      <Zap size={14} /> Striker
                    </span>
                    <div className="text-right">
                      <div className="text-slate-300 font-bold">{renderPlayerName(store.strikerId)}</div>
                      <div className="text-xs text-slate-400">{getBatsmanStats(store.strikerId).runs} ({getBatsmanStats(store.strikerId).balls})</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Non-Striker</span>
                    <div className="text-right">
                      <div className="text-slate-300 font-bold">{renderPlayerName(store.nonStrikerId)}</div>
                      <div className="text-xs text-slate-400">{getBatsmanStats(store.nonStrikerId).runs} ({getBatsmanStats(store.nonStrikerId).balls})</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-2 border-t border-zinc-800/50">
                    <span className="text-orange-400 font-semibold">Bowler</span>
                    <span className="text-slate-300 font-bold">{renderPlayerName(store.bowlerId)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Scoring Controls */}
              <div className="lg:col-span-2 space-y-6 relative">
                
                {/* Wicket Modal Overlay */}
                {showWicketModal && (
                  <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-8 flex flex-col justify-center animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-red-500 mb-4 text-center">Wicket Fallen!</h2>
                    <div className="space-y-4 max-w-sm mx-auto w-full">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Select New Batsman</label>
                        <select value={newBatsmanId} onChange={e => setNewBatsmanId(e.target.value)} className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-slate-200">
                           <option value="">Select Batsman</option>
                           {battingTeam?.players
                             .filter(p => p.id !== store.nonStrikerId && p.id !== store.strikerId) // Don't show current non-striker or the out striker (he's just removed from state conceptually next)
                             .map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <button 
                        onClick={handleNextBatsmanSetup}
                        disabled={!newBatsmanId}
                        className="w-full mt-4 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded disabled:opacity-50 transition-colors"
                      >
                        Confirm Next Batsman
                      </button>
                    </div>
                  </div>
                )}

                {/* Over Completion Modal Overlay */}
                {showOverModal && !showWicketModal && (
                  <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-8 flex flex-col justify-center animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-emerald-400 mb-4 text-center">Over Completed</h2>
                    <div className="space-y-4 max-w-sm mx-auto w-full">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1">Select Next Bowler</label>
                        <select value={nextBowlerId} onChange={e => setNextBowlerId(e.target.value)} className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-slate-200">
                           <option value="">Select Bowler</option>
                           {bowlingTeam?.players.filter(p => p.id !== store.bowlerId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Striker</label>
                          <select value={nextStrikerId} onChange={e => setNextStrikerId(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200">
                             <option value="">Select</option>
                             {battingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm text-slate-400 mb-1">Non-Striker</label>
                          <select value={nextNonStrikerId} onChange={e => setNextNonStrikerId(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200">
                             <option value="">Select</option>
                             {battingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <button 
                        onClick={handleNextOverSetup}
                        disabled={!nextBowlerId || !nextStrikerId || !nextNonStrikerId}
                        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded disabled:opacity-50"
                      >
                        Start Next Over
                      </button>
                    </div>
                  </div>
                )}

                {/* Runs Pad */}
                <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 ${showOverModal ? 'opacity-30 pointer-events-none' : ''}`}>
                  <h3 className="text-lg font-semibold text-slate-200 mb-4">Runs</h3>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[0, 1, 2, 3, 4, 6].map((run) => (
                      <button
                        key={`run-${run}`}
                        onClick={() => handleRun(run)}
                        className={`h-14 rounded-lg font-bold text-xl transition-all ${
                          run === 4 || run === 6 
                            ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30' 
                            : 'bg-zinc-800 text-slate-200 hover:bg-zinc-700'
                        }`}
                      >
                        {run}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Extras & Wickets */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${showOverModal ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-slate-200 mb-4">Extras</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => handleExtra('WIDE')} className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium">Wide (Wd)</button>
                      <button onClick={() => handleExtra('NO_BALL')} className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium">No Ball (Nb)</button>
                      <button onClick={() => handleExtra('BYE')} className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium">Bye (B)</button>
                      <button onClick={() => handleExtra('LEG_BYE')} className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium">Leg Bye (Lb)</button>
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
                    <button 
                      onClick={handleWicket}
                      className="w-full py-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                      <ShieldAlert size={28} />
                      <span className="font-bold text-xl tracking-wide uppercase">Wicket</span>
                    </button>
                  </div>
                </div>

                {/* Voice Scoring Engine */}
                <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden ${showOverModal ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        Voice Scoring Engine
                        {isListening && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm">Say "One run", "Four runs", or "Out" to log events directly.</p>
                      {transcript && (
                        <div className="mt-3 p-2 bg-zinc-950 rounded border border-zinc-800 text-xs text-blue-400 italic">
                          Heard: "{transcript}"
                        </div>
                      )}
                    </div>
                    <button
                      onClick={toggleVoiceScoring}
                      className={`h-16 w-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isListening 
                          ? 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-500 animate-pulse' 
                          : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
                      }`}
                    >
                      {isListening ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} => handleExtra('LEG_BYE')} className="p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium">Leg Bye (Lb)</button>
                    </div>
                  </div>

                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col justify-center">
                    <button 
                      onClick={handleWicket}
                      className="w-full py-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 flex flex-col items-center justify-center gap-2 transition-colors"
                    >
                      <ShieldAlert size={28} />
                      <span className="font-bold text-xl tracking-wide uppercase">Wicket</span>
                    </button>
                  </div>
                </div>

                {/* Voice Scoring Engine */}
                <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden ${showOverModal || showInningsModal ? 'opacity-30 pointer-events-none' : ''}`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none" />
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                        Voice Scoring Engine
                        {isListening && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span></span>}
                      </h3>
                      <p className="text-sm text-slate-400 mt-1 max-w-sm">Say "One run", "Four runs", or "Out" to log events directly.</p>
                      {transcript && (
                        <div className="mt-3 p-2 bg-zinc-950 rounded border border-zinc-800 text-xs text-blue-400 italic">
                          Heard: "{transcript}"
                        </div>
                      )}
                    </div>
                    <button
                      onClick={toggleVoiceScoring}
                      className={`h-16 w-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                        isListening 
                          ? 'bg-blue-600 text-white shadow-blue-500/30 hover:bg-blue-500 animate-pulse' 
                          : 'bg-zinc-800 text-slate-300 hover:bg-zinc-700'
                      }`}
                    >
                      {isListening ? <Mic size={24} /> : <MicOff size={24} />}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}