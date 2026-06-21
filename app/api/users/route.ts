import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        gender: true,
        playerId: true,
        sessions: {
          select: {
            id: true,
            expiresAt: true
          },
          orderBy: {
            expiresAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        playerId: 'asc'
      }
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('[USERS_GET_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}