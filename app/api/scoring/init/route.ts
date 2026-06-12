import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tournament, teams, activeMatch, tossWinnerId, tossDecision } = body;

    if (!tournament || !teams || !activeMatch) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // 1. Upsert Tournament
    await prisma.tournament.upsert({
      where: { id: tournament.id },
      update: {
        name: tournament.name,
        location: tournament.location,
        format: tournament.format,
        numberOfOvers: tournament.overs,
      },
      create: {
        id: tournament.id,
        name: tournament.name,
        sport: 'CRICKET',
        location: tournament.location,
        format: tournament.format,
        numberOfOvers: tournament.overs,
        startDate: new Date(),
      }
    });

    // 2. Upsert Teams and Players
    for (const team of teams) {
      await prisma.team.upsert({
        where: { id: team.id },
        update: { name: team.name, shortName: team.shortName },
        create: {
          id: team.id,
          name: team.name,
          shortName: team.shortName,
          tournamentId: tournament.id,
        }
      });

      for (const player of team.players) {
        await prisma.player.upsert({
          where: { id: player.id },
          update: { name: player.name, role: player.role, isCaptain: player.isCaptain },
          create: {
            id: player.id,
            name: player.name,
            role: player.role,
            isCaptain: player.isCaptain,
            teamId: team.id
          }
        });
      }
    }

    // 3. Upsert Match
    await prisma.match.upsert({
      where: { id: activeMatch.id },
      update: {
        status: 'LIVE',
        tossWinnerId,
        tossDecision,
      },
      create: {
        id: activeMatch.id,
        sport: 'CRICKET',
        tournamentId: tournament.id,
        homeTeamId: activeMatch.teamA.id,
        awayTeamId: activeMatch.teamB.id,
        status: 'LIVE',
        tossWinnerId,
        tossDecision,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[INIT_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
