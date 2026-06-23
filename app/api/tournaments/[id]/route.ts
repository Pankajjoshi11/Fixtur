import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/tournaments/[id] - Get tournament by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: {
          include: {
            players: true,
          },
        },
        matches: {
          include: {
            homeTeam: true,
            awayTeam: true,
          },
        },
      },
    });

    if (!tournament) {
      return NextResponse.json(
        { error: 'Tournament not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Failed to fetch tournament:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

// DELETE /api/tournaments/[id] - Delete tournament
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related records first (cascade delete)
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
    console.error('Failed to delete tournament:', error);
    return NextResponse.json(
      { error: 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}

// PATCH /api/tournaments/[id] - Update tournament
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const tournament = await prisma.tournament.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Failed to update tournament:', error);
    return NextResponse.json(
      { error: 'Failed to update tournament' },
      { status: 500 }
    );
  }
}