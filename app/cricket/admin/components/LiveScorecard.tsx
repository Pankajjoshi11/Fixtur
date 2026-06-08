import React, { useMemo } from 'react';
import { DeliveryEvent } from '@/store/useScoringStore';
import { Team } from '../types';

interface LiveScorecardProps {
  deliveries: DeliveryEvent[];
  battingTeam: Team | null;
  bowlingTeam: Team | null;
  currentStrikerId: string | null;
  currentNonStrikerId: string | null;
}

export default function LiveScorecard({ deliveries, battingTeam, bowlingTeam, currentStrikerId, currentNonStrikerId }: LiveScorecardProps) {
  
  const getPlayerName = (id: string, team: Team | null) => {
    return team?.players.find(p => p.id === id)?.name || 'Unknown';
  };

  const battingStats = useMemo(() => {
    if (!battingTeam) return [];
    
    // Track who has batted
    const battedIds = new Set<string>();
    if (currentStrikerId) battedIds.add(currentStrikerId);
    if (currentNonStrikerId) battedIds.add(currentNonStrikerId);
    deliveries.forEach(d => {
      battedIds.add(d.strikerId);
      battedIds.add(d.nonStrikerId);
    });

    const stats = Array.from(battedIds).map(id => {
      const playerDeliveries = deliveries.filter(d => d.strikerId === id);
      
      const runs = playerDeliveries.reduce((sum, d) => sum + d.runs, 0);
      const balls = playerDeliveries.filter(d => d.extraType !== 'WIDE').length;
      const fours = playerDeliveries.filter(d => d.runs === 4).length;
      const sixes = playerDeliveries.filter(d => d.runs === 6).length;
      const sr = balls > 0 ? ((runs / balls) * 100).toFixed(2) : '0.00';

      let status = 'not out';
      const wicketDelivery = deliveries.find(d => d.strikerId === id && d.isWicket); // assuming striker is the one who gets out
      
      if (wicketDelivery) {
        status = `b ${getPlayerName(wicketDelivery.bowlerId, bowlingTeam)}`;
      } else if (id !== currentStrikerId && id !== currentNonStrikerId) {
        // Technically if they are not the current striker/non-striker and don't have a wicket delivery, 
        // they might be retired hurt, but in our basic flow, a wicket replaces them.
        status = 'out'; 
      }

      return {
        id,
        name: getPlayerName(id, battingTeam),
        status,
        runs,
        balls,
        fours,
        sixes,
        sr
      };
    });

    return stats;
  }, [deliveries, battingTeam, bowlingTeam, currentStrikerId, currentNonStrikerId]);

  const bowlingStats = useMemo(() => {
    if (!bowlingTeam) return [];
    
    const bowledIds = new Set<string>();
    deliveries.forEach(d => bowledIds.add(d.bowlerId));

    const stats = Array.from(bowledIds).map(id => {
      const playerDeliveries = deliveries.filter(d => d.bowlerId === id);
      
      const legalBalls = playerDeliveries.filter(d => d.isLegalDelivery).length;
      const overs = Math.floor(legalBalls / 6);
      const remainingBalls = legalBalls % 6;
      const oversString = `${overs}.${remainingBalls}`;

      const runs = playerDeliveries.reduce((sum, d) => {
        let deliveryRuns = d.runs;
        if (d.extraType === 'WIDE' || d.extraType === 'NO_BALL') {
          deliveryRuns += d.extras;
        }
        return sum + deliveryRuns;
      }, 0);

      // In this basic app, all recorded wickets (like CAUGHT) go to the bowler.
      const wickets = playerDeliveries.filter(d => d.isWicket).length;
      
      const econ = legalBalls > 0 ? ((runs / legalBalls) * 6).toFixed(2) : '0.00';

      return {
        id,
        name: getPlayerName(id, bowlingTeam),
        overs: oversString,
        maidens: 0, // Simplified: not calculating maidens accurately here
        runs,
        wickets,
        econ
      };
    });

    return stats;
  }, [deliveries, bowlingTeam]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-lg mt-6">
      {/* BATTING SCORECARD */}
      <div className="p-4 bg-zinc-950/50 border-b border-zinc-800">
        <h3 className="text-lg font-bold text-slate-200">Batting</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 bg-zinc-900/80 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Batter</th>
              <th className="px-4 py-3 font-medium"></th>
              <th className="px-4 py-3 font-medium text-right">R</th>
              <th className="px-4 py-3 font-medium text-right">B</th>
              <th className="px-4 py-3 font-medium text-right">4s</th>
              <th className="px-4 py-3 font-medium text-right">6s</th>
              <th className="px-4 py-3 font-medium text-right">SR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {battingStats.map((batter) => (
              <tr key={batter.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-200">
                  {batter.name} 
                  {batter.status === 'not out' && <span className="text-emerald-400 ml-1">*</span>}
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">{batter.status}</td>
                <td className="px-4 py-3 text-right font-bold">{batter.runs}</td>
                <td className="px-4 py-3 text-right">{batter.balls}</td>
                <td className="px-4 py-3 text-right">{batter.fours}</td>
                <td className="px-4 py-3 text-right">{batter.sixes}</td>
                <td className="px-4 py-3 text-right">{batter.sr}</td>
              </tr>
            ))}
            {battingStats.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-4 text-center text-slate-500">No batting data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* BOWLING SCORECARD */}
      <div className="p-4 bg-zinc-950/50 border-y border-zinc-800 mt-4">
        <h3 className="text-lg font-bold text-slate-200">Bowling</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs text-slate-400 bg-zinc-900/80 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Bowler</th>
              <th className="px-4 py-3 font-medium text-right">O</th>
              <th className="px-4 py-3 font-medium text-right">M</th>
              <th className="px-4 py-3 font-medium text-right">R</th>
              <th className="px-4 py-3 font-medium text-right">W</th>
              <th className="px-4 py-3 font-medium text-right">ECON</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {bowlingStats.map((bowler) => (
              <tr key={bowler.id} className="hover:bg-zinc-800/30 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-200">{bowler.name}</td>
                <td className="px-4 py-3 text-right">{bowler.overs}</td>
                <td className="px-4 py-3 text-right">{bowler.maidens}</td>
                <td className="px-4 py-3 text-right font-bold">{bowler.runs}</td>
                <td className="px-4 py-3 text-right font-bold text-emerald-400">{bowler.wickets}</td>
                <td className="px-4 py-3 text-right">{bowler.econ}</td>
              </tr>
            ))}
            {bowlingStats.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-slate-500">No bowling data available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}