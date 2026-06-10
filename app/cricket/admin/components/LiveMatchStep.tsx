import React, { useState, useEffect, useRef } from 'react';
import { Match, Team } from '../types';
import { Activity, RotateCcw, Zap, ShieldAlert, Mic, MicOff } from 'lucide-react';
import { useScoringStore } from '@/store/useScoringStore';
import LiveScorecard from './LiveScorecard';

interface LiveMatchStepProps {
  activeMatch: Match | null;
  tournament: { name: string; overs: number };
  battingTeam: Team | null;
  bowlingTeam: Team | null;
  onExit: () => void;
}

export default function LiveMatchStep({ activeMatch, tournament, battingTeam, bowlingTeam, onExit }: LiveMatchStepProps) {
  const store = useScoringStore();

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  const [showOverModal, setShowOverModal] = useState(false);
  const [showInningsModal, setShowInningsModal] = useState(false);
  const [showMatchCompleteModal, setShowMatchCompleteModal] = useState(false);
  const [nextBowlerId, setNextBowlerId] = useState('');
  const [nextStrikerId, setNextStrikerId] = useState('');
  const [nextNonStrikerId, setNextNonStrikerId] = useState('');

  const [showWicketModal, setShowWicketModal] = useState(false);
  const [newBatsmanId, setNewBatsmanId] = useState('');

  const renderPlayerName = (id: string | null) => {
    if (!id || !activeMatch) return 'Unknown';
    const player = [...activeMatch.teamA.players, ...activeMatch.teamB.players].find(p => p.id === id);
    return player ? player.name : id;
  };

  useEffect(() => {
    if (!store.matchId) return;
    const syncState = async () => {
      try {
        await fetch('/api/scoring/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            matchId: store.matchId, 
            state: store,
            meta: store.meta,
            battingTeam,
            bowlingTeam
          })
        });
      } catch (err) {}
    };
    syncState();
  }, [store.totalRuns, store.totalWickets, store.overs, store.ballsInCurrentOver, store.deliveryHistory.length, store.meta, store, activeMatch, tournament]);

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

  useEffect(() => {
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
         if (!showMatchCompleteModal && !store.matchVerdict) {
            let verdict = '';
            if (store.targetScore && store.totalRuns >= store.targetScore) {
               const wicketsLeft = 10 - store.totalWickets;
               verdict = `${battingTeam?.name || 'Batting Team'} won by ${wicketsLeft} wicket${wicketsLeft !== 1 ? 's' : ''}`;
            } else if (store.totalRuns === (store.targetScore ? store.targetScore - 1 : 0) && (isOversFinished || isAllOut)) {
               verdict = `Match Tied`;
            } else if (isOversFinished || isAllOut) {
               const runsShort = (store.targetScore ? store.targetScore - 1 : 0) - store.totalRuns;
               verdict = `${bowlingTeam?.name || 'Bowling Team'} won by ${runsShort} run${runsShort !== 1 ? 's' : ''}`;
            }
            
            store.setStateOverride({ matchVerdict: verdict });
            setShowMatchCompleteModal(true);
            setShowOverModal(false);
         }
      } else if (isOverComplete && lastDelivery && lastDelivery.isLegalDelivery && !isOversFinished && !isAllOut) {
         setShowOverModal(true);
      }
  }, [store.overs, store.ballsInCurrentOver, store.deliveryHistory, store.totalWickets, store.totalRuns, tournament.overs, store.currentInning, showInningsModal, store.targetScore, showMatchCompleteModal, store.matchVerdict, battingTeam, bowlingTeam]);

  const handleNextOverSetup = () => {
    store.setStateOverride({
      bowlerId: nextBowlerId,
      strikerId: nextStrikerId,
      nonStrikerId: nextNonStrikerId,
      meta: {
        ...store.meta,
        bowlerName: renderPlayerName(nextBowlerId),
        strikerName: renderPlayerName(nextStrikerId),
        nonStrikerName: renderPlayerName(nextNonStrikerId)
      }
    });
    setShowOverModal(false);
  };

  const handleStartSecondInnings = () => {
    store.switchInnings();
    store.setStateOverride({
      strikerId: nextStrikerId,
      nonStrikerId: nextNonStrikerId,
      bowlerId: nextBowlerId,
      meta: {
        ...store.meta,
        bowlerName: renderPlayerName(nextBowlerId),
        strikerName: renderPlayerName(nextStrikerId),
        nonStrikerName: renderPlayerName(nextNonStrikerId)
      }
    });
    setShowInningsModal(false);
  };

  const handleRun = (runs: number) => {
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
      strikerId: newBatsmanId,
      meta: {
        ...store.meta,
        strikerName: renderPlayerName(newBatsmanId)
      }
    });
    setNewBatsmanId('');
    setShowWicketModal(false);
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
          <button onClick={onExit} className="px-4 py-2 rounded-md border border-zinc-700 bg-zinc-900 text-sm hover:bg-zinc-800 transition-colors">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left Column: Live Score Board */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 text-center shadow-lg relative">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Score</h2>
            <div className="text-6xl font-extrabold tracking-tighter text-emerald-400 mb-2">
              {store.totalRuns} <span className="text-4xl text-slate-300 font-bold">/ {store.totalWickets}</span>
            </div>
            <div className="text-xl text-slate-300 font-medium">
              Overs: {store.overs}.{store.ballsInCurrentOver}
              {store.currentInning === 2 && store.targetScore && (
                <span className="ml-4 text-emerald-400">Target: {store.targetScore}</span>
              )}
            </div>
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
                       .filter(p => p.id !== store.nonStrikerId && p.id !== store.strikerId) // Don't show current non-striker or the out striker
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
          {showOverModal && !showWicketModal && !showInningsModal && (
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

          {/* Innings Completion Modal Overlay */}
          {showInningsModal && (
            <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-8 flex flex-col justify-center animate-fade-in-up">
              <h2 className="text-2xl font-bold text-emerald-400 mb-4 text-center">Innings Completed</h2>
              <div className="space-y-4 max-w-sm mx-auto w-full">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Select Next Bowler</label>
                  <select value={nextBowlerId} onChange={e => setNextBowlerId(e.target.value)} className="w-full p-3 bg-zinc-900 border border-zinc-800 rounded text-slate-200">
                     <option value="">Select Bowler</option>
                     {battingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Striker</label>
                    <select value={nextStrikerId} onChange={e => setNextStrikerId(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200">
                       <option value="">Select</option>
                       {bowlingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Non-Striker</label>
                    <select value={nextNonStrikerId} onChange={e => setNextNonStrikerId(e.target.value)} className="w-full p-2 bg-zinc-900 border border-zinc-800 rounded text-sm text-slate-200">
                       <option value="">Select</option>
                       {bowlingTeam?.players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleStartSecondInnings}
                  disabled={!nextBowlerId || !nextStrikerId || !nextNonStrikerId}
                  className="w-full mt-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded disabled:opacity-50"
                >
                  Start Second Innings
                </button>
              </div>
            </div>
          )}

          {/* Match Completion Modal Overlay */}
          {showMatchCompleteModal && (
            <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm rounded-xl border border-zinc-800 p-8 flex flex-col justify-center animate-fade-in-up">
              <h2 className="text-3xl font-bold text-emerald-400 mb-4 text-center">Match Completed</h2>
              <div className="space-y-6 max-w-sm mx-auto w-full text-center">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-inner">
                  <div className="text-xl font-bold text-slate-100 mb-2">{store.matchVerdict}</div>
                  
                  {store.firstInningScore && (
                     <div className="text-sm text-slate-400 mt-4 flex justify-between px-2">
                        <span>1st Inning:</span>
                        <span className="font-semibold text-slate-200">{store.firstInningScore.runs}/{store.firstInningScore.wickets} <span className="text-xs text-slate-500">({store.firstInningScore.overs}.{store.firstInningScore.balls})</span></span>
                     </div>
                  )}
                  <div className="text-sm text-slate-400 mt-2 flex justify-between px-2 border-t border-zinc-800 pt-2">
                     <span>2nd Inning:</span>
                     <span className="font-semibold text-slate-200">{store.totalRuns}/{store.totalWickets} <span className="text-xs text-slate-500">({store.overs}.{store.ballsInCurrentOver})</span></span>
                  </div>
                </div>

                <button 
                  onClick={onExit}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded transition-colors"
                >
                  Exit to Schedule
                </button>
              </div>
            </div>
          )}

          {/* Runs Pad */}
          <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 ${showOverModal || showInningsModal || showMatchCompleteModal ? 'opacity-30 pointer-events-none' : ''}`}>
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
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${showOverModal || showInningsModal || showMatchCompleteModal ? 'opacity-30 pointer-events-none' : ''}`}>
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
          <div className={`bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden ${showOverModal || showInningsModal || showMatchCompleteModal ? 'opacity-30 pointer-events-none' : ''}`}>
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

      {/* Detailed Live Scorecard */}
      <LiveScorecard 
        deliveries={store.deliveryHistory.filter(d => d.inning === store.currentInning)}
        battingTeam={battingTeam}
        bowlingTeam={bowlingTeam}
        currentStrikerId={store.strikerId}
        currentNonStrikerId={store.nonStrikerId}
      />
    </>
  );
}