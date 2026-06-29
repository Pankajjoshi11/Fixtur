import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTournamentAccess } from "@/lib/auth";

// GET /api/host/tournaments/[id]/teams - Get teams for a tournament
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireTournamentAccess(req, id);
    if (auth instanceof NextResponse) return auth;

    const teams = await prisma.team.findMany({
      where: { tournamentId: id },
      include: {
        players: true,
      },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error("[HOST_TEAMS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/host/tournaments/[id]/teams - Add a team to tournament
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireTournamentAccess(req, id);
    if (auth instanceof NextResponse) return auth;

    const { name, shortName, players } = await req.json();

    if (!name || !shortName) {
      return NextResponse.json({ error: "Team name and short name are required" }, { status: 400 });
    }

    // Validate player IDs if provided
    if (players && players.length > 0) {
      const invalidPlayers: { name: string; playerId: number }[] = [];

      for (const player of players) {
        if (player.playerId) {
          const user = await prisma.user.findUnique({
            where: { playerId: player.playerId },
            select: { id: true, name: true },
          });

          if (!user) {
            invalidPlayers.push({ name: player.name, playerId: player.playerId });
          }
        }
      }

      if (invalidPlayers.length > 0) {
        return NextResponse.json(
          {
            error: "Invalid player IDs found",
            invalidPlayers,
            message: `The following players are not registered: ${invalidPlayers.map((p) => `${p.name} (ID: ${p.playerId})`).join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    const team = await prisma.team.create({
      data: {
        name,
        shortName,
        tournamentId: id,
        players: players
          ? {
              create: players.map((player: any) => ({
                name: player.name,
                role: player.role,
                isCaptain: player.isCaptain || false,
                playerId: player.playerId,
              })),
            }
          : undefined,
      },
      include: {
        players: true,
      },
    });

    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("[HOST_TEAMS_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}