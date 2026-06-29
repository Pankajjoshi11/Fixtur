import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/auth";

// GET /api/admin/stats - Get admin dashboard stats
export async function GET(req: NextRequest) {
  try {
    const auth = await requireSuperAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const [totalUsers, totalHosts, totalSuperAdmins, totalTournaments, totalMatches, totalPlayers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "HOST" } }),
      prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
      prisma.tournament.count(),
      prisma.match.count(),
      prisma.player.count(),
    ]);

    return NextResponse.json({
      totalUsers,
      totalHosts,
      totalSuperAdmins,
      totalTournaments,
      totalMatches,
      totalPlayers,
    });
  } catch (error) {
    console.error("[ADMIN_STATS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}