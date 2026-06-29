import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireTournamentAccess } from "@/lib/auth";

// GET /api/host/tournaments/[id] - Get tournament details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireTournamentAccess(req, id);
    if (auth instanceof NextResponse) return auth;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
        teams: {
          include: {
            players: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("[HOST_TOURNAMENT_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// PUT /api/host/tournaments/[id] - Update tournament
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireTournamentAccess(req, id);
    if (auth instanceof NextResponse) return auth;

    const { name, location, format, numberOfOvers, startDate, endDate } = await req.json();

    const tournament = await prisma.tournament.update({
      where: { id },
      data: {
        name,
        location,
        format,
        numberOfOvers,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error("[HOST_TOURNAMENT_PUT_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE /api/host/tournaments/[id] - Delete tournament
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireTournamentAccess(req, id);
    if (auth instanceof NextResponse) return auth;

    // Delete related records first
    await prisma.inningDelivery.deleteMany({
      where: {
        match: {
          tournamentId: id,
        },
      },
    });

    await prisma.match.deleteMany({
      where: { tournamentId: id },
    });

    await prisma.player.deleteMany({
      where: {
        team: {
          tournamentId: id,
        },
      },
    });

    await prisma.team.deleteMany({
      where: { tournamentId: id },
    });

    await prisma.tournament.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[HOST_TOURNAMENT_DELETE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}