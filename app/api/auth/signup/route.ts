import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

function generatePlayerId(): number {
  return Math.floor(10000 + Math.random() * 90000); // 10000–99999
}

async function generateUniquePlayerId(): Promise<number> {
  for (let attempts = 0; attempts < 10; attempts++) {
    const candidate = generatePlayerId();
    const existing = await prisma.user.findUnique({
      where: { playerId: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error("Could not generate a unique playerId after multiple attempts");
}

export async function POST(req: Request) {
  try {
    const { name, age, gender, email, password } = await req.json();

    if (!name || !age || !gender || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const playerId = await generateUniquePlayerId();

    const user = await prisma.user.create({
      data: {
        name,
        age: Number(age),
        gender,
        email,
        password: hashedPassword,
        playerId,
      },
    });

    return NextResponse.json({ playerId: user.playerId }, { status: 201 });

  } catch (error: any) {
    console.error("Signup error details:", error);

    if (error.code === 'P2002') {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}