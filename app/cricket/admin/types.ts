export type AdminStep = 'LOGIN' | 'CREATE_TOURNAMENT' | 'CREATE_TEAMS' | 'SCHEDULE_MATCH' | 'PRE_MATCH' | 'LIVE_MATCH';

export type Player = { id: string; name: string; role: string; isCaptain: boolean; playerId: number };
export type Team = { id: string; name: string; shortName: string; players: Player[] };
export type Match = { id: string; teamA: Team; teamB: Team; date: string; status: string };
