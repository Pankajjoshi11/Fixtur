import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 });
    }

    const playerIdNum = parseInt(playerId);
    
    if (isNaN(playerIdNum)) {
      return NextResponse.json({ error: 'Invalid Player ID format' }, { status: 400 });
    }

    // Check if user with this playerId exists
    const user = await prisma.user.findUnique({
      where: { playerId: playerIdNum },
      select: { id: true, name: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ valid: false, message: 'No registered user found with this Player ID' });
    }

    return NextResponse.json({ 
      valid: true, 
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('[PLAYER_VALIDATE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}