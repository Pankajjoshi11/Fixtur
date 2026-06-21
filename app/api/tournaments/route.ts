import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const tournaments = await prisma.tournament.findMany({
      include: {
        matches: true,
        teams: {
          include: {
            players: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    // Calculate status for each tournament
    const tournamentsWithStatus = tournaments.map(tournament => {
      const now = new Date();
      const startDate = new Date(tournament.startDate);
      const endDate = tournament.endDate ? new Date(tournament.endDate) : null;
      
      // Check match statuses
      const hasLiveMatches = tournament.matches.some(m => m.status === 'LIVE');
      const allMatchesCompleted = tournament.matches.length > 0 && 
        tournament.matches.every(m => m.status === 'COMPLETED');
      
      let status: 'upcoming' | 'ongoing' | 'completed';
      
      if (hasLiveMatches || (startDate <= now && !allMatchesCompleted && (!endDate || endDate >= now))) {
        status = 'ongoing';
      } else if (allMatchesCompleted || (endDate && endDate < now)) {
        status = 'completed';
      } else {
        status = 'upcoming';
      }

      return {
        ...tournament,
        status,
        matchCount: tournament.matches.length,
        teamCount: tournament.teams.length,
        playerCount: tournament.teams.reduce((acc, team) => acc + team.players.length, 0)
      };
    });

    return NextResponse.json(tournamentsWithStatus);
  } catch (error) {
    console.error('[TOURNAMENTS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}