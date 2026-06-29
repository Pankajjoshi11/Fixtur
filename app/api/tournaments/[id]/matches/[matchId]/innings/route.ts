import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/tournaments/[id]/matches/[matchId]/innings - Get innings data for a match
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> }
) {
  try {
    const { matchId } = await params;
    
    // Get the match details
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: {
          include: {
            players: true,
          },
        },
        awayTeam: {
          include: {
            players: true,
          },
        },
      },
    });

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    // Get all deliveries for this match, ordered by timestamp
    const deliveries = await prisma.inningDelivery.findMany({
      where: { matchId },
      include: {
        striker: true,
        nonStriker: true,
        bowler: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    // Separate deliveries by inning
    const firstInningDeliveries = deliveries.filter(d => d.inning === 1);
    const secondInningDeliveries = deliveries.filter(d => d.inning === 2);

    // Calculate first inning stats
    const firstInningStats = calculateInningStats(firstInningDeliveries, match.homeTeam, match.awayTeam);
    
    // Calculate second inning stats
    const secondInningStats = calculateInningStats(secondInningDeliveries, match.awayTeam, match.homeTeam);

    return NextResponse.json({
      match: {
        id: match.id,
        title: match.title,
        status: match.status,
        currentInning: match.currentInning,
        homeTeam: match.homeTeam,
        awayTeam: match.awayTeam,
        tossWinnerId: match.tossWinnerId,
        tossDecision: match.tossDecision,
        totalRuns: match.totalRuns,
        totalWickets: match.totalWickets,
        overs: match.overs,
        ballsInCurrentOver: match.ballsInCurrentOver,
        firstInningRuns: match.firstInningRuns,
        firstInningWickets: match.firstInningWickets,
        firstInningOvers: match.firstInningOvers,
        firstInningBalls: match.firstInningBalls,
        targetScore: match.targetScore,
        matchVerdict: match.matchVerdict,
        strikerId: match.strikerId,
        nonStrikerId: match.nonStrikerId,
        bowlerId: match.bowlerId,
      },
      currentInning: match.currentInning,
      firstInning: {
        deliveries: firstInningDeliveries,
        stats: firstInningStats,
        runs: firstInningDeliveries.reduce((sum, d) => sum + d.runs + d.extras, 0),
        wickets: firstInningDeliveries.filter(d => d.isWicket).length,
        overs: Math.floor(firstInningDeliveries.filter(d => d.isLegalDelivery).length / 6),
        balls: firstInningDeliveries.filter(d => d.isLegalDelivery).length % 6,
      },
      secondInning: {
        deliveries: secondInningDeliveries,
        stats: secondInningStats,
        runs: secondInningDeliveries.reduce((sum, d) => sum + d.runs + d.extras, 0),
        wickets: secondInningDeliveries.filter(d => d.isWicket).length,
        overs: Math.floor(secondInningDeliveries.filter(d => d.isLegalDelivery).length / 6),
        balls: secondInningDeliveries.filter(d => d.isLegalDelivery).length % 6,
      },
    });
  } catch (error) {
    console.error('Failed to fetch innings data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch innings data' },
      { status: 500 }
    );
  }
}

interface DeliveryData {
  id: string;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  runs: number;
  extras: number;
  extraType: string | null;
  isWicket: boolean;
  wicketType: string | null;
  isLegalDelivery: boolean;
  timestamp: Date;
  striker?: { id: string; name: string };
  nonStriker?: { id: string; name: string };
  bowler?: { id: string; name: string };
}

interface PlayerStat {
  id: string;
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: string;
  status: string;
}

function calculateInningStats(deliveries: DeliveryData[], battingTeam: any, bowlingTeam: any) {
  const battingStats: PlayerStat[] = [];
  const bowlingStats: any[] = [];

  if (!deliveries.length) return { batting: battingStats, bowling: bowlingStats };

  // Batting stats
  const batsmanMap = new Map<string, { runs: number; balls: number; fours: number; sixes: number; out: boolean }>();
  
  deliveries.forEach(d => {
    const existing = batsmanMap.get(d.strikerId) || { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
    existing.runs += d.runs;
    if (d.isLegalDelivery && d.extraType !== 'WIDE') existing.balls += 1;
    if (d.runs === 4) existing.fours += 1;
    if (d.runs === 6) existing.sixes += 1;
    if (d.isWicket) existing.out = true;
    batsmanMap.set(d.strikerId, existing);
  });

  batsmanMap.forEach((stats, id) => {
    const player = battingTeam.players.find((p: any) => p.id === id);
    battingStats.push({
      id,
      name: player?.name || 'Unknown',
      runs: stats.runs,
      balls: stats.balls,
      fours: stats.fours,
      sixes: stats.sixes,
      strikeRate: stats.balls > 0 ? ((stats.runs / stats.balls) * 100).toFixed(2) : '0.00',
      status: stats.out ? 'out' : 'not out',
    });
  });

  // Bowling stats
  const bowlerMap = new Map<string, { runs: number; wickets: number; legalBalls: number }>();
  
  deliveries.forEach(d => {
    const existing = bowlerMap.get(d.bowlerId) || { runs: 0, wickets: 0, legalBalls: 0 };
    existing.runs += d.runs + d.extras;
    if (d.isWicket) existing.wickets += 1;
    if (d.isLegalDelivery) existing.legalBalls += 1;
    bowlerMap.set(d.bowlerId, existing);
  });

  bowlerMap.forEach((stats, id) => {
    const player = bowlingTeam.players.find((p: any) => p.id === id);
    const overs = Math.floor(stats.legalBalls / 6);
    const balls = stats.legalBalls % 6;
    bowlingStats.push({
      id,
      name: player?.name || 'Unknown',
      overs: `${overs}.${balls}`,
      runs: stats.runs,
      wickets: stats.wickets,
      economy: stats.legalBalls > 0 ? ((stats.runs / stats.legalBalls) * 6).toFixed(2) : '0.00',
    });
  });

  return { batting: battingStats, bowling: bowlingStats };
}