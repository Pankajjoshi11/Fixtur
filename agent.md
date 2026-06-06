# Fixtur - Multi-Sport Management and Live-Streaming Platform

## 1. Project Overview
Fixtur is a highly scalable, multi-sport sports management and live-streaming web platform. The platform is designed with a premium, professional dark color theme (deep charcoals, slate grays, and vibrant accent colors). It supports multiple sports, starting with Cricket and Football.

## 2. Tech Stack
- **Frontend Framework:** Next.js 14+ (App Router) with TypeScript.
- **Styling & UI:** Tailwind CSS combined with Shadcn UI (Radix UI primitives).
- **State Management:** Zustand (lightweight, decoupled state management for live match actions with undo capabilities).
- **Icons & Visuals:** Lucide React.
- **Database Architecture:** PostgreSQL managed via Prisma ORM.
- **Real-time WebSockets:** Pusher for live syncing between Admin Scoring and Public Match View.

## 3. Directory Structure (Key Components)
```
/
├── prisma/
│   └── schema.prisma         # Relational DB models
├── store/
│   └── useScoringStore.ts    # Zustand store for live match state
├── utils/
│   └── sportsMath.ts         # Logic for NRR and Player Impact Score
├── lib/
│   └── pusher.ts             # Pusher client and server instances
├── app/
│   ├── page.tsx              # Landing page (Sport Selection Hub)
│   ├── layout.tsx            # Global layout and fonts
│   ├── globals.css           # Global Tailwind and dark theme CSS
│   ├── api/
│   │   └── scoring/sync/route.ts # API endpoint to push live updates
│   ├── cricket/
│   │   ├── admin/page.tsx    # Admin Control Panel (Scoring Interface + Voice Engine)
│   │   └── live/page.tsx     # Public Live Scorecard (WebSockets)
│   └── football/             # (Placeholder structure for future)
```

## 4. Implemented Features & Architecture

### 4.1. Database Modeling (Prisma)
A relational architecture is set up to support multi-sport tracking.
**Models included:**
- `Tournament`: Manages tournament details and sport type.
- `Team`: Manages team data and relates to Tournaments.
- `Player`: Players linked to teams.
- `Match`: Match details (home/away, toss, status).
- `InningDelivery`: Granular ball-by-ball tracking storing runs, extras, wickets, bowler, and batsman IDs.

### 4.2. Live Scoring State & Automation (Zustand)
`store/useScoringStore.ts` handles complex live state.
- **Automation rules implemented:**
  - Auto-rotates batting strike on odd runs (1, 3) and at the end of the over.
  - Auto-freezes match ball count on "Wide" or "No-ball".
  - Records delivery history in a `deliveryHistory` stack array.
- **Undo Mitigation (Error Correction):**
  - Features an `undoLastDelivery` function that pops the last delivery from the stack, reverses runs/wickets, restores exact overs/balls, and reverts batsman strike state.

### 4.3. Mathematical Rankings Utility
`utils/sportsMath.ts` includes complex algorithms.
- **Net Run Rate (NRR):** Calculates NRR accurately with edge-case protection (if a team is bowled out early, the denominator strictly defaults to the full match quota, e.g., 20.0 overs).
- **Unbiased Player Impact Score:** Normalizes performance to prevent top-order bias. Factors include runs, strike rate weight, boundary bonus, dot ball pressure, and economy rate inverse weights.

### 4.4. Multi-Sport Navigation Hub
`app/page.tsx` implements a premium dark theme entry point using Radix primitives (styled via Tailwind) providing interactive routing to `/cricket` and `/football`.

### 4.5. Admin Scoring Dashboard (Cricket)
`app/cricket/admin/page.tsx` serves as the protected operational scorebook.
- **Manual Controls:** UI pads for Runs, Extras (Wd, Nb, B, Lb), Wickets, and Undo.
- **Voice Engine Integration:** Utilizes the Web Speech API (`SpeechRecognition`). Implements a toggle button that listens for specific phrases ("one run", "four runs", "out") and automatically triggers scoring functions.
- **State Syncing:** Every scoring event pushes a mutation to `/api/scoring/sync` to update the server.

### 4.6. Public Live Match View (Cricket)
`app/cricket/live/page.tsx` provides the audience perspective.
- **WebSocket Integration:** Uses Pusher JS to subscribe to match channels. Overwrites the local Zustand state when server broadcasts updates.
- **UI Renderings:** Scorecard, recent deliveries ticker, current batsmen/bowler stats, and a dynamic commentary feed generated from the delivery history.

## 5. Development Steps Taken So Far
1. Initialized Next.js 14 App Router, TypeScript, and Tailwind.
2. Setup Prisma ORM and defined PostgreSQL schema. User connected a remote Supabase instance via `.env`.
3. Created the Zustand state management engine for cricket scoring.
4. Drafted NRR and Player Impact mathematics utilities.
5. Implemented the frontend entry page (`app/page.tsx`).
6. Built the public live match view UI (`app/cricket/live/page.tsx`).
7. Integrated Pusher for real-time WebSocket communication.
8. Built the admin scoring UI (`app/cricket/admin/page.tsx`) with Voice Web Speech API and Undo functionality.

## 6. Current Local Environment Issues (To Be Addressed)
The user is currently unable to start the app locally.
- **Issue 1:** Running `npm start` (which executes `next start`) triggers an error: `Could not find a production build in the '.next' directory.` This is because `next start` requires a pre-built app using `next build`.
- **Issue 2:** When the user attempted to run `npm start` again, they received `EADDRINUSE: address already in use :::3000`. This means an instance of Next.js is already running in the background.
- **Issue 3:** The user attempted `npm build` and `next build` which failed (correct command is `npm run build`).
- **Immediate Fix required:** The user should run `npm run dev` to start the development server, or kill the process on port 3000 and run `npm run build` followed by `npm start`.

## 7. Future Considerations & Next Steps
- **Resolve Server/Port Issues:** Help the user successfully boot the development server (`npm run dev`).
- **Authentication:** Implement NextAuth or Supabase Auth to protect the `/cricket/admin` route. Currently, it acts as a mock authenticated view.
- **Database Hookup:** The admin dashboard currently pushes state to Pusher but does not yet persist the `InningDelivery` entries to the PostgreSQL database via Prisma. API routes need to be expanded to execute `prisma.match.update` and `prisma.inningDelivery.create`.
- **Football Module:** Build out the static placeholders in `/football` with specific Football data structures (goals, cards, halves).
- **Tournament Admin Panel:** Build UI to upload `.xlsx/.csv` for bulk team/player registration.
- **End of Over UI:** Hook the "End of Over" modal to the Zustand state logic to pause the game and select the next bowler.