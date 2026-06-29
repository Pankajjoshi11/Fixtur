import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/host/tournaments - Get tournaments created by the host
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const tournaments = await prisma.tournament.findMany({
      where: { organizerId: auth.userId },
      include: {
        matches: true,
        teams: {
          include: {
            players: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate status for each tournament
    const tournamentsWithStatus = tournaments.map((tournament) => {
      const now = new Date();
      const startDate = new Date(tournament.startDate);
      const endDate = tournament.endDate ? new Date(tournament.endDate) : null;

      const hasLiveMatches = tournament.matches.some((m) => m.status === "LIVE");
      const allMatchesCompleted =
        tournament.matches.length > 0 &&
        tournament.matches.every((m) => m.status === "COMPLETED");

      let status: "upcoming" | "ongoing" | "completed";

      if (hasLiveMatches || (startDate <= now && !allMatchesCompleted && (!endDate || endDate >= now))) {
        status = "ongoing";
      } else if (allMatchesCompleted || (endDate && endDate < now)) {
        status = "completed";
      } else {
        status = "upcoming";
      }

      return {
        ...tournament,
        status,
        matchCount: tournament.matches.length,
        teamCount: tournament.teams.length,
        playerCount: tournament.teams.reduce((acc, team) => acc + team.players.length, 0),
      };
    });

    return NextResponse.json(tournamentsWithStatus);
  } catch (error) {
    console.error("[HOST_TOURNAMENTS_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST /api/host/tournaments - Create a new tournament
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { name, location, format, numberOfOvers, startDate, endDate } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Tournament name is required" }, { status: 400 });
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        sport: "CRICKET",
        location,
        format,
        numberOfOvers,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        organizerId: auth.userId,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error("[HOST_TOURNAMENTS_POST_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}