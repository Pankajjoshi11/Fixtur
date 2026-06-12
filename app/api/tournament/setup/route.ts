import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { tournament, teams, matches } = await req.json();

    if (tournament) {
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
    }

    if (teams && teams.length > 0 && tournament) {
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

        if (team.players && team.players.length > 0) {
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
      }
    }

    if (matches && matches.length > 0 && tournament) {
      for (const match of matches) {
        await prisma.match.upsert({
          where: { id: match.id },
          update: { status: match.status },
          create: {
            id: match.id,
            sport: 'CRICKET',
            tournamentId: tournament.id,
            homeTeamId: match.teamA.id,
            awayTeamId: match.teamB.id,
            status: match.status || 'SCHEDULED',
          }
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[SETUP_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
