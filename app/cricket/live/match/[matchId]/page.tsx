'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Trophy, Activity, ChevronRight } from 'lucide-react';
import { getPusherClient } from '@/lib/pusher';
import LiveScorecard from '../../../admin/components/LiveScorecard';

interface Delivery {
  id: string;
  runs: number;
  isWicket: boolean;
  extraType?: string;
  extras: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  inning: number;
}

interface MatchState {
  totalRuns: number;
  totalWickets: number;
  overs: number;
  ballsInCurrentOver: number;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  currentInning: number;
  firstInningScore?: { runs: number; wickets: number; overs: number; balls: number };
  targetScore?: number;
  matchVerdict?: string;
  meta: {
    teamA: string;
    teamB: string;
    tournament: string;
    strikerName: string;
    nonStrikerName: string;
    bowlerName: string;
  };
}

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [matchState, setMatchState] = useState<MatchState | null>(null);
  const [battingTeam, setBattingTeam] = useState<any>(null);
  const [bowlingTeam, setBowlingTeam] = useState<any>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<Delivery[]>([]);
  const [activeTab, setActiveTab] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial match state
  useEffect(() => {
    if (!matchId) return;

    const fetchMatchState = async () => {
      try {
        const res = await fetch(`/api/scoring/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          const backendState = data.state ? data.state : data;
          const backendMeta = data.meta ? data.meta : backendState.meta;

          setMatchState({
            ...backendState,
            meta: backendMeta,
          });

          if (data.battingTeam) setBattingTeam(data.battingTeam);
          if (data.bowlingTeam) setBowlingTeam(data.bowlingTeam);
          if (backendState.deliveryHistory) {
            setDeliveryHistory(backendState.deliveryHistory);
          }
        } else {
          setError('Match not found');
        }
      } catch (err) {
        console.error('Failed to fetch match state:', err);
        setError('Failed to load match');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchState();
  }, [matchId]);

  // Subscribe to Pusher for live updates
  useEffect(() => {
    if (!matchId || loading) return;

    const pusher = getPusherClient();
    if (!pusher) {
      console.log('Pusher not connected - real-time updates disabled');
      return;
    }

    const matchChannel = pusher.subscribe(`match-${matchId}`);

    matchChannel.bind('score-update', (serverState: any) => {
      const newState = serverState.state ? serverState.state : serverState;
      const newMeta = serverState.meta ? serverState.meta : newState.meta;

      setMatchState({
        ...newState,
        meta: newMeta,
      });

      if (serverState.battingTeam) setBattingTeam(serverState.battingTeam);
      if (serverState.bowlingTeam) setBowlingTeam(serverState.bowlingTeam);
      if (newState.deliveryHistory) {
        setDeliveryHistory(newState.deliveryHistory);
      }
    });

    return () => {
      matchChannel.unbind('score-update');
      pusher.unsubscribe(`match-${matchId}`);
    };
  }, [matchId, loading]);

  // Auto-switch tab to current inning
  useEffect(() => {
    if (matchState) {
      setActiveTab(matchState.currentInning as 1 | 2);
    }
  }, [matchState?.currentInning]);

  // Calculate statistics
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
    return [...deliveryHistory].slice(-6).reverse();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Activity size={48} className="mx-auto text-emerald-500 animate-pulse mb-4" />
          <p className="text-slate-400">Loading match...</p>
        </div>
      </div>
    );
  }

  if (error || !matchState) {
    return (
      <div className="min-h-screen bg-zinc-950 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">{error || 'Match not found'}</p>
          <Link href="/cricket/live" className="text-emerald-400 hover:text-emerald-300">
            Back to Live
          </Link>
        </div>
      </div>
    );
  }

  const strikerStats = getBatsmanStats(matchState.strikerId);
  const nonStrikerStats = getBatsmanStats(matchState.nonStrikerId);
  const totalBalls = (matchState.overs * 6) + matchState.ballsInCurrentOver;
  const currentRunRate = totalBalls > 0 ? ((matchState.totalRuns / totalBalls) * 6).toFixed(2) : '0.00';

  const inning1BattingTeam = matchState.currentInning === 1 ? battingTeam : bowlingTeam;
  const inning1BowlingTeam = matchState.currentInning === 1 ? bowlingTeam : battingTeam;
  const inning2BattingTeam = matchState.currentInning === 2 ? battingTeam : bowlingTeam;
  const inning2BowlingTeam = matchState.currentInning === 2 ? bowlingTeam : battingTeam;

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/cricket/live" className="text-slate-400 hover:text-white transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <Trophy className="text-emerald-500" size={28} />
              <div>
                <h1 className="text-xl font-bold text-emerald-500">
                  {matchState.meta.teamA} vs {matchState.meta.teamB}
                </h1>
                <p className="text-xs text-slate-500">{matchState.meta.tournament}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {matchState.matchVerdict ? (
                <span className="text-xs font-bold bg-blue-600 text-white px-2 py-1 rounded tracking-widest uppercase">
                  Match Complete
                </span>
              ) : (
                <span className="text-xs font-bold bg-red-500 text-white px-2 py-1 rounded animate-pulse tracking-widest uppercase flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full"></span>
                  Live
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-6">
        {/* Score Header */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-blue-500"></div>

          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-200">{matchState.meta.teamA}</h2>
                {matchState.currentInning === 2 && matchState.firstInningScore && (
                  <div className="text-sm text-slate-400 mt-2">
                    {matchState.firstInningScore.runs}/{matchState.firstInningScore.wickets}{' '}
                    <span className="text-xs">
                      ({matchState.firstInningScore.overs}.{matchState.firstInningScore.balls})
                    </span>
                  </div>
                )}
              </div>

              <div className="text-center flex-none">
                <div className="text-5xl md:text-6xl font-black tracking-tighter text-white drop-shadow-md">
                  {matchState.totalRuns}
                  <span className="text-3xl md:text-4xl text-slate-300">/{matchState.totalWickets}</span>
                </div>
                <div className="text-lg text-emerald-400 font-medium mt-1">
                  Overs {matchState.overs}.{matchState.ballsInCurrentOver}
                </div>
                {matchState.currentInning === 2 && matchState.targetScore && (
                  <div className="text-sm text-amber-400 font-bold mt-1 tracking-wider uppercase">
                    Target: {matchState.targetScore}
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-2 font-mono">CRR: {currentRunRate}</div>
              </div>

              <div className="text-center md:text-right flex-1">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-400">{matchState.meta.teamB}</h2>
                {matchState.currentInning === 1 ? (
                  <div className="text-xs text-slate-500 mt-2">Yet to bat</div>
                ) : (
                  <div className="text-xs text-emerald-500 mt-2 font-semibold">Batting</div>
                )}
              </div>
            </div>

            {matchState.matchVerdict && (
              <div className="mt-8 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
                <span className="text-lg font-bold text-emerald-400">{matchState.matchVerdict}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Batting Stats */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-zinc-800 pb-3 mb-4">
              Batters
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                <div className="pl-2">
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    {matchState.meta.strikerName || 'Striker'}
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                      *
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-white">{strikerStats.runs}</span>
                  <span className="text-xs text-slate-400 ml-1">({strikerStats.balls})</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-3">
                <div className="font-medium text-slate-400">{matchState.meta.nonStrikerName || 'Non-Striker'}</div>
                <div className="text-right">
                  <span className="text-lg font-bold text-slate-300">{nonStrikerStats.runs}</span>
                  <span className="text-xs text-slate-500 ml-1">({nonStrikerStats.balls})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bowler & Recent Deliveries */}
          <div className="space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider border-b border-zinc-800 pb-3 mb-4">
                Bowler
              </h3>
              <div className="flex justify-between items-center p-3 bg-zinc-950/50 rounded-lg border border-zinc-800/50">
                <div className="font-bold text-slate-200">{matchState.meta.bowlerName || 'Bowler'}</div>
                <Activity size={16} className="text-emerald-500" />
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Recent Balls
              </h3>
              <div className="flex flex-wrap gap-2">
                {getRecentDeliveries().length === 0 ? (
                  <span className="text-xs text-slate-500">No deliveries yet.</span>
                ) : (
                  getRecentDeliveries().map((d, idx) => {
                    let label = d.runs.toString();
                    let style = 'bg-zinc-800 text-slate-300';

                    if (d.isWicket) {
                      label = 'W';
                      style = 'bg-red-500 text-white font-bold';
                    } else if (d.extraType) {
                      label =
                        d.extraType === 'WIDE'
                          ? 'Wd'
                          : d.extraType === 'NO_BALL'
                          ? 'Nb'
                          : d.extraType === 'LEG_BYE'
                          ? `${d.extras}Lb`
                          : `${d.extras}B`;
                      style = 'bg-orange-500/20 text-orange-400';
                    } else if (d.runs === 4) {
                      style = 'bg-blue-500 text-white font-bold';
                    } else if (d.runs === 6) {
                      style = 'bg-purple-500 text-white font-bold';
                    }

                    return (
                      <div
                        key={idx}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border border-zinc-700 ${style}`}
                      >
                        {label}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scorecard */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg">
          <div className="flex border-b border-zinc-800">
            <button
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                activeTab === 1
                  ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-800'
              }`}
            >
              1st Inning ({matchState.meta.teamA})
            </button>
            <button
              onClick={() => setActiveTab(2)}
              disabled={matchState.currentInning === 1}
              className={`flex-1 py-4 text-sm font-semibold transition-colors ${
                matchState.currentInning === 1
                  ? 'opacity-50 cursor-not-allowed text-slate-600'
                  : activeTab === 2
                  ? 'bg-emerald-500/10 text-emerald-400 border-b-2 border-emerald-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-zinc-800'
              }`}
            >
              2nd Inning ({matchState.meta.teamB})
            </button>
          </div>

          <div className="p-4">
            <LiveScorecard
              deliveries={deliveryHistory?.filter(d => d.inning === activeTab) || []}
              battingTeam={activeTab === 1 ? inning1BattingTeam : inning2BattingTeam}
              bowlingTeam={activeTab === 1 ? inning1BowlingTeam : inning2BowlingTeam}
              currentStrikerId={activeTab === matchState.currentInning ? matchState.strikerId : null}
              currentNonStrikerId={activeTab === matchState.currentInning ? matchState.nonStrikerId : null}
            />
          </div>
        </div>

        {/* Back to Lobby */}
        <div className="text-center">
          <Link
            href="/cricket/live"
            className="inline-flex items-center gap-2 text-emerald-500 hover:text-emerald-400 text-sm font-semibold transition-colors"
          >
            <ChevronRight size={16} className="rotate-180" />
            Back to All Matches
          </Link>
        </div>
      </main>
    </div>
  );
}