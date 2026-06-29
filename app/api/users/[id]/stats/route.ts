import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const targetPlayerId = parseInt(id);

    if (isNaN(targetPlayerId)) {
      return NextResponse.json({ error: "Invalid player ID" }, { status: 400 });
    }

    // Find the player record
    const player = await prisma.player.findFirst({
      where: { playerId: targetPlayerId },
    });

    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Get all deliveries where this player was striker
    const strikerDeliveries = await prisma.inningDelivery.findMany({
      where: { strikerId: player.id },
      include: {
        match: {
          include: {
            tournament: { select: { id: true, name: true } },
            homeTeam: { select: { id: true, shortName: true } },
            awayTeam: { select: { id: true, shortName: true } },
          },
        },
      },
    });

    // Get all deliveries where this player was bowler
    const bowlerDeliveries = await prisma.inningDelivery.findMany({
      where: { bowlerId: player.id },
      include: {
        match: {
          include: {
            tournament: { select: { id: true, name: true } },
            homeTeam: { select: { id: true, shortName: true } },
            awayTeam: { select: { id: true, shortName: true } },
          },
        },
      },
    });

    // Calculate batting stats
    let totalRuns = 0;
    let totalBallsFaced = 0;
    let totalFours = 0;
    let totalSixes = 0;
    let timesOut = 0;
    let highestScore = 0;
    const matchesSet = new Set<string>();

    // Group by match for per-match stats
    const matchBattingStats: Record<string, { runs: number; balls: number; fours: number; sixes: number; out: boolean }> = {};

    for (const delivery of strikerDeliveries) {
      const matchId = delivery.matchId;
      matchesSet.add(matchId);

      if (!matchBattingStats[matchId]) {
        matchBattingStats[matchId] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
      }

      const runs = delivery.runs;
      totalRuns += runs;
      matchBattingStats[matchId].runs += runs;

      if (delivery.isLegalDelivery) {
        totalBallsFaced++;
        matchBattingStats[matchId].balls++;
      }

      if (runs === 4) {
        totalFours++;
        matchBattingStats[matchId].fours++;
      }
      if (runs === 6) {
        totalSixes++;
        matchBattingStats[matchId].sixes++;
      }

      if (delivery.isWicket && delivery.strikerId === player.id) {
        timesOut++;
        matchBattingStats[matchId].out = true;
      }
    }

    // Calculate highest score
    for (const stats of Object.values(matchBattingStats)) {
      if (stats.runs > highestScore) {
        highestScore = stats.runs;
      }
    }

    // Calculate bowling stats
    let totalWickets = 0;
    let totalRunsConceded = 0;
    let totalBallsBowled = 0;
    let totalOversBowled = 0;
    let bestWickets = 0;
    let bestRuns = Infinity;
    const matchBowlingStats: Record<string, { wickets: number; runs: number; balls: number }> = {};

    for (const delivery of bowlerDeliveries) {
      const matchId = delivery.matchId;
      matchesSet.add(matchId);

      if (!matchBowlingStats[matchId]) {
        matchBowlingStats[matchId] = { wickets: 0, runs: 0, balls: 0 };
      }

      const runs = delivery.runs + delivery.extras;
      totalRunsConceded += runs;
      matchBowlingStats[matchId].runs += runs;

      if (delivery.isLegalDelivery) {
        totalBallsBowled++;
        matchBowlingStats[matchId].balls++;
      }

      if (delivery.isWicket) {
        totalWickets++;
        matchBowlingStats[matchId].wickets++;
      }
    }

    // Calculate best bowling
    for (const stats of Object.values(matchBowlingStats)) {
      if (stats.wickets > bestWickets || (stats.wickets === bestWickets && stats.runs < bestRuns)) {
        bestWickets = stats.wickets;
        bestRuns = stats.runs;
      }
    }

    totalOversBowled = Math.floor(totalBallsBowled / 6) + (totalBallsBowled % 6) * 0.1;

    // Calculate averages and rates
    const matchesPlayed = matchesSet.size;
    const battingAverage = timesOut > 0 ? totalRuns / timesOut : totalRuns;
    const strikeRate = totalBallsFaced > 0 ? (totalRuns / totalBallsFaced) * 100 : 0;
    const economyRate = totalOversBowled > 0 ? totalRunsConceded / totalOversBowled : 0;

    // Get unique tournaments
    const tournaments = new Set<string>();
    for (const delivery of strikerDeliveries) {
      tournaments.add(delivery.match.tournamentId);
    }
    for (const delivery of bowlerDeliveries) {
      tournaments.add(delivery.match.tournamentId);
    }

    return NextResponse.json({
      player: {
        id: player.id,
        name: player.name,
        role: player.role,
        isCaptain: player.isCaptain,
        playerId: player.playerId,
      },
      summary: {
        matchesPlayed,
        tournamentsPlayed: tournaments.size,
      },
      batting: {
        totalRuns,
        totalBallsFaced,
        totalFours,
        totalSixes,
        timesOut,
        highestScore,
        average: Number(battingAverage.toFixed(2)),
        strikeRate: Number(strikeRate.toFixed(2)),
      },
      bowling: {
        totalWickets,
        totalRunsConceded,
        totalBallsBowled,
        totalOversBowled: Number(totalOversBowled.toFixed(1)),
        economyRate: Number(economyRate.toFixed(2)),
        bestBowling: bestWickets > 0 ? `${bestWickets}/${bestRuns}` : "N/A",
      },
      perMatchBatting: Object.entries(matchBattingStats).map(([matchId, stats]) => {
        const delivery = strikerDeliveries.find(d => d.matchId === matchId);
        return {
          matchId,
          tournament: delivery?.match.tournament.name || "Unknown",
          runs: stats.runs,
          balls: stats.balls,
          fours: stats.fours,
          sixes: stats.sixes,
          notOut: !stats.out,
        };
      }),
      perMatchBowling: Object.entries(matchBowlingStats).map(([matchId, stats]) => {
        const delivery = bowlerDeliveries.find(d => d.matchId === matchId);
        return {
          matchId,
          tournament: delivery?.match.tournament.name || "Unknown",
          wickets: stats.wickets,
          runs: stats.runs,
          overs: Math.floor(stats.balls / 6) + (stats.balls % 6) * 0.1,
        };
      }),
    });
  } catch (error) {
    console.error("[PLAYER_STATS_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}