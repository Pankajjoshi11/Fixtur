'use client';

import { useState, useEffect } from 'react';
import { useScoringStore } from '@/store/useScoringStore';
import { getPusherClient } from '@/lib/pusher';
import { Activity, Radio, Trophy, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';

type ActiveMatchSummary = {
  matchId: string;
  teamA: string;
  teamB: string;
  tournament: string;
  totalRuns: number;
  totalWickets: number;
  overs: number;
  ballsInCurrentOver: number;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
  lastUpdated: number;
};

export default function LiveViewerDashboard() {
  const [activeMatches, setActiveMatches] = useState<ActiveMatchSummary[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Atomic Zustand selectors to guarantee fine-grained React re-renders
  const totalRuns = useScoringStore((state) => state.totalRuns);
  const totalWickets = useScoringStore((state) => state.totalWickets);
  const overs = useScoringStore((state) => state.overs);
  const ballsInCurrentOver = useScoringStore((state) => state.ballsInCurrentOver);
  const deliveryHistory = useScoringStore((state) => state.deliveryHistory);
  const strikerId = useScoringStore((state) => state.strikerId);
  const nonStrikerId = useScoringStore((state) => state.nonStrikerId);
  const meta = useScoringStore((state) => state.meta);
  const setStateOverride = useScoringStore((state) => state.setStateOverride);

  // --- LOBBY: Fetch active matches & subscribe to global updates ---
  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await fetch('/api/scoring/sync');
        const data = await res.json();
        setActiveMatches(data.matches || []);
      } catch (err) {
        console.error("Error fetching lobby matches:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMatches();

    const pusher = getPusherClient();
    if (!pusher) return;
    
    const channel = pusher.subscribe('global-lobby');
    channel.bind('matches-update', (matches: ActiveMatchSummary[]) => {
      setActiveMatches(matches);
    });

    return () => {
      channel.unbind('matches-update');
      pusher.unsubscribe('global-lobby');
    };
  }, []);

  // --- MATCH VIEW: Subscribe to specific match updates ---
  useEffect(() => {
    if (!selectedMatchId) return;

    const pusher = getPusherClient();
    if (!pusher) return;
    
    const matchChannel = pusher.subscribe(`match-${selectedMatchId}`);

    matchChannel.bind('score-update', (serverState: any) => {
      // Safely apply incoming live updates to global Zustand store
      setStateOverride(serverState);
    });

    return () => {
      matchChannel.unbind('score-update');
      pusher.unsubscribe(`match-${selectedMatchId}`);
    };
  }, [selectedMatchId, setStateOverride]);

  // --- CALCULATED STATISTICS ---
  const getBatsmanStats = (id: string | null) => {
    if (!id || !deliveryHistory) return { runs: 0, balls: 0 };
    
    const runs = deliveryHistory
      .filter(d => d.strikerId === id && !d.isWicket && !d.extraType?.includes('WIDE'))
      .reduce((sum, d) => sum + d.runs, 0);
      
    const balls = deliveryHistory
      .filter(d => d.strikerId === id && !d.extraType?.includes('WIDE'))
      .length;
      
    return { runs, balls };
  };

  const getRecentDeliveries = () => {
    if (!deliveryHistory) return [];
    return [...deliveryHistory].slice(-6).reverse(); // Defensive clone prior to reverse
  };

  const strikerStats = getBatsmanStats(strikerId);
  const nonStrikerStats = getBatsmanStats(nonStrikerId);
  
  const totalBalls = (overs * 6) + ballsInCurrentOver;
  const currentRunRate = totalBalls > 0 ? ((totalRuns / totalBalls) * 6).toFixed(2) : '0.00';

  // --- RENDER LOBBY LAYOUT ---
  if (!selectedMatchId) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 p-4 md:p-8 font-sans">
        <header className="max-w-4xl mx-auto border-b border-zinc-800 pb-4 mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-emerald-500 tracking-tight flex items-center gap-3">
               <Trophy size={32} /> Fixtur Live
            </h1>
            <p className="text-slate-400 mt-1">Real-time match center.</p>
          </div>
          <div className="flex gap-4">
             <Link href="/" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Home</Link>
             <Link href="/cricket/admin" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Admin Panel</Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold flex items-center gap-2"><Radio className="text-red-500 animate-pulse" /> Live Matches</h2>
          </div>

          {loading ? (
             <div className="text-center py-20 text-slate-500 animate-pulse">Loading active matches...</div>
          ) : activeMatches.length === 0 ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 text-center text-slate-400 shadow-lg">
              <Activity size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No live matches at the moment.</p>
              <p className="text-sm">Matches scheduled by the Admin will automatically appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeMatches.map((match) => (
                <div 
                  key={match.matchId} 
                  onClick={() => setSelectedMatchId(match.matchId)}
                  className="group bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 rounded-xl p-6 cursor-pointer transition-all shadow-lg hover:shadow-emerald-500/10"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider bg-emerald-500/10 px-2 py-1 rounded">Live</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1"><MapPin size={12}/> {match.tournament}</span>
                  </div>
                  
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-200">{match.teamA} <span className="text-slate-500 text-sm mx-1">vs</span> {match.teamB}</h3>
                  </div>

                  <div className="bg-zinc-950 rounded-lg p-4 flex justify-between items-center border border-zinc-800/50">
                    <div>
                      <div className="text-2xl font-extrabold text-white">{match.totalRuns}/{match.totalWickets}</div>
                      <div className="text-xs text-slate-400">Overs: {match.overs}.{match.ballsInCurrentOver}</div>
                    </div>
                    <ChevronRight className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- RENDER INDIVIDUAL MATCH SCORECARD VIEW ---
  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 p-4 md:p-8 font-sans">
      <header className="max-w-3xl mx-auto mb-6">
         <button 
           onClick={() => setSelectedMatchId(null)}
           className="text-emerald-500 hover:text-emerald-400 text-sm font-semibold flex items-center gap-1 transition-colors"
         >
           <ChevronRight size={16} className="rotate-180" /> Back to Lobby
         </button>
      </header>

      <main className="max-w-3xl mx-auto space-y-6">
        
        {/* Dynamic Header */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>
          
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded animate-pulse tracking-widest uppercase">Live</span>
              <span className="text-xs text-slate-400 uppercase tracking-widest">{meta?.tournament || 'Match Center'}</span>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-200">{meta?.teamA || 'Team A'}</h2>
              </div>
              
              <div className="text-center flex-none">
                <div className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-md">
                  {totalRuns}<span className="text-3xl md:text-4xl text-slate-300">/{totalWickets}</span>
                </div>
                <div className="text-lg text-emerald-400 font-medium mt-1">Overs {overs}.{ballsInCurrentOver}</div>
                <div className="text-xs text-slate-500 mt-2 font-mono">CRR: {currentRunRate}</div>
              </div>

              <div className="text-center md:text-right flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-400">{meta?.teamB || 'Team B'}</h2>
                <div className="text-xs text-slate-500 mt-2">Yet to bat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Batting Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
             <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-zinc-800 pb-3 mb-4">Batters</h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50 relative overflow-hidden">
                   <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                   <div className="pl-2">
                     <div className="font-bold text-slate-200 flex items-center gap-2">
                       {meta?.strikerName || 'Striker'} 
                       <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">*</span>
                     </div>
                   </div>
                   <div className="text-right">
                     <span className="text-xl font-bold text-white">{strikerStats.runs}</span>
                     <span className="text-xs text-slate-400 ml-1">({strikerStats.balls})</span>
                   </div>
                </div>

                <div className="flex justify-between items-center p-3">
                   <div className="font-medium text-slate-400">{meta?.nonStrikerName || 'Non-Striker'}</div>
                   <div className="text-right">
                     <span className="text-lg font-bold text-slate-300">{nonStrikerStats.runs}</span>
                     <span className="text-xs text-slate-500 ml-1">({nonStrikerStats.balls})</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Bowler Stats & Recent Deliveries */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
               <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-zinc-800 pb-3 mb-4 flex items-center justify-between">
                 <span>Bowler</span>
               </h3>
               <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                  <div className="font-bold text-slate-200">{meta?.bowlerName || 'Bowler'}</div>
                  <Activity size={16} className="text-emerald-500" />
               </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
               <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Recent Balls</h3>
               <div className="flex flex-wrap gap-2">
                 {getRecentDeliveries().length === 0 ? (
                    <span className="text-xs text-slate-500">No deliveries yet.</span>
                 ) : (
                    getRecentDeliveries().map((d, idx) => {
                      let label = d.runs.toString();
                      let style = "bg-zinc-800 text-slate-300";
                      
                      if (d.isWicket) {
                         label = 'W';
                         style = "bg-red-500 text-white font-bold";
                      } else if (d.extraType) {
                         label = d.extraType === 'WIDE' ? 'Wd' : d.extraType === 'NO_BALL' ? 'Nb' : d.extraType === 'LEG_BYE' ? `${d.extras}Lb` : `${d.extras}B`;
                         style = "bg-orange-500/20 text-orange-400";
                      } else if (d.runs === 4) {
                         style = "bg-blue-500 text-white font-bold";
                      } else if (d.runs === 6) {
                         style = "bg-purple-500 text-white font-bold";
                      }

                      return (
                        <div key={idx} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border border-zinc-700 ${style}`}>
                           {label}
                        </div>
                      );
                    })
                 )}
               </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}