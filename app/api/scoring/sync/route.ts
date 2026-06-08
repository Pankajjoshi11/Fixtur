import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { activeMatches, matchStates } from '@/lib/store';

export async function GET() {
  return NextResponse.json({ matches: Array.from(activeMatches.values()) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { matchId, state, meta, battingTeam, bowlingTeam } = body;

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

    // Save full state for direct polling via /api/scoring/[matchId]
    matchStates.set(matchId, {
      state,
      meta,
      battingTeam: battingTeam || null,
      bowlingTeam: bowlingTeam || null,
      lastUpdated: Date.now(),
    });

    // Trigger a Pusher event on the match-specific channel
    // Include full data in the push so viewers get it instantly
    await pusherServer.trigger(`match-${matchId}`, 'score-update', {
      state,
      meta,
      battingTeam,
      bowlingTeam
    });
    
    // Trigger global update for the lobby
    await pusherServer.trigger(`global-lobby`, 'matches-update', Array.from(activeMatches.values()));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PUSHER_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
