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
      // Validate all playerIds before creating any records
      const invalidPlayers: { name: string; playerId: number }[] = [];
      
      for (const team of teams) {
        if (team.players && team.players.length > 0) {
          for (const player of team.players) {
            // Check if user with this playerId exists
            const user = await prisma.user.findUnique({
              where: { playerId: player.playerId },
              select: { id: true, name: true }
            });
            
            if (!user) {
              invalidPlayers.push({ name: player.name, playerId: player.playerId });
            }
          }
        }
      }

      // If there are invalid players, return error with details
      if (invalidPlayers.length > 0) {
        return NextResponse.json(
          { 
            error: 'Invalid player IDs found',
            invalidPlayers: invalidPlayers,
            message: `The following players are not registered: ${invalidPlayers.map(p => `${p.name} (ID: ${p.playerId})`).join(', ')}`
          },
          { status: 400 }
        );
      }

      // All validations passed, proceed with creating records
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
              update: { name: player.name, role: player.role, isCaptain: player.isCaptain, playerId: player.playerId },
              create: {
                id: player.id,
                name: player.name,
                role: player.role,
                isCaptain: player.isCaptain,
                playerId: player.playerId,
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