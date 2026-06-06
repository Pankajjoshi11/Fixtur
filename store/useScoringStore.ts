import { create } from 'zustand';

// Type definitions for the complex state
export type DeliveryEvent = {
  id: string;
  runs: number;
  extras: number;
  extraType?: 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE';
  isWicket: boolean;
  wicketType?: 'BOWLED' | 'CAUGHT' | 'RUN_OUT' | 'STUMPED';
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  isLegalDelivery: boolean;
  inning: number;
};

interface ScoringState {
  matchId: string | null;
  currentInning: 1 | 2;
  totalRuns: number;
  totalWickets: number;
  overs: number; // e.g., 4.2 represented as 4 overs, 2 balls
  ballsInCurrentOver: number;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  targetScore: number | null;
  
  meta?: {
    teamA?: string;
    teamB?: string;
    tournament?: string;
    strikerName?: string;
    nonStrikerName?: string;
    bowlerName?: string;
  };
  
  // The crucial History Stack for the Undo functionality
  deliveryHistory: DeliveryEvent[];
  
  // Actions
  initializeMatch: (matchId: string) => void;
  recordDelivery: (delivery: Omit<DeliveryEvent, 'id' | 'inning'>) => void;
  undoLastDelivery: () => void;
  rotateStrike: () => void;
  setStateOverride: (newState: Partial<ScoringState>) => void;
  switchInnings: () => void;
}

export const useScoringStore = create<ScoringState>((set, get) => ({
  matchId: null,
  currentInning: 1,
  totalRuns: 0,
  totalWickets: 0,
  overs: 0,
  ballsInCurrentOver: 0,
  strikerId: null,
  nonStrikerId: null,
  bowlerId: null,
  targetScore: null,
  deliveryHistory: [],

  setStateOverride: (newState) => set((state) => ({ ...state, ...newState })),

  initializeMatch: (matchId) => set({ 
    matchId, 
    currentInning: 1, 
    targetScore: null,
    totalRuns: 0,
    totalWickets: 0,
    overs: 0,
    ballsInCurrentOver: 0,
    deliveryHistory: []
  }),

  switchInnings: () => set((state) => ({
    currentInning: 2,
    targetScore: state.totalRuns + 1,
    totalRuns: 0,
    totalWickets: 0,
    overs: 0,
    ballsInCurrentOver: 0,
    strikerId: null,
    nonStrikerId: null,
    bowlerId: null,
  })),

  recordDelivery: (deliveryPayload) => set((state) => {
    const newDelivery: DeliveryEvent = {
      ...deliveryPayload,
      id: crypto.randomUUID(), // Or generate specific ID
      inning: state.currentInning,
    };

    let newTotalRuns = state.totalRuns + deliveryPayload.runs + deliveryPayload.extras;
    let newTotalWickets = state.totalWickets + (deliveryPayload.isWicket ? 1 : 0);
    
    let newBallsInOver = state.ballsInCurrentOver;
    let newOvers = state.overs;

    // Freeze ball count on Wide or No-ball
    if (deliveryPayload.isLegalDelivery) {
      newBallsInOver += 1;
      if (newBallsInOver === 6) {
        newOvers += 1;
        newBallsInOver = 0;
        // Logic to trigger "End of Over" modal would be emitted here or reacted to in UI
      }
    }

    // Auto-rotate strike on odd runs (1, 3)
    let newStriker = state.strikerId;
    let newNonStriker = state.nonStrikerId;
    if (deliveryPayload.runs % 2 !== 0) {
      newStriker = state.nonStrikerId;
      newNonStriker = state.strikerId;
    }

    // Also rotate on end of over
    if (newBallsInOver === 0 && deliveryPayload.isLegalDelivery) {
        const temp = newStriker;
        newStriker = newNonStriker;
        newNonStriker = temp;
    }

    return {
      totalRuns: newTotalRuns,
      totalWickets: newTotalWickets,
      ballsInCurrentOver: newBallsInOver,
      overs: newOvers,
      strikerId: newStriker,
      nonStrikerId: newNonStriker,
      deliveryHistory: [...state.deliveryHistory, newDelivery],
    };
  }),

  undoLastDelivery: () => set((state) => {
    if (state.deliveryHistory.length === 0) return state;

    const historyCopy = [...state.deliveryHistory];
    const lastDelivery = historyCopy.pop(); // Pop the last delivery from the stack

    if (!lastDelivery) return state;
    
    // Do not allow undoing across innings
    if (lastDelivery.inning !== state.currentInning) {
      return state;
    }

    // Reverse the state calculations
    let revertedTotalRuns = state.totalRuns - (lastDelivery.runs + lastDelivery.extras);
    let revertedTotalWickets = state.totalWickets - (lastDelivery.isWicket ? 1 : 0);
    
    let revertedBallsInOver = state.ballsInCurrentOver;
    let revertedOvers = state.overs;

    if (lastDelivery.isLegalDelivery) {
      if (revertedBallsInOver === 0) {
        revertedOvers -= 1;
        revertedBallsInOver = 5;
      } else {
        revertedBallsInOver -= 1;
      }
    }

    // Restore batsmen to their exact positions before this delivery
    // Note: A truly robust system would snapshot the striker/non-striker state per delivery
    // For this architecture, we revert based on the lastDelivery's recorded strikers.
    
    return {
      totalRuns: revertedTotalRuns,
      totalWickets: revertedTotalWickets,
      overs: revertedOvers,
      ballsInCurrentOver: revertedBallsInOver,
      strikerId: lastDelivery.strikerId,
      nonStrikerId: lastDelivery.nonStrikerId,
      deliveryHistory: historyCopy,
    };
  }),

  rotateStrike: () => set((state) => ({
    strikerId: state.nonStrikerId,
    nonStrikerId: state.strikerId
  }))
}));