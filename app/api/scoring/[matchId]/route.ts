import { NextResponse } from 'next/server';
import { matchStates } from '@/lib/store';

export async function GET(
  req: Request,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = params.matchId;
    
    if (!matchId) {
      return new NextResponse("Match ID is required", { status: 400 });
    }

    const matchData = matchStates.get(matchId);

    if (!matchData) {
      return new NextResponse("Match not found", { status: 404 });
    }

    return NextResponse.json(matchData);
  } catch (error) {
    console.error('[MATCH_GET_ERROR]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
