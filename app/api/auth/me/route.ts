import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id");
    const userRole = req.headers.get("x-user-role");
    const email = req.headers.get("x-user-email");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        playerId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("[AUTH_ME_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}