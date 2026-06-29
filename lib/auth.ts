import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export type Role = "USER" | "HOST" | "SUPER_ADMIN";

export interface AuthContext {
  userId: string;
  userRole: Role;
  email: string;
}

export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const userId = req.headers.get("x-user-id");
  const userRole = req.headers.get("x-user-role") as Role;
  const email = req.headers.get("x-user-email");

  if (!userId || !userRole) {
    return null;
  }

  return { userId, userRole, email: email || "" };
}

export async function requireAuth(req: NextRequest): Promise<AuthContext | NextResponse> {
  const auth = await getAuthContext(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return auth;
}

export async function requireRole(
  req: NextRequest,
  allowedRoles: Role[]
): Promise<AuthContext | NextResponse> {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  if (!allowedRoles.includes(auth.userRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return auth;
}

export async function requireHostOrAdmin(req: NextRequest): Promise<AuthContext | NextResponse> {
  return requireRole(req, ["HOST", "SUPER_ADMIN"]);
}

export async function requireSuperAdmin(req: NextRequest): Promise<AuthContext | NextResponse> {
  return requireRole(req, ["SUPER_ADMIN"]);
}

export async function requireTournamentAccess(
  req: NextRequest,
  tournamentId: string
): Promise<(AuthContext & { tournament: any }) | NextResponse> {
  const auth = await requireHostOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  // Host can only access their own tournaments
  // Super Admin can access all
  if (auth.userRole === "HOST" && tournament.organizerId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { ...auth, tournament };
}

export async function requireMatchAccess(
  req: NextRequest,
  matchId: string
): Promise<(AuthContext & { match: any }) | NextResponse> {
  const auth = await requireHostOrAdmin(req);
  if (auth instanceof NextResponse) return auth;

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { tournament: true },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  // Host can only access matches in their own tournaments
  // Super Admin can access all
  if (auth.userRole === "HOST" && match.tournament.organizerId !== auth.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { ...auth, match };
}