import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';

// In-memory store for active matches to easily populate the Live Viewer lobby
const activeMatches = new Map();

export async function GET() {
  return NextResponse.json({ matches: Array.from(activeMatches.values()) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, state, meta } = body;

    if (!matchId || !state) {
      return new NextResponse("Missing matchId or state", { status: 400 });
    }

    // Save a summary of the match in memory for the lobby
    activeMatches.set(matchId, {
      matchId,
      teamA: meta?.teamA || 'Team A',
      teamB: meta?.teamB || 'Team B',
      tournament: meta?.tournament || 'Local Tournament',
      totalRuns: state.totalRuns,
      totalWickets: state.totalWickets,
      overs: state.overs,
      ballsInCurrentOver: state.ballsInCurrentOver,
      strikerId: state.strikerId,
      nonStrikerId: state.nonStrikerId,
      bowlerId: state.bowlerId,
      lastUpdated: Date.now(),
    });

    // Trigger a Pusher event on the match-specific channel
    await pusherServer.trigger(`match-${matchId}`, 'score-update', state);
    
    // Trigger global update for the lobby
    await pusherServer.trigger(`global-lobby`, 'matches-update', Array.from(activeMatches.values()));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUSHER_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
