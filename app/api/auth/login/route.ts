import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const alg = "HS256";

  const session = await new SignJWT({ userId: user.id, email: user.email })
    .setProtectedHeader({ alg })
    .setExpirationTime("24h")
    .setSubject(user.id)
    .sign(secret);

  cookies().set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  return NextResponse.json({ message: "Login successful", playerId: user.playerId, userId: user.id, email: user.email });
}
