# Fixtur — Multi-Sport Tournament Management & Live-Scoring Platform

## 1. Project Overview

Fixtur is a multi-sport tournament administration and real-time live-scoring web platform. It supports Cricket (fully implemented) and Football (placeholder). The platform decouples the write-heavy Admin Scoring Console from the read-heavy Public Live Scoreboard via an event-driven telemetry sync framework using Pusher WebSockets.

**Theme:** Premium dark UI — deep charcoals (`zinc-950`, `zinc-900`), slate grays, with vibrant emerald and violet accents.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router), TypeScript |
| **Styling** | Tailwind CSS v4, Shadcn UI (Radix UI primitives) |
| **State Management** | Zustand (live scoring with undo stack) |
| **Icons** | Lucide React |
| **Database** | PostgreSQL via Prisma ORM (Supabase hosted) |
| **Real-time** | Pusher Channels (WebSocket) |
| **Auth** | Custom JWT (jose library HS256), httpOnly cookies, bcrypt hashing |
| **File Upload** | xlsx (Excel bulk upload for teams/players) |

---

## 3. Complete Directory Structure & File Functions

```
fixtur/
├── .env                          # Environment: DATABASE_URL, DIRECT_URL, PUSHER_*, JWT_SECRET
├── .gitignore
├── package.json                  # Dependencies & scripts (dev, build, start, lint)
├── package-lock.json
├── tsconfig.json                 # TypeScript config, path alias @/* → ./*
├── tsconfig.tsbuildinfo
├── next-env.d.ts                 # Next.js type declarations
├── global.d.ts                   # Custom type declarations (*.css module)
├── middleware.ts                 # JWT verification middleware, injects x-user-id/x-user-email headers
├── tailwind.config.ts            # Tailwind configuration (content paths, theme)
├── postcss.config.js             # PostCSS config
├── setup.md                      # Deployment & local initialization guide
├── agent.md                      # This file — agent context document
├── gemini.md                     # Engineering specifications & blueprint
│
├── prisma/
│   ├── schema.prisma             # Full database schema (see Section 4)
│   └── schema                    # Alternative schema file (legacy)
│
├── lib/
│   ├── prisma.ts                 # PrismaClient singleton (dev: globalThis cache, prod: new instance)
│   ├── pusher.ts                 # Pusher server (pusherServer) + client (getPusherClient) singletons
│   ├── store.ts                  # In-memory Maps: activeMatches, matchStates (global for hot-reload persistence)
│   └── utils.ts                  # cn() utility — clsx + tailwind-merge
│
├── store/
│   └── useScoringStore.ts        # Zustand store — full state machine (see Section 5.2)
│
├── utils/
│   └── sportsMath.ts             # NRR calculation + Player Impact Score algorithm
│
├── app/
│   ├── layout.tsx                # Root layout — GeistSans/GeistMono fonts, Vercel Analytics
│   ├── page.tsx                  # Landing page — Sport Selection Hub (Cricket card → /cricket/live, Football placeholder)
│   ├── globals.css               # Tailwind v4 import, light/dark theme CSS variables, base styles
│   │
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/route.ts    # POST: verify password → issue JWT cookie → return {playerId, userId, email}
│   │   │   ├── signup/route.ts   # POST: hash password → create User → return {playerId}
│   │   │   └── logout/route.ts   # POST: delete session cookie
│   │   │
│   │   ├── player/
│   │   │   └── validate/route.ts # GET: validate playerId exists in User table — returns {valid, user?}
│   │   │
│   │   ├── scoring/
│   │   │   ├── sync/route.ts     # POST: persist state to DB (Match + InningDelivery), update in-memory store, broadcast Pusher events
│   │   │   │                     # GET: return all active matches for lobby
│   │   │   ├── [matchId]/route.ts # GET: return full match state for direct polling
│   │   │   └── init/route.ts     # POST: validate playerIds → upsert Tournament, Teams, Players, Match in DB when admin starts a match
│   │   │
│   │   ├── tournament/
│   │   │   ├── setup/route.ts    # POST: validate playerIds → bulk upsert tournament + teams + players + matches
│   │   │   └── route.ts          # GET: return all tournaments with status (upcoming/ongoing/completed)
│   │   │
│   │   └── users/
│   │       ├── route.ts          # GET: return all registered users (excluding passwords)
│   │       └── [id]/route.ts     # PUT: update user details (name, email, age, gender) — password excluded
│   │
│   └── cricket/
│       ├── admin/
│       │   ├── page.tsx          # Redirects to /cricket/admin/dashboard
│       │   ├── types.ts          # AdminStep, Player, Team, Match types
│       │   ├── dashboard/
│       │   │   └── page.tsx      # Admin dashboard — tournament list with status, stats cards
│       │   ├── users/
│       │   │   └── page.tsx      # User management — list users, view/edit details (except password)
│       │   └── tournament/
│       │       └── create/
│       │           └── page.tsx  # Full tournament creation wizard (multi-step)
│       │
│       └── live/
│           ├── page.tsx           # Public lobby — renders LiveViewerDashboard (no playerId)
│           ├── [playerId]/page.tsx # Authenticated user view — renders LiveViewerDashboard with playerId
│           ├── LiveViewerDashboard.tsx # Main viewer shell: header + lobby/match-detail routing
│           ├── LobbyDashboard.tsx  # Lists active match cards, subscribes to Pusher global-lobby
│           ├── MatchDetailView.tsx # Full match view: scorecard, batsmen/bowler stats, recent balls, inning tabs
│           ├── AuthButtons.tsx     # Login + Signup links
│           ├── login/page.tsx      # Login form → POST /api/auth/login → redirect to /cricket/live/{playerId}
│           ├── signup/page.tsx     # Signup form → POST /api/auth/signup → alert playerId → redirect to login
│           └── dashboard/page.tsx  # Simple welcome page showing logged-in user email
│
└── components/
    └── ui/                       # Shadcn UI components (Radix primitives)
```

---

## 4. Database Architecture (Prisma Schema)

**Provider:** PostgreSQL (Supabase)
**Connection:** `DATABASE_URL` (transaction pooler port 6543), `DIRECT_URL` (session pooler port 5432 for migrations)

### 4.1 Enums

| Enum | Values |
|---|---|
| `Sport` | `CRICKET`, `FOOTBALL` |
| `MatchStatus` | `SCHEDULED`, `LIVE`, `COMPLETED`, `ABANDONED` |
| `Gender` | `MALE`, `FEMALE`, `OTHER` |

### 4.2 Models

#### Tournament
Tournament entity — `id` (cuid), `name`, `sport` (Sport enum), `location`?, `format`? (T20/ODI/Test), `numberOfOvers`?, `startDate`, `endDate`?, timestamps.
**Relations:** `matches` (Match[]), `teams` (Team[]).

#### Team
Team within a tournament — `id` (cuid), `name`, `shortName`, `logoUrl`?, timestamps.
**Relations:** `tournament` (Tournament), `players` (Player[]), `homeMatches` (Match[] via "HomeTeam"), `awayMatches` (Match[] via "AwayTeam").

#### Player
Player within a team — `id` (cuid), `name`, `role`? (Batsman/Bowler/All-rounder), `isCaptain` (default false), `playerId` (required, unique, references User.playerId), timestamps.
**Relations:** `team` (Team), `deliveriesStruck` (InningDelivery[] via "Striker"), `deliveriesNonStruck` (InningDelivery[] via "NonStriker"), `deliveriesBowled` (InningDelivery[] via "Bowler").

> **Important:** `playerId` is **required** and must correspond to a registered User. This ensures only registered users can participate in tournaments.

#### Match
Match entity — `id` (cuid), `title`?, `status` (MatchStatus, default SCHEDULED), `sport` (Sport), `tossWinnerId`?, `tossDecision`? (BAT/BOWL).
**Live state fields (persisted to DB):** `currentInning` (default 1), `totalRuns` (default 0), `totalWickets` (default 0), `overs` (default 0), `ballsInCurrentOver` (default 0), `firstInningRuns`?, `firstInningWickets`?, `firstInningOvers`?, `firstInningBalls`?, `targetScore`?, `matchVerdict`?, `strikerId`?, `nonStrikerId`?, `bowlerId`?.
**Relations:** `tournament` (Tournament), `homeTeam` (Team via "HomeTeam"), `awayTeam` (Team via "AwayTeam"), `deliveries` (InningDelivery[]).

#### InningDelivery
Ball-by-ball delivery record — `id` (cuid), `inning` (1 or 2), `strikerId`, `nonStrikerId`, `bowlerId`, `runs` (default 0), `extras` (default 0), `extraType`? (WIDE/NO_BALL/BYE/LEG_BYE), `isWicket` (default false), `wicketType`? (BOWLED/CAUGHT/RUN_OUT/STUMPED), `isLegalDelivery` (default true), `timestamp`.
**Relations:** `match` (Match), `striker` (Player via "Striker"), `nonStriker` (Player via "NonStriker"), `bowler` (Player via "Bowler").

#### User
User account — `id` (cuid), `name`, `age`, `gender` (Gender enum), `email` (unique), `password` (bcrypt hashed), `playerId` (unique int, auto-generated 10000-99999).
**Relations:** `sessions` (Session[]).

#### Session
User session — `id` (cuid), `userId`, `expiresAt`.
**Relations:** `user` (User).

---

## 5. Core Architecture

### 5.1 Authentication Flow

1. **Signup** (`POST /api/auth/signup`): Hashes password with bcrypt → generates unique `playerId` (random 5-digit int, checks DB uniqueness) → creates User in DB → returns `{playerId}`.
2. **Login** (`POST /api/auth/login`): Finds user by email → compares password with bcrypt → creates JWT (HS256, 24h expiry, payload: `{userId, email}`) → sets as `httpOnly` cookie named "session" → returns `{message, playerId, userId, email}`.
3. **Logout** (`POST /api/auth/logout`): Deletes the "session" cookie.
4. **Middleware** (`middleware.ts`): On every request, reads "session" cookie → verifies JWT with `jose.jwtVerify` → injects `x-user-id` and `x-user-email` headers into the request. Allows `/api/auth/*`, `/cricket/live/login`, `/cricket/live/signup` to pass through without auth. All other routes pass through regardless (redirects are commented out).

### 5.2 Zustand State Machine (`store/useScoringStore.ts`)

**State fields:**
- `matchId`, `currentInning` (1|2), `totalRuns`, `totalWickets`, `overs`, `ballsInCurrentOver`
- `strikerId`, `nonStrikerId`, `bowlerId`
- `targetScore`, `firstInningScore` ({runs, wickets, overs, balls}), `matchVerdict`
- `meta` ({teamA, teamB, tournament, strikerName, nonStrikerName, bowlerName})
- `deliveryHistory` (DeliveryEvent[] — the undo stack)

**Actions:**
- `initializeMatch(matchId)` — resets all state for a new match
- `recordDelivery(delivery)` — core mutation: adds runs/wickets, increments balls (freezes on Wide/No-ball), auto-rotates strike on odd runs and end-of-over, pushes to deliveryHistory
- `undoLastDelivery()` — pops last delivery, reverses runs/wickets/balls, restores striker/non-striker from the popped record, blocks cross-inning undo
- `rotateStrike()` — swaps striker and non-striker
- `setStateOverride(newState)` — merges partial state (used for Pusher updates and inning transitions)
- `switchInnings()` — sets inning to 2, saves firstInningScore, resets runs/wickets/overs/balls, clears player IDs

**DeliveryEvent type:** `{id, runs, extras, extraType?, isWicket, wicketType?, strikerId, nonStrikerId, bowlerId, isLegalDelivery, inning}`

### 5.3 Real-time Sync Pipeline

```
Admin LiveMatchStep → POST /api/scoring/sync (full state)
  → Prisma: upsert Match state + InningDelivery records (handles undo by diffing IDs)
  → In-memory: update activeMatches Map (lobby summary) + matchStates Map (full state)
  → Pusher: trigger `match-{matchId}` channel with {state, meta, battingTeam, bowlingTeam}
  → Pusher: trigger `global-lobby` channel with activeMatches array
```

**In-memory store** (`lib/store.ts`): Two `Map<string, any>` objects (`activeMatches`, `matchStates`) stored on `global` to survive hot reloads in development.

### 5.4 Pusher Configuration (`lib/pusher.ts`)

- **Server** (`pusherServer`): Used in API routes to trigger events. Configured with `PUSHER_APP_ID`, `NEXT_PUBLIC_PUSHER_KEY`, `PUSHER_SECRET`, `NEXT_PUBLIC_PUSHER_CLUSTER`, TLS enabled.
- **Client** (`getPusherClient`): Returns `PusherClient` instance only on client side (`typeof window !== 'undefined'`), null on server.

---

## 6. Application Flow

### 6.1 Admin Multi-Step Wizard (`app/cricket/admin/page.tsx`)

**Steps:** `LOGIN` → `CREATE_TOURNAMENT` → `CREATE_TEAMS` → `SCHEDULE_MATCH` → `PRE_MATCH` → `LIVE_MATCH`

| Step | Component | Function |
|---|---|---|
| LOGIN | `LoginStep.tsx` | Hardcoded check: `admin@gmail.com` / `admin`. On success, advances to CREATE_TOURNAMENT. |
| CREATE_TOURNAMENT | `CreateTournamentStep.tsx` | Form: name, location, format (T20/ODI/Test), overs. Saves to DB via `/api/tournament/setup`. |
| CREATE_TEAMS | `CreateTeamsStep.tsx` | Manual: add team name/shortName, add players (name, role, captain flag, **required playerId**). Bulk: upload .xlsx with columns TeamName, ShortName, PlayerName, Role, IsCaptain, **PlayerID**. Validates all playerIds against User table before saving. Shows modal with unregistered players if validation fails. |
| SCHEDULE_MATCH | `ScheduleMatchStep.tsx` | Select two teams → create match. Saves via `/api/tournament/setup`. "Start Match" advances to PRE_MATCH. |
| PRE_MATCH | `PreMatchStep.tsx` | Toss winner + decision (BAT/BOWL). Select opening 2 batsmen (from batting team) + 1 bowler (from bowling team). On start: POST `/api/scoring/init` to persist in DB, then initializes Zustand store. |
| LIVE_MATCH | `LiveMatchStep.tsx` | Full scoring console (see 6.2). |

**Types** (`types.ts`):
```typescript
type AdminStep = 'LOGIN' | 'CREATE_TOURNAMENT' | 'CREATE_TEAMS' | 'SCHEDULE_MATCH' | 'PRE_MATCH' | 'LIVE_MATCH';
type Player = { id: string; name: string; role: string; isCaptain: boolean; playerId: number }; // playerId is required
type Team = { id: string; name: string; shortName: string; players: Player[] };
type Match = { id: string; teamA: Team; teamB: Team; date: string; status: string };
```

### 6.2 Live Match Scoring (`LiveMatchStep.tsx`)

**Sync mechanism:** `useEffect` watches `[totalRuns, totalWickets, overs, ballsInCurrentOver, deliveryHistory.length]` — on any change, POSTs full state to `/api/scoring/sync`.

**Manual controls:**
- **Runs pad:** 0, 1, 2, 3, 4, 6 — calls `handleRun(runs)` → `store.recordDelivery({runs, extras:0, isWicket:false, ...})`
- **Extras:** Wide, No Ball, Bye, Leg Bye — calls `handleExtra(type)` → `store.recordDelivery({runs:0, extras:1, extraType:type, ...})` (Bye/LegBye count as legal deliveries)
- **Wicket:** Calls `store.recordDelivery({runs:0, extras:0, isWicket:true, wicketType:'CAUGHT', ...})` then shows Wicket Modal
- **Undo:** `store.undoLastDelivery()`

**Modals (overlay pattern — `absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-sm`):**
- **Wicket Modal:** Select new batsman from batting team (excludes current non-striker and out striker). Confirms via `setStateOverride({strikerId: newBatsmanId})`.
- **Over Completion Modal:** Triggered when `ballsInCurrentOver === 0 && overs > 0`. Select next bowler (excludes current), striker, non-striker. Confirms via `setStateOverride({bowlerId, strikerId, nonStrikerId, meta})`.
- **Innings Break Modal:** Triggered when inning 1 ends (10 wickets or overs completed). Same as over modal but for switching innings. Calls `store.switchInnings()` then sets player IDs.
- **Match Complete Modal:** Triggered when inning 2 ends. Computes verdict (runs/wickets/tied). Shows final score. "Exit to Schedule" button.

**Voice Scoring Engine:**
- Uses Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- Continuous listening mode with interim results
- Phrase matching: "one run" → `handleRun(1)`, "four runs" → `handleRun(4)`, "six runs" → `handleRun(6)`, "out"/"wicket" → `handleWicket()`
- Visual feedback: pulsing blue mic button, live transcript display

**Auto-detection logic (in `useEffect`):**
- `isOverComplete = ballsInCurrentOver === 0 && overs > 0 && deliveryHistory.length > 0`
- `isAllOut = totalWickets >= 10`
- `isOversFinished = overs >= tournament.overs`
- Priority: Match Complete > Innings Break > Over Complete

### 6.3 Public Live Viewer

**Lobby (`LobbyDashboard.tsx`):**
- Fetches active matches from `GET /api/scoring/sync`
- Subscribes to Pusher `global-lobby` channel for real-time updates
- Shows match cards with team names, score, overs, click to view details
- Empty state: "No live matches at the moment"

**Match Detail (`MatchDetailView.tsx`):**
- Fetches initial state from `GET /api/scoring/{matchId}` (full state + meta + teams)
- Subscribes to Pusher `match-{matchId}` channel for live ball-by-ball updates
- Both use `setStateOverride({...serverState, meta})` to update Zustand store
- **Header:** Live/Match Complete badge, team names, score/wickets, overs, target, run rate
- **Batting stats card:** Striker (with *) + Non-Striker, runs (balls)
- **Bowler card:** Current bowler name
- **Recent balls:** Last 6 deliveries as color-coded circles (W=red, Wd/Nb/Lb/B=orange, 4=blue, 6=purple, runs=gray)
- **Inning tabs:** 1st Inning / 2nd Inning (disabled during inning 1), each showing `LiveScorecard` with filtered deliveries

**LiveScorecard (`LiveScorecard.tsx`):**
- Shared component used by both Admin (`LiveMatchStep`) and Viewer (`MatchDetailView`)
- **Batting table:** Batter name, status (not out/out), Runs, Balls, 4s, 6s, SR — computed from deliveryHistory via `useMemo`
- **Bowler table:** Bowler name, Overs, Maidens, Runs, Wickets, ECON — computed from deliveryHistory via `useMemo`

### 6.4 Viewer Dashboard (`LiveViewerDashboard.tsx`)

- Header: Fixtur Live title, Home link, Admin Panel link
- If user is authenticated: profile avatar button (emerald circle with user icon) → click toggles dropdown showing Player ID, Dashboard link, Logout
- If user is not authenticated: Login + Signup links (`AuthButtons.tsx`)
- Content: `LobbyDashboard` (default) or `MatchDetailView` (when a match is selected)

---

## 7. API Routes Summary

| Method | Route | Function |
|---|---|---|
| POST | `/api/auth/signup` | Create user with hashed password, return playerId |
| POST | `/api/auth/login` | Verify credentials, issue JWT cookie, return {playerId, userId, email} |
| POST | `/api/auth/logout` | Delete session cookie |
| GET | `/api/player/validate?playerId=XXXXX` | Validate playerId exists in User table — returns {valid: boolean, user?: {id, name, email}} |
| GET | `/api/tournaments` | Return all tournaments with computed status (upcoming/ongoing/completed) and stats |
| POST | `/api/tournament/setup` | Validate all playerIds → bulk upsert tournament + teams + players + matches |
| GET | `/api/users` | Return all registered users (excluding passwords) |
| PUT | `/api/users/[id]` | Update user details (name, email, age, gender) — password excluded |
| POST | `/api/scoring/init` | Validate all playerIds → upsert tournament/teams/players/match when admin starts match |
| POST | `/api/scoring/sync` | Persist full state to DB, update in-memory store, broadcast Pusher |
| GET | `/api/scoring/sync` | Return all active matches (lobby listing) |
| GET | `/api/scoring/[matchId]` | Return full match state for direct polling |

---

## 8. Environment Variables (`.env`)

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL via Supabase transaction pooler (port 6543, pgbouncer) |
| `DIRECT_URL` | PostgreSQL via Supabase session pooler (port 5432, for migrations) |
| `PUSHER_APP_ID` | Pusher Channels app ID |
| `NEXT_PUBLIC_PUSHER_KEY` | Pusher public key (client-side) |
| `PUSHER_SECRET` | Pusher secret key (server-side) |
| `NEXT_PUBLIC_PUSHER_CLUSTER` | Pusher cluster (ap2) |
| `JWT_SECRET` | HS256 secret for JWT signing/verification |

---

## 9. Key Design Decisions & Patterns

1. **Undo via snapshot:** Each delivery records the striker/non-striker IDs at that moment. Undo restores these exact IDs, ensuring correct positional state.
2. **In-memory + DB dual-write:** The sync API writes to both Prisma (persistent) and in-memory Maps (fast lobby access). Pusher broadcasts happen after both writes.
3. **Delivery sync strategy:** On every sync, the API deletes all InningDelivery records for the match not in the current array, then re-inserts the current array. This handles undo seamlessly.
4. **Zustand selectors:** The viewer uses atomic selectors (`useScoringStore((state) => state.totalRuns)`) to prevent unnecessary re-renders.
5. **Admin login is hardcoded:** `admin@gmail.com` / `admin` — not database-backed. The admin panel has no real auth protection.
6. **Middleware doesn't enforce auth:** JWT is verified and headers are injected, but unauthenticated requests are not redirected (redirects are commented out).
7. **Shared LiveScorecard:** The same `LiveScorecard` component is used in both Admin (`LiveMatchStep`) and Viewer (`MatchDetailView`), receiving filtered deliveries as props.
8. **Player ID validation:** All playerIds must correspond to registered Users. Validation occurs both client-side (before UI actions) and server-side (before DB writes). Unregistered players are shown in a modal with their names and IDs.

---

## 10. Player Registration System

### 10.1 Overview
Only registered users (those with a User account) can participate in tournaments. Each User has a unique `playerId` (auto-generated 5-digit number between 10000-99999).

### 10.2 Player ID Flow
1. User signs up via `/api/auth/signup` → receives `playerId`
2. Admin creates teams and enters `playerId` for each player
3. System validates `playerId` exists in User table before allowing registration
4. If invalid, admin sees modal with list of unregistered players

### 10.3 Validation Points
- **Client-side (CreateTeamsStep):**
  - Before adding team manually
  - Before processing Excel upload
  - Before proceeding to scheduling
- **Server-side (API routes):**
  - `/api/tournament/setup` — validates all players before any DB writes
  - `/api/scoring/init` — validates all players before match initialization

### 10.4 Excel Upload Format
Required columns: `TeamName`, `ShortName`, `PlayerName`, `Role`, `IsCaptain`, `PlayerID`
- `PlayerID` is required and must match a registered User's playerId
- Rows with invalid PlayerID are rejected with error message showing unregistered players

---

## 11. Current Known Issues & Future Work

- **Admin auth is mock** — hardcoded credentials, no DB-backed admin auth
- **Middleware doesn't enforce auth** — redirects are commented out
- **No football module** — placeholder card only
- **No test suite** — no test files exist
- **Voice scoring** only handles "one run", "four runs", "six runs", "out" — limited vocabulary
- **No route protection** on `/cricket/admin` — accessible to anyone
- **Inning transition in admin** requires manual selection of all 3 players (bowler, striker, non-striker) — could be streamlined