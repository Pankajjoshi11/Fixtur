import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { name, email, age, gender } = await req.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if email is being changed and if it's already taken
    if (email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });

      if (emailTaken) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
      }
    }

    // Update user (excluding password)
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        age: Number(age),
        gender
      },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        gender: true,
        playerId: true
      }
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('[USER_UPDATE_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}