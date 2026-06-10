# Fixtur Engineering Specifications & Blueprint
### Enterprise Multi-Sport Live-Streaming, Automated Scoring, & Distributed Analytics Matrix
**Document Version:** 2026.1.1  
**Target Environment:** Node.js 20+ / Next.js 14+ (App Router) / PostgreSQL / Distributed WebSockets  

---

## 1. Executive Project Abstract

Fixtur is a high-throughput, sub-second latency multi-sport tournament administration and real-time streaming infrastructure. Built specifically to eliminate traditional human overhead in sports telemetry, the system combines real-time streaming engines, granular state machines with atomic micro-rollback mechanics, real-time client-edge synchronization, and automated vocal command decoding.

The layout decouples operational write-heavy components (Admin Scoring Console) from high-concurrency read-heavy modules (Public Live Scoreboard) through an event-driven telemetry synchronization framework layer utilizing serverless WebSockets.

---

## 2. Technical Stack Definition & Infrastructure Topology

```text
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

```text
fixtur/
├── prisma/
│   └── schema.prisma               # Enterprise PostgreSQL relational schema boundaries
├── store/
│   └── useScoringStore.ts          # State Machine logic, Mutation Rollback Matrix, Action Handlers
├── utils/
│   └── sportsMath.ts               # Algorithmic Impact Scoring & Rate Calculations Logic
├── lib/
│   ├── pusher.ts                   # WSS Server/Client connection handlers
│   └── store.ts                    # In-memory application store for active matches
└── app/
    ├── page.tsx                    # Premium Sport Selection Hub Entry Point
    ├── layout.tsx                  # Global HTML wrapper containing core CSS tokens
    ├── globals.css                 # Intercepted Tailwind directives and custom ambient light animations
    ├── api/
    │   └── scoring/
    │       ├── sync/
    │       │   └── route.ts        # Event pipeline processing network synchronization and DB commit logic
    │       └── [matchId]/
    │           └── route.ts        # Direct match polling route
    └── cricket/
        ├── admin/
        │   ├── page.tsx            # Protected Scoring Command Console
        │   └── components/
        │       └── LiveMatchStep.tsx # Interactive Live Match Controller with Voice Engine logic
        └── live/
            └── page.tsx            # Public live match dashboard
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

enum Sport {
  CRICKET
  FOOTBALL
}

enum MatchStatus {
  SCHEDULED
  LIVE
  COMPLETED
  ABANDONED
}

model Tournament {
  id        String   @id @default(cuid())
  name      String
  sport     Sport
  location  String?
  format    String?
  numberOfOvers Int?
  startDate DateTime
  endDate   DateTime?
  matches   Match[]
  teams     Team[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Team {
  id           String      @id @default(cuid())
  name         String
  shortName    String
  logoUrl      String?
  tournament   Tournament  @relation(fields: [tournamentId], references: [id])
  tournamentId String
  players      Player[]
  homeMatches  Match[]     @relation("HomeTeam")
  awayMatches  Match[]     @relation("AwayTeam")
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Player {
  id           String      @id @default(cuid())
  name         String
  role         String?     // e.g., Batsman, Bowler, All-rounder
  isCaptain    Boolean     @default(false)
  team         Team        @relation(fields: [teamId], references: [id])
  teamId       String
  deliveriesBatted  InningDelivery[] @relation("Batsman")
  deliveriesBowled  InningDelivery[] @relation("Bowler")
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model Match {
  id           String      @id @default(cuid())
  title        String?     // e.g., "Final", "Match 1"
  status       MatchStatus @default(SCHEDULED)
  sport        Sport
  tournament   Tournament  @relation(fields: [tournamentId], references: [id])
  tournamentId String
  homeTeam     Team        @relation("HomeTeam", fields: [homeTeamId], references: [id])
  homeTeamId   String
  awayTeam     Team        @relation("AwayTeam", fields: [awayTeamId], references: [id])
  awayTeamId   String
  tossWinnerId String?
  tossDecision String?     // e.g., "BAT", "BOWL"
  deliveries   InningDelivery[]
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}

model InningDelivery {
  id           String   @id @default(cuid())
  match        Match    @relation(fields: [matchId], references: [id])
  matchId      String
  inning       Int      // 1 or 2
  overNumber   Int      // e.g., 0 for first over
  ballNumber   Int      // 1 to 6 (or more if extras)
  batsman      Player   @relation("Batsman", fields: [batsmanId], references: [id])
  batsmanId    String
  bowler       Player   @relation("Bowler", fields: [bowlerId], references: [id])
  bowlerId     String
  runsBat      Int      @default(0) // Runs off the bat
  extras       Int      @default(0)
  extraType    String?  // "WIDE", "NO_BALL", "BYE", "LEG_BYE"
  isWicket     Boolean  @default(false)
  wicketType   String?  // "BOWLED", "CAUGHT", "RUN_OUT", etc.
  timestamp    DateTime @default(now())
}
```

---

## 5. State Engine Specifications & Rollback Processing (Zustand)

The state engine inside `store/useScoringStore.ts` acts as an absolute transactional coordinator for scoring match progression.

### 5.1 Architecture Logic of State Machine

The store is constructed around the fundamental entities of a live match session: runs, wickets, overs, current active players on the crease (striker and non-striker), current bowler, and a historical stack of deliveries.

- **Match Initialization Logic:** When a match starts, the engine assigns metadata, zeroes out tracking variables, and allocates a fresh delivery history array.
- **Inning Transition Logic:** Switching innings establishes the target score (total runs of the first inning + 1), advances the `currentInning` counter, and resets deliveries, over counters, and individual striker/bowler identifiers.
- **Delivery Recording Logic:** This is the core mutation sequence:
  1. Captures physical runs, extras, and wicket status.
  2. Aggregates the runs to the grand total.
  3. Increments total wickets if the ball denotes a dismissal.
  4. Evaluates if the ball is a legal delivery. If valid, `ballsInCurrentOver` increments.
  5. If `ballsInCurrentOver` hits exactly 6, it triggers an over completion: balls reset to 0, and `overs` counter increments.
  6. Analyzes the run amount to automatically enforce strike rotation (i.e., odd runs switch striker and non-striker).
  7. Checks for an end of over (0 balls counted, but a valid delivery was just completed). When true, the strike automatically rotates for the next over.
  8. Pushes the constructed delivery payload onto the `deliveryHistory` stack for historical immutability.
- **Micro-Rollback / Undo Logic:** Protects against scoring misclicks or automated voice transcription errors:
  1. Validates the history stack length to prevent underflows.
  2. Protects against cross-inning undo actions; an undo can only revert states within the *current active inning*.
  3. Pops the top delivery from the history stack.
  4. Subtracts the recorded runs and extras from the total score.
  5. Reverts wicket totals if the reversed delivery was a dismissal.
  6. Reverses ball/over counters appropriately—if rolling back a valid ball when current balls is 0, it decrements the total overs and sets current balls to 5.
  7. Most critically, restores the exact positional alignment of the striker and non-striker to what they were *before* the delivery was recorded.
- **Strike Rotation Logic:** A dedicated mutator to manually swap the active striker and non-striker without recording a delivery.

---

## 6. Mathematical Analytics Framework Specification

The engine implements programmatic, un-biased metrics within `utils/sportsMath.ts` to neutralize situational skew.

### 6.1 Algorithmic Formula Equations

#### Net Run Rate (NRR) Logic

Net Run Rate provides tournament tie-breaking calculations by evaluating total runs scored relative to total overs faced, against total runs conceded relative to total overs bowled.

- **Fractional Over Conversion:** The logic normalizes overs from standard cricket notation (e.g., `19.3` meaning 19 overs and 3 balls) into decimal mathematics (19 + 3/6 = 19.5).
- **Edge Case Protection:** If a team is bowled out (loses all 10 wickets) before completing their allocated overs, the denominator defaults directly to the maximum match quota (e.g., 20.0). This prevents artificial inflation of run rates for teams that score quickly but get dismissed early.

#### Player Impact Score Logic

The `calculatePlayerImpact` algorithm provides a holistic impact score per player that accounts for match context, mitigating top-order batsman bias.

- **Batting Impact Normalization:**
  - Starts with the pure runs scored and calculates the strike rate (runs per hundred balls).
  - Employs a weighting matrix: Strike rates over 150 receive a 1.5x multiplier, while sluggish strike rates under 100 are penalized with a 0.8x weight.
  - Adds raw point bonuses for boundaries (fours and sixes) to value aggression.
  - Grants a massive static 50-point contextual bonus if the knock is flagged as a match-winning performance.
- **Bowling Impact Normalization:**
  - Converts overs into pure balls bowled and decimal format for precision.
  - Derives the economy rate and applies an inverse weighting system: An economy rate under 6.0 generates a 1.5x multiplier, while rates over 10.0 are penalized heavily (0.8x weight).
  - Wickets form the core of the metric, rewarding 25 base points per wicket, deeply amplified by the economy rate weight.
  - Dot balls introduce a 'pressure building' metric, factoring the dot ball percentage into a linear bonus.
- **Final Output:** The aggregate total impact points from both batting and bowling are averaged against total matches played, producing a per-match impact rating rounded to two decimal places.

---

## 7. Operational Network Transport Layer (Next.js API & Pusher Architecture)

### 7.1 WebSocket Driver Logic

The connection layer (`lib/pusher.ts`) establishes singleton abstractions for both server and edge client Pusher instantiations, guaranteeing connections remain stable and efficient over encrypted TLS sockets via pre-defined clusters.

### 7.2 Synchronization Pipeline API Logic (`app/api/scoring/sync/route.ts`)

This route handles high-frequency state synchronization from admin consoles down to public clients via a secure POST architecture.

- **Payload Validation:** Extracts match identifiers and detailed state payloads. It aggressively rejects malformed inputs lacking IDs or states to protect data integrity.
- **In-Memory Store Updates:** 
  - Writes a localized summary record to the `activeMatches` Map, providing lightweight lobby listings for global users.
  - Writes the complete, high-fidelity state payload into the `matchStates` Map for robust state polling if a client disconnects from the WebSocket.
- **WSS Event Triggering:** 
  - Dispatches the complete state packet instantly onto the specific match channel (e.g., `match-<matchId>`). Public viewers subscribed to this channel receive sub-second score updates over the WebSocket.
  - Triggers a secondary 'global-lobby' event to notify system-wide observers of changing match aggregates.
- **Error Handling:** Catch blocks intercept network failures, log them structurally, and return clean 500 status codes without exposing internal credentials.

---

## 8. Command Administration Interfaces (Admin Portal Specification)

The Scoring Dashboard (`app/cricket/admin/components/LiveMatchStep.tsx`) acts as the command center for operators, processing inputs through manual interfaces and voice decoding arrays.

### 8.1 Live Control Orchestration Logic

- **Continuous Synchronization:** A side-effect logic block continuously monitors score aggregations, over counts, and match histories. On any mutation, it automatically fires the payload to the `/api/scoring/sync` endpoint, ensuring the WSS pipeline stays universally updated.
- **Automated Innings and Match Completion Detection:**
  - Monitors variables actively to detect if `totalWickets` reaches 10, or if `overs` matches the allocated tournament quota.
  - During the first inning, these conditions auto-trigger the "Innings Break" modal logic.
  - During the second inning, the same conditions—or detecting if `totalRuns` surpasses the `targetScore`—trigger match completion states.
- **Over Transition Checkers:** Whenever an over naturally completes (0 balls, with legal deliveries tracked), it suppresses manual scoring interfaces and mandates the admin to assign the *next* bowler before proceeding.
- **Wicket Transition Checkers:** Upon recording a wicket dismissal, a localized modal overlay halts standard inputs, forcing the administrator to explicitly declare the incoming replacement batsman before allowing the state to resume.

### 8.2 Voice Recognition Engine Logic

- **Initialization Phase:** Evaluates the client window for Web Speech API compatibility (`SpeechRecognition` or `webkitSpeechRecognition`).
- **Continuous Listening Mode:** When activated, configures the recognizer for continuous streaming and interim results.
- **Token Decoding Logic:** Processes transcript fragments sequentially. 
  - Standardizes transcripts to lowercase variants.
  - Matches linguistic patterns against hardcoded scoring actions (e.g., hearing 'one run' explicitly triggers the `handleRun(1)` mutator).
  - Interprets dismissal terminology ('out', 'wicket') to fire the exact `handleWicket()` transaction payload.
- **UI State Binding:** Toggles a listening flag to represent active mic usage visually, accompanied by live transcript textual feedback so operators can confirm accurate parsing.

---

## 9. Next Deployment Milestones & Architecture Protocols

### 9.1 Session Identity Isolation via JWT Tokens
Protect access routes to `/cricket/admin` and future `/football/admin` branches by implementing NextAuth.js or Supabase Auth middlewares. Secure access using cryptographic JSON Web Tokens (JWT) verified at the Edge Middleware layer before component rendering.

### 9.2 Relational Transaction Scaling
Expand database persistence mechanics inside `app/api/scoring/sync/route.ts` to perform multi-row database updates. Calculate running statistics like current strike rates and bowler economy figures on demand via optimized database indices to prevent server run-time compute overload during high-traffic intervals.

### 9.3 Dynamic Structural Framework for Football Modules
Build out the structural data structures inside the `/football` codebase to process match events such as goals, cards (yellow/red), disciplinary actions, substitution intervals, and stoppage time counters. Ensure the state engine architecture matches the pattern used in the Cricket system, using a structural historical stack to support multi-step rollbacks.

---

### Key Engineering Paradigms Documented Above:
1. **Zustand Deep Shallow Comparisons Handled:** By binding state variables individually inside selectors within your components, you protect against un-tracked rendering updates and guarantee real-time updates.
2. **ACID Transaction Security Strategy:** Database operations are grouped within an isolated programmatic `$transaction` block to guarantee write consistency across both the individual ball logs and summary tables.
3. **Rollback State Protection Architecture:** The stack-based recovery arrays track structural changes across previous actions, enabling seamless multi-step undo capabilities.