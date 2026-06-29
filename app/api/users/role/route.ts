import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { jwtVerify } from 'jose';

async function getUserIdFromNextAuth(req: NextRequest): Promise<string | null> {
  const sessionToken = req.cookies.get('next-auth.session-token')?.value
    || req.cookies.get('__Secure-next-auth.session-token')?.value;

  if (!sessionToken) return null;

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    const { payload } = await jwtVerify(
      sessionToken,
      new TextEncoder().encode(secret)
    );

    return (payload.id as string) || null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Try custom auth first (from middleware headers)
    const auth = await requireAuth(req);
    let userId: string | null = null;

    if (auth instanceof NextResponse) {
      // Custom auth failed, try next-auth fallback
      userId = await getUserIdFromNextAuth(req);
      if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      userId = auth.userId;
    }

    const { role } = await req.json();

    // Only allow upgrading to HOST via this endpoint
    const allowedRoles = ['HOST'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        playerId: true,
      },
    });

    return NextResponse.json({ user: updatedUser, role: updatedUser.role });
  } catch (error) {
    console.error('[USER_ROLE_UPDATE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
