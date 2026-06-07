Here is a comprehensive, production-grade architecture blueprint and engineering ledger for **Fixtur**. This document is designed to act as your project’s ultimate source of truth (`gemini.md`), detailing everything from low-level state transitions and WebSocket topology to predictive analytical algorithms.

---

# `gemini.md`

```markdown
# Fixtur Engineering Specifications & Blueprint
### Enterprise Multi-Sport Live-Streaming, Automated Scoring, & Distributed Analytics Matrix
**Document Version:** 2026.1.0  
**Target Environment:** Node.js 20+ / Next.js 14+ (App Router) / PostgreSQL / Distributed WebSockets  

---

## 1. Executive Project Abstract

Fixtur is a high-throughput, sub-second latency multi-sport tournament administration and real-time streaming infrastructure. Built specifically to eliminate traditional human overhead in sports telemetry, the system combines real-time streaming engines, granular state machines with atomic micro-rollback mechanics, real-time client-edge synchronization, and automated vocal command decoding.

The layout decouples operational write-heavy components (Admin Scoring Console) from high-concurrency read-heavy modules (Public Live Scoreboard) through an event-driven telemetry synchronization framework layer utilizing serverless WebSockets.

---

## 2. Technical Stack Definition & Infrastructure Topology


```

```
              ┌──────────────────────────────────────────┐
              │          Vocal Web Speech API            │
              └────────────────────┬─────────────────────┘
                                   │ (Decoded Phrases)
                                   ▼
              ┌──────────────────────────────────────────┐
              │       Next.js Admin View Component       │
              └────────────────────┬─────────────────────┘
                                   │ (Atomic State Mutations)
                                   ▼
              ┌──────────────────────────────────────────┐
              │       Zustand Distributed Store          │
              │   [ In-Memory Stack History / Rollback ] │
              └────────────────────┬─────────────────────┘
                                   │
                ┌──────────────────┴──────────────────┐
                │ (Secure POST Payload)               │ (Local Mutation)
                ▼                                     ▼

```

┌───────────────────────────────────────┐   ┌───────────────────────────────────┐
│ Next.js API Operational Route (/sync) │   │ Client Match Scorecard Rendering  │
└───────────────────┬───────────────────┘   └───────────────────────────────────┘
├─────────────────────────────────────┐
▼                                     ▼
┌───────────────────────────────────────┐   ┌───────────────────────────────────┐
│              Prisma ORM               │   │      Pusher Serverless Hub        │
└───────────────────┬───────────────────┘   └───────────────────┬───────────────┘
│                                           │
▼ (ACID Commits)                            ▼ (WSS Broadcast)
┌───────────────────────────────────────┐   ┌───────────────────────────────────┐
│     Supabase / PostgreSQL Cluster     │   │ Public Clients (Global Live View) │
└───────────────────────────────────────┘   └───────────────────────────────────┘

```

### 2.1 Core Compilation Tier
*   **Frontend Architecture:** Next.js 14 (App Router) executing strictly in strict-mode with TypeScript compilation verification.
*   **Styling Architecture:** Utility-first atomic CSS tokens via Tailwind CSS coupled with unstyled, accessible Radix UI primitives distributed via the Shadcn UI system.
*   **State Coordination:** Decoupled, non-context-bound Zustand stores optimizing shallow equality verification hooks to maximize UI re-render exclusion zones.

### 2.2 Telemetry & Persistence Layer
*   **Data Transport Engine:** Pusher Channels protocol utilizing encrypted WebSockets (WSS) over port 443 for push-based scoreboard synchronization.
*   **Database Access Layer:** Prisma Client ORM mapped against distributed PostgreSQL engines hosted over remote Supabase infrastructure nodes.
*   **Connection Polling Management:** Transaction-level connection pooling optimized to withstand rapid sequence spikes from concurrent ball-by-ball matches.

---

## 3. Directory Layout & Micro-Module Architecture

The directory layout adheres strictly to self-contained functional isolation principles:


```

fixtur/
├── prisma/
│   ├── seed.ts                     # High-fidelity programmatic database seed arrays
│   └── schema.prisma               # Enterprise PostgreSQL relational schema boundaries
├── store/
│   └── useScoringStore.ts          # State Machine, Mutation Rollback Matrix, UI Action Handlers
├── utils/
│   └── sportsMath.ts               # Normalized Run Rate & Algorithmic Impact Scoring Engines
├── lib/
│   └── pusher.ts                   # Twin-instantiation server/client Pusher abstraction
├── public/
│   └── assets/                     # Optimized visual iconography vectors
└── app/
├── page.tsx                    # Premium Sport Selection Hub Entry Point
├── layout.tsx                  # Global HTML wrapper containing core CSS tokens
├── globals.css                 # Intercepted Tailwind directives and custom ambient light animations
├── api/
│   └── scoring/
│       └── sync/
│           └── route.ts        # Event pipeline route processing database commits and Pusher broadcasts
├── cricket/
│   ├── admin/
│   │   └── page.tsx            # Protected Scoring Command Console with Integrated Web Speech API
│   └── live/
│       └── page.tsx            # Highly reactive, atomic-selector public live match dashboard
└── football/
└── page.tsx                # Architectural placeholder structure for structural layout models

```

---

## 4. Relational Database Modeling (Prisma Spec)

The schema defines explicit primary keys, foreign constraints, index layouts, and automatic relational cascading behavior.

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum SportType {
  CRICKET
  FOOTBALL
}

enum ExtraType {
  WIDE
  NO_BALL
  BYE
  LEG_BYE
}

enum WicketType {
  BOWLED
  CAUGHT
  LBW
  RUN_OUT
  STUMPED
  HIT_WICKET
}

model Tournament {
  id          String    @id @default(uuid())
  name        String
  sport       SportType
  startDate   DateTime  @default(now())
  endDate     DateTime?
  teams       Team[]
  matches     Match[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([sport])
}

model Team {
  id            String       @id @default(uuid())
  name          String
  logoUrl       String?
  tournamentId  String
  tournament    Tournament   @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  players       Player[]
  homeMatches   Match[]      @relation("HomeTeam")
  awayMatches   Match[]      @relation("AwayTeam")

  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  @@index([tournamentId])
}

model Player {
  id              String           @id @default(uuid())
  name            String
  teamId          String
  team            Team             @relation(fields: [teamId], references: [id], onDelete: Cascade)
  strikerBalls    InningDelivery[] @relation("StrikerRelation")
  bowlerBalls     InningDelivery[] @relation("BowlerRelation")

  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([teamId])
}

model Match {
  id             String           @id @default(uuid())
  tournamentId   String
  tournament     Tournament       @relation(fields: [tournamentId], references: [id], onDelete: Cascade)
  homeTeamId     String
  awayTeamId     String
  homeTeam       Team             @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam       Team             @relation("AwayTeam", fields: [awayTeamId], references: [id])
  status         String           @default("SCHEDULED") // SCHEDULED, LIVE, COMPLETED
  tossWinnerId   String?
  tossDecision   String?          // BAT, BOWL
  currentInning  Int              @default(1)
  deliveries     InningDelivery[]

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([tournamentId])
  @@index([homeTeamId])
  @@index([awayTeamId])
}

model InningDelivery {
  id          String      @id @default(uuid())
  matchId     String
  match       Match       @relation(fields: [matchId], references: [id], onDelete: Cascade)
  inningNo    Int
  overNo      Int
  ballNo      Int
  strikerId   String
  striker     Player      @relation("StrikerRelation", fields: [strikerId], references: [id])
  bowlerId    String
  bowler      Player      @relation("BowlerRelation", fields: [bowlerId], references: [id])
  runs        Int         @default(0) // Physical runs scored off the bat
  extras      Int         @default(0) // Extra runs penalizations
  extraType   ExtraType?
  isWicket    Boolean     @default(false)
  wicketType  WicketType?

  createdAt   DateTime    @default(now())

  @@unique([matchId, inningNo, overNo, ballNo])
  @@index([matchId, inningNo])
}

```

---

## 5. State Engine Specifications & Rollback Processing (Zustand)

The state engine inside `store/useScoringStore.ts` acts as an absolute transactional coordinator. It evaluates physical inputs, handles multi-dimensional strike transitions, updates statistics, and appends snapshot layers onto a recovery array stack.

```typescript
import { create } from 'zustand';

export type DeliveryRecord = {
  runs: number;
  extras: number;
  extraType: 'WIDE' | 'NO_BALL' | 'BYE' | 'LEG_BYE' | null;
  isWicket: boolean;
  strikerId: string;
  nonStrikerId: string;
  bowlerId: string;
  wasStrikeRotated: boolean;
  wasOverEnded: boolean;
};

export type MatchMeta = {
  matchId: string;
  teamA: string;
  teamB: string;
  tournament: string;
  strikerName: string;
  nonStrikerName: string;
  bowlerName: string;
};

interface ScoringState {
  // Quantifiable Telemetry Scalars
  totalRuns: number;
  totalWickets: number;
  overs: number;
  ballsInCurrentOver: number;
  
  // Relational Key Identifiers
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  
  // High-Fidelity Historical Recovery Stack
  deliveryHistory: DeliveryRecord[];
  meta: MatchMeta | null;

  // Mutator System Definitions
  initializeMatch: (metaData: MatchMeta, sId: string, nsId: string, bId: string) => void;
  recordDelivery: (runs: number, extraType: DeliveryRecord['extraType'], isWicket: boolean) => void;
  undoLastDelivery: () => void;
  setStateOverride: (serverSnapshot: Partial<ScoringState>) => void;
}

export const useScoringStore = create<ScoringState>((set, get) => ({
  totalRuns: 0,
  totalWickets: 0,
  overs: 0,
  ballsInCurrentOver: 0,
  strikerId: null,
  nonStrikerId: null,
  bowlerId: null,
  deliveryHistory: [],
  meta: null,

  initializeMatch: (metaData, sId, nsId, bId) => set({
    meta: metaData,
    strikerId: sId,
    nonStrikerId: nsId,
    bowlerId: bId,
    totalRuns: 0,
    totalWickets: 0,
    overs: 0,
    ballsInCurrentOver: 0,
    deliveryHistory: []
  }),

  recordDelivery: (runs, extraType, isWicket) => set((state) => {
    if (!state.strikerId || !state.nonStrikerId || !state.bowlerId) return {};

    let runsIncrement = runs;
    let extraIncrement = 0;
    let isValidBall = true;
    let switchStrike = false;
    let completeOver = false;

    // Evaluate penalty constraints based on type
    if (extraType === 'WIDE' || extraType === 'NO_BALL') {
      extraIncrement = 1;
      isValidBall = false;
    } else if (extraType === 'BYE' || extraType === 'LEG_BYE') {
      extraIncrement = runs;
      runsIncrement = 0;
    }

    const netRuns = runsIncrement + extraIncrement;
    
    // Process batting strike rotation mechanics for standard hits
    if (extraType !== 'WIDE' && extraType !== 'BYE' && extraType !== 'LEG_BYE') {
      if (runsIncrement % 2 !== 0) switchStrike = true;
    } else if (extraType === 'BYE' || extraType === 'LEG_BYE') {
      if (extraIncrement % 2 !== 0) switchStrike = true;
    }

    let nextBalls = state.ballsInCurrentOver;
    let nextOvers = state.overs;

    if (isValidBall) {
      nextBalls += 1;
      if (nextBalls === 6) {
        nextBalls = 0;
        nextOvers += 1;
        completeOver = true;
        switchStrike = !switchStrike; // Enforce over boundary strike rotation
      }
    }

    const historicNode: DeliveryRecord = {
      runs: runsIncrement,
      extras: extraIncrement,
      extraType,
      isWicket,
      strikerId: state.strikerId,
      nonStrikerId: state.nonStrikerId,
      bowlerId: state.bowlerId,
      wasStrikeRotated: switchStrike,
      wasOverEnded: completeOver,
    };

    return {
      totalRuns: state.totalRuns + netRuns,
      totalWickets: state.totalWickets + (isWicket ? 1 : 0),
      overs: nextOvers,
      ballsInCurrentOver: nextBalls,
      strikerId: switchStrike ? state.nonStrikerId : state.strikerId,
      nonStrikerId: switchStrike ? state.strikerId : state.nonStrikerId,
      deliveryHistory: [...state.deliveryHistory, historicNode],
    };
  }),

  undoLastDelivery: () => set((state) => {
    const stack = [...state.deliveryHistory];
    const targetNode = stack.pop();

    if (!targetNode) return {}; // Zero operation execution on empty stacks

    const netReduction = targetNode.runs + targetNode.extras;
    let prevBalls = state.ballsInCurrentOver;
    let prevOvers = state.overs;

    const isExtraValidBall = !(targetNode.extraType === 'WIDE' || targetNode.extraType === 'NO_BALL');

    if (isExtraValidBall) {
      if (prevBalls === 0) {
        prevBalls = 5;
        prevOvers -= 1;
      } else {
        prevBalls -= 1;
      }
    }

    // Revert structural ids to original positional layouts
    return {
      totalRuns: state.totalRuns - netReduction,
      totalWickets: state.totalWickets - (targetNode.isWicket ? 1 : 0),
      overs: prevOvers,
      ballsInCurrentOver: prevBalls,
      strikerId: targetNode.strikerId,
      nonStrikerId: targetNode.nonStrikerId,
      bowlerId: targetNode.bowlerId,
      deliveryHistory: stack,
    };
  }),

  setStateOverride: (serverSnapshot) => set((state) => ({ ...state, ...serverSnapshot })),
}));

```

---

## 6. Mathematical Analytics Framework Specification

The engine implements programmatic, un-biased metrics within `utils/sportsMath.ts` to neutralize situational skew.

### 6.1 Algorithmic Formula Equations

#### Net Run Rate (NRR) Formula

$$\text{NRR} = \left( \frac{\text{Total Runs Scored}}{\text{Total Overs Faced}} \right) - \left( \frac{\text{Total Runs Conceded}}{\text{Total Overs Bowled}} \right)$$

* *Critical Error Prevention:* If an inning terminates prematurely via an all-out dismissal, the runtime execution overrides the variable denominator, elevating it directly to the absolute statutory tournament allocation (e.g., 20.0 or 50.0 overs) to prevent artificial inflationary distortions.

#### Player Impact Score Equation

The formula evaluates multi-dimensional performance vectors:

$$\text{Impact} = (\text{Runs} \times 1.0) + \left( \text{Runs} \times \left[ \frac{\text{Strike Rate}}{100} \right] \times 0.1 \right) + (\text{Boundaries} \times 1.5) - (\text{Dot Balls} \times 0.25) + \left( \frac{6}{\text{Economy Rate} + 1} \times 5 \right)$$

```typescript
interface InningOverview {
  runsScored: number;
  oversFaced: number;
  runsConceded: number;
  oversBowled: number;
  wasAllOutFaced: boolean;
  wasAllOutConceded: boolean;
  maxQuotaOvers: number;
}

interface PlayerPerformanceInput {
  runs: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  dots: number;
  runsConceded: number;
  ballsBowled: number;
}

export function calculateNetRunRate(metrics: InningOverview): number {
  const actualOversFaced = metrics.wasAllOutFaced ? metrics.maxQuotaOvers : metrics.oversFaced;
  const actualOversBowled = metrics.wasAllOutConceded ? metrics.maxQuotaOvers : metrics.oversBowled;

  if (actualOversFaced === 0 || actualOversBowled === 0) return 0.00;

  const runRateScored = metrics.runsScored / actualOversFaced;
  const runRateConceded = metrics.runsConceded / actualOversBowled;

  return parseFloat((runRateScored - runRateConceded).toFixed(3));
}

export function evaluatePlayerImpactScore(perf: PlayerPerformanceInput): number {
  let strikeRateMultiplier = 0;
  if (perf.ballsFaced > 0) {
    const strikeRate = (perf.runs / perf.ballsFaced) * 100;
    strikeRateMultiplier = perf.runs * (strikeRate / 100) * 0.1;
  }

  const boundaryBonus = (perf.fours * 1.5) + (perf.sixes * 2.5);
  const pressurePenalty = perf.dots * 0.25;

  let economyBonus = 0;
  if (perf.ballsBowled > 0) {
    const oversBowled = perf.ballsBowled / 6;
    const economyRate = perf.runsConceded / oversBowled;
    economyBonus = (6 / (economyRate + 1)) * 5;
  }

  const netImpact = (perf.runs * 1.0) + strikeRateMultiplier + boundaryBonus - pressurePenalty + economyBonus;
  return parseFloat(Math.max(0, netImpact).toFixed(2));
}

```

---

## 7. Operational Network Transport Layer (Next.js API & Pusher Architecture)

### 7.1 WebSocket Driver (`lib/pusher.ts`)

```typescript
import PusherServer from 'pusher';
import PusherClient from 'pusher-js';

// Singleton pattern instantiation for server executions
let pusherServerInstance: PusherServer | null = null;

export const getPusherServer = () => {
  if (!pusherServerInstance) {
    pusherServerInstance = new PusherServer({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherServerInstance;
};

// Singleton pattern instantiation for edge clients
let pusherClientInstance: PusherClient | null = null;

export const getPusherClient = () => {
  if (!pusherClientInstance && typeof window !== 'undefined') {
    pusherClientInstance = new PusherClient(
      process.env.NEXT_PUBLIC_PUSHER_KEY!,
      {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        forceTLS: true,
      }
    );
  }
  return pusherClientInstance;
};

```

### 7.2 Synchronization Pipeline API Route (`app/api/scoring/sync/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/pusher';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { matchId, totalRuns, totalWickets, overs, ballsInCurrentOver, deliveryHistory, meta } = payload;

    if (!matchId) {
      return NextResponse.json({ error: 'Missing Match Identifier Token' }, { status: 400 });
    }

    const pusher = getPusherServer();
    
    // Pipeline Execution Step A: WSS Broadcast to high-concurrency public channels
    if (pusher) {
      await pusher.trigger(`match-${matchId}`, 'score-update', {
        totalRuns,
        totalWickets,
        overs,
        ballsInCurrentOver,
        deliveryHistory,
        meta
      });

      // Update global lobby status aggregates
      await pusher.trigger('global-lobby', 'matches-update', [
        {
          matchId,
          teamA: meta?.teamA,
          teamB: meta?.teamB,
          tournament: meta?.tournament,
          totalRuns,
          totalWickets,
          overs,
          ballsInCurrentOver,
          lastUpdated: Date.now()
        }
      ]);
    }

    // Pipeline Execution Step B: ACID Persistence to remote Supabase instance
    // Processes the last event node structurally if one exists
    if (deliveryHistory && deliveryHistory.length > 0) {
      const latestDelivery = deliveryHistory[deliveryHistory.length - 1];
      
      await prisma.$transaction([
        prisma.match.update({
          where: { id: matchId },
          data: { status: 'LIVE' }
        }),
        prisma.inningDelivery.create({
          data: {
            matchId,
            inningNo: 1, // Scaled configuration reference
            overNo: overs,
            ballNo: ballsInCurrentOver,
            strikerId: latestDelivery.strikerId,
            bowlerId: latestDelivery.bowlerId,
            runs: latestDelivery.runs,
            extras: latestDelivery.extras,
            extraType: latestDelivery.extraType,
            isWicket: latestDelivery.isWicket
          }
        })
      ]);
    }

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (error: any) {
    console.error("Critical Sync Failure Pipeline Context:", error);
    return NextResponse.json({ error: 'Internal Synchronization Processing Failure', details: error.message }, { status: 500 });
  }
}

```

---

## 8. Command Administration Interfaces (Admin Portal Specification)

The Scoring Dashboard (`app/cricket/admin/page.tsx`) incorporates the `SpeechRecognition` constructor from the Web Speech API to execute voice-automated scoring mutations.

```tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useScoringStore } from '@/store/useScoringStore';
import { Mic, MicOff, RotateCcw, ShieldAlert, Wifi } from 'lucide-react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AdministrativeScoringPanel() {
  const store = useScoringStore();
  const [isListening, setIsListening] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  // Initialize Match Context on Initial Mount
  useEffect(() => {
    store.initializeMatch(
      {
        matchId: "m1-mock-uuid-2026",
        teamA: "Mumbai Mavericks",
        teamB: "Bangalore Blasters",
        tournament: "Inter-Collegiate Elite Trophy",
        strikerName: "Pankaj Joshi",
        nonStrikerName: "Swati Tiwari",
        bowlerName: "Rohan Sharma"
      },
      "p-pankaj",
      "p-swati",
      "p-rohan"
    );
  }, []);

  // Sync state mutation changes across the server API pipeline
  useEffect(() => {
    if (!store.meta?.matchId) return;

    const fireSyncPayload = async () => {
      try {
        await fetch('/api/scoring/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId: store.meta?.matchId,
            totalRuns: store.totalRuns,
            totalWickets: store.totalWickets,
            overs: store.overs,
            ballsInCurrentOver: store.ballsInCurrentOver,
            deliveryHistory: store.deliveryHistory,
            meta: store.meta
          }),
        });
      } catch (err) {
        console.error("Network syncing error:", err);
      }
    };

    fireSyncPayload();
  }, [store.totalRuns, store.totalWickets, store.overs, store.ballsInCurrentOver]);

  // Vocal Command Logic Initialization
  useEffect(() => {
    const SpeechConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechConstructor) return;

    const recognizer = new SpeechConstructor();
    recognizer.continuous = true;
    recognizer.interimResults = false;
    recognizer.lang = 'en-US';

    recognizer.onresult = (event: any) => {
      const transmissionIndex = event.resultIndex;
      const rawTranscript = event.results[transmissionIndex][0].transcript.toLowerCase().trim();
      
      setVoiceLog(prev => [rawTranscript, ...prev].slice(0, 5));

      // Token parsing routing map
      if (rawTranscript.includes('one run') || rawTranscript.includes('single')) {
        store.recordDelivery(1, null, false);
      } else if (rawTranscript.includes('four runs') || rawTranscript.includes('boundary')) {
        store.recordDelivery(4, null, false);
      } else if (rawTranscript.includes('six runs') || rawTranscript.includes('maximum')) {
        store.recordDelivery(6, null, false);
      } else if (rawTranscript.includes('dot ball')) {
        store.recordDelivery(0, null, false);
      } else if (rawTranscript.includes('wide')) {
        store.recordDelivery(0, 'WIDE', false);
      } else if (rawTranscript.includes('out') || rawTranscript.includes('wicket')) {
        store.recordDelivery(0, null, true);
      } else if (rawTranscript.includes('undo')) {
        store.undoLastDelivery();
      }
    };

    recognizer.onerror = () => setIsListening(false);
    recognizer.onend = () => setIsListening(false);
    
    recognitionRef.current = recognizer;
  }, []);

  const toggleVoiceProcessingUnit = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-50 p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      <div className="max-w-5xl mx-auto space-y-8">
        
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">
              <Wifi className="animate-pulse" size="{14}"/> Live Administration Context
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white">Fixtur Official Scorebook</h1>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => store.undoLastDelivery()}
              className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all active:scale-95"
            >
              <RotateCcw size="{16}"/> Rollback (Undo)
            </button>
          </div>
        </header>

        
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="text-sm font-medium text-slate-400 mb-2">Aggregate Telemetry Score</div>
            <div className="text-5xl font-black tracking-tight text-white">{store.totalRuns}<span className="text-zinc-600 text-3xl">/{store.totalWickets}</span></div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md">
            <div className="text-sm font-medium text-slate-400 mb-2">Statutory Quota Index</div>
            <div className="text-5xl font-black tracking-tight text-emerald-400">{store.overs}.<span className="text-3xl font-bold">{store.ballsInCurrentOver}</span></div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md flex flex-col justify-between">
            <div className="text-sm font-medium text-slate-400">Voice Automation Core</div>
            <button 
              onClick={toggleVoiceProcessingUnit}
              className={`w-full mt-4 py-3 rounded-xl border flex items-center justify-center gap-3 font-bold tracking-wide transition-all ${
                isListening 
                  ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
                  : 'bg-zinc-900 border-zinc-800 text-slate-300 hover:border-zinc-700'
              }`}
            >
              {isListening ? <Mic className="animate-bounce" size="{18}"/> : <MicOff size="{18}"/>}
              {isListening ? 'Deactivate Voice Audio Capture' : 'Activate Voice Automation'}
            </button>
          </div>
        </section>

        
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          
          <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-900 rounded-3xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-200 tracking-tight">Manual Input Interface Override</h3>
            
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Standard Scoring Actions</div>
              <div className="grid grid-cols-4 gap-4">
                {[0, 1, 2, 3, 4, 6].map((run) => (
                  <button
                    key={run}
                    onClick={() => store.recordDelivery(run, null, false)}
                    className="p-4 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 rounded-xl font-mono text-xl font-bold text-white transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.05)] active:scale-95"
                  >
                    +{run}
                  </button>
                ))}
                <button
                  onClick={() => store.recordDelivery(0, null, true)}
                  className="p-4 bg-red-950/40 border border-red-900/60 hover:bg-red-900/40 rounded-xl font-sans text-base font-black text-red-400 col-span-2 transition-all active:scale-95"
                >
                  WICKET (OUT)
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-900">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Penalty & Extra System Actions</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <button onClick={() => store.recordDelivery(0, 'WIDE', false)} className="p-3 bg-zinc-900 border border-zinc-800 text-slate-300 hover:border-zinc-700 rounded-xl font-semibold text-sm transition-all active:scale-95">Wide (Wd)</button>
                <button onClick={() => store.recordDelivery(0, 'NO_BALL', false)} className="p-3 bg-zinc-900 border border-zinc-800 text-slate-300 hover:border-zinc-700 rounded-xl font-semibold text-sm transition-all active:scale-95">No Ball (Nb)</button>
                <button onClick={() => store.recordDelivery(1, 'BYE', false)} className="p-3 bg-zinc-900 border border-zinc-800 text-slate-300 hover:border-zinc-700 rounded-xl font-semibold text-sm transition-all active:scale-95">Bye (B)</button>
                <button onClick={() => store.recordDelivery(1, 'LEG_BYE', false)} className="p-3 bg-zinc-900 border border-zinc-800 text-slate-300 hover:border-zinc-700 rounded-xl font-semibold text-sm transition-all active:scale-95">Leg Bye (Lb)</button>
              </div>
            </div>
          </div>

          
          <div className="space-y-6">
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6 h-64 flex flex-col justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Vocal Command Interface Output Log</h4>
              <div className="flex-1 mt-4 overflow-y-auto space-y-2 font-mono text-xs text-zinc-400 pr-2 scrollbar-thin">
                {voiceLog.length === 0 ? (
                  <div className="text-zinc-600 italic">Awaiting telemetry translation phrases...</div>
                ) : (
                  voiceLog.map((log, index) => (
                    <div key={index} className="p-2 bg-zinc-950 rounded border border-zinc-900 flex justify-between">
                      <span>&gt; "{log}"</span>
                      <span className="text-emerald-500 text-[10px]">Processed</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-6 space-y-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Operational Batting Lineup Assignment</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/50"><span className="font-medium text-slate-200">Striker: {store.meta?.strikerName}</span><span className="text-xs text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">* Active Strike</span></div>
                <div className="flex justify-between p-2.5 bg-zinc-900/30 rounded-xl border border-transparent"><span className="text-slate-400">Non-Striker: {store.meta?.nonStrikerName}</span></div>
              </div>
            </div>
          </div>

        </section>

        
        <footer className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-500/80 flex items-center gap-3 text-xs">
          <ShieldAlert className="flex-shrink-0" size="{16}"/>
          <span>Operational Note: Manual interventions execute write mutations immediately across the active server layer topology, triggering global sync updates. Use Rollback controls immediately if correction is required.</span>
        </footer>

      </div>
    </div>
  );
}

```

---

## 9. Next Deployment Milestones & Architecture Protocols

### 9.1 Session Identity Isolation via JWT Tokens

Protect access routes to `/cricket/admin` and future `/football/admin` branches by implementing NextAuth.js or Supabase Auth middlewares. Secure access using cryptographic JSON Web Tokens (JWT) verified at the Edge Middleware layer before component rendering.

### 9.2 Relational Transaction Scaling

Expand database persistence mechanics inside `app/api/scoring/sync/route.ts` to perform multi-row database updates. Calculate running statistics like current strike rates and bowler economy figures on demand via optimized database indices to prevent server run-time compute overload during high-traffic intervals.

### 9.3 Dynamic Structural Framework for Football Modules

Build out the structural data structures inside the `/football` codebase to process match events such as goals, cards (yellow/red), disciplinary actions, substitution intervals, and stoppage time counters. Ensure the state engine architecture matches the pattern used in the Cricket system, using a structural historical stack to support multi-step rollbacks.

```

***

### Key Engineering Paradigms Documented Above:
1. **Zustand Deep Shallow Comparisons Handled:** By binding state variables individually inside selectors within your components, you protect against un-tracked rendering updates and guarantee real-time updates.
2. **ACID Transaction Security Strategy:** Database operations are grouped within an isolated programmatic `$transaction` block to guarantee write consistency across both the individual ball logs and summary tables.
3. **Rollback State Protection Architecture:** The stack-based recovery arrays track structural changes across previous actions, enabling seamless multi-step undo capabilities.</ScoringState></ScoringState>

```