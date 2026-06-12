import { NextResponse } from 'next/server';
import { pusherServer } from '@/lib/pusher';
import { activeMatches, matchStates } from '@/lib/store';
import prisma from '@/lib/prisma';

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

    // 1. Database Persistence via Prisma
    try {
      // Update Match State
      await prisma.match.update({
        where: { id: matchId },
        data: {
          currentInning: state.currentInning,
          totalRuns: state.totalRuns,
          totalWickets: state.totalWickets,
          overs: state.overs,
          ballsInCurrentOver: state.ballsInCurrentOver,
          firstInningRuns: state.firstInningScore?.runs ?? null,
          firstInningWickets: state.firstInningScore?.wickets ?? null,
          firstInningOvers: state.firstInningScore?.overs ?? null,
          firstInningBalls: state.firstInningScore?.balls ?? null,
          targetScore: state.targetScore ?? null,
          matchVerdict: state.matchVerdict ?? null,
          strikerId: state.strikerId,
          nonStrikerId: state.nonStrikerId,
          bowlerId: state.bowlerId,
          status: state.matchVerdict ? 'COMPLETED' : 'LIVE',
        }
      });

      // Sync Delivery History
      if (state.deliveryHistory) {
        const currentDeliveryIds = state.deliveryHistory.map((d: any) => d.id);
        
        // Remove any deliveries that were undone (not in the current array)
        if (currentDeliveryIds.length > 0) {
          await prisma.inningDelivery.deleteMany({
            where: {
              matchId,
              id: { notIn: currentDeliveryIds }
            }
          });
          
          // Insert new deliveries
          const deliveriesToInsert = state.deliveryHistory.map((d: any) => ({
            id: d.id,
            matchId,
            inning: d.inning,
            strikerId: d.strikerId,
            nonStrikerId: d.nonStrikerId,
            bowlerId: d.bowlerId,
            runs: d.runs,
            extras: d.extras,
            extraType: d.extraType || null,
            isWicket: d.isWicket,
            wicketType: d.wicketType || null,
            isLegalDelivery: d.isLegalDelivery
          }));

          await prisma.inningDelivery.createMany({
            data: deliveriesToInsert,
            skipDuplicates: true
          });
        } else {
          // If history is empty (e.g. all undone), delete all deliveries for this match
          await prisma.inningDelivery.deleteMany({
            where: { matchId }
          });
        }
      }
    } catch (dbError) {
      console.error('[DB_SYNC_ERROR]', dbError);
      // We log but do not block the Pusher real-time flow if DB fails momentarily
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
