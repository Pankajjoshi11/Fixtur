/**
 * Calculates Net Run Rate (NRR).
 * NRR = (Total Runs Scored / Total Overs Faced) - (Total Runs Conceded / Total Overs Bowled)
 * Edge Case Protection: If a team is bowled out early, the denominator defaults to the full match quota.
 */
export function calculateNRR(
  runsScored: number,
  oversFaced: number,
  wicketsLost: number,
  runsConceded: number,
  oversBowled: number,
  wicketsTaken: number,
  matchOversQuota: number = 20.0
): number {
  // Edge case: Bowled out before full quota
  const effectiveOversFaced = wicketsLost >= 10 ? matchOversQuota : oversFaced;
  const effectiveOversBowled = wicketsTaken >= 10 ? matchOversQuota : oversBowled;

  // Convert overs (e.g., 19.3) to mathematical decimal (19 + 3/6 = 19.5)
  const calculateDecimalOvers = (overs: number) => {
    const completeOvers = Math.floor(overs);
    const balls = (overs - completeOvers) * 10; // Extract the decimal part as balls
    return completeOvers + (balls / 6);
  };

  const decimalOversFaced = calculateDecimalOvers(effectiveOversFaced);
  const decimalOversBowled = calculateDecimalOvers(effectiveOversBowled);

  // Prevent division by zero
  const runRateScored = decimalOversFaced > 0 ? runsScored / decimalOversFaced : 0;
  const runRateConceded = decimalOversBowled > 0 ? runsConceded / decimalOversBowled : 0;

  return Number((runRateScored - runRateConceded).toFixed(3));
}

/**
 * Calculates Unbiased Player Performance Impact Rating.
 * Normalizes scores to prevent top-order bias.
 */
interface BattingStats {
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  isMatchWinningKnock?: boolean; // Contextual bonus
}

interface BowlingStats {
  wickets: number;
  runsConceded: number;
  oversBowled: number; // Format: 4.0
  dotBalls: number;
}

export function calculatePlayerImpact(
  matchesPlayed: number,
  battingStats: BattingStats,
  bowlingStats: BowlingStats
): number {
  if (matchesPlayed === 0) return 0;

  // --- Batting Impact ---
  // (Runs Scored * Strike Rate Weight) + (Boundary Ratio Bonus) + (Contextual Match-Winning Tally)
  let battingImpact = 0;
  if (battingStats.ballsFaced > 0) {
    const strikeRate = (battingStats.runs / battingStats.ballsFaced) * 100;
    // Weight SR: >150 is highly rewarded, <100 is penalized
    const srWeight = strikeRate > 150 ? 1.5 : (strikeRate < 100 ? 0.8 : 1.0);
    
    const boundaryRuns = (battingStats.fours * 4) + (battingStats.sixes * 6);
    const boundaryBonus = boundaryRuns * 0.5; // Bonus for boundaries
    
    const contextualBonus = battingStats.isMatchWinningKnock ? 50 : 0;

    battingImpact = (battingStats.runs * srWeight) + boundaryBonus + contextualBonus;
  }

  // --- Bowling Impact ---
  // (Wickets Taken * Economy Rate Inverse Weight) + (Dot Ball Percentage Tally)
  let bowlingImpact = 0;
  if (bowlingStats.oversBowled > 0) {
    const completeOvers = Math.floor(bowlingStats.oversBowled);
    const balls = (bowlingStats.oversBowled - completeOvers) * 10;
    const totalBallsBowled = (completeOvers * 6) + balls;
    const decimalOvers = completeOvers + (balls / 6);

    const economyRate = bowlingStats.runsConceded / decimalOvers;
    // Inverse Weight ER: <6 is highly rewarded, >10 is penalized
    const erWeight = economyRate < 6 ? 1.5 : (economyRate > 10 ? 0.8 : 1.2);
    
    // Wickets are heavily weighted
    const wicketImpact = bowlingStats.wickets * 25 * erWeight;
    
    // Dot ball pressure
    const dotBallPercentage = (bowlingStats.dotBalls / totalBallsBowled) * 100;
    const dotBallBonus = dotBallPercentage * 0.5;

    bowlingImpact = wicketImpact + dotBallBonus;
  }

  // Normalize by dividing cumulative impact points by total matches
  const totalImpact = battingImpact + bowlingImpact;
  return Number((totalImpact / matchesPlayed).toFixed(2));
}