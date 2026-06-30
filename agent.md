# Fixtur — Multi-Sport Tournament Management & Live-Scoring Platform

## 1. Project Overview

Fixtur is a comprehensive, multi-sport tournament administration and real-time live-scoring web platform. Built with a modern tech stack, it provides a rich user experience for tournament organizers, players, and fans. The platform is designed to be scalable and robust, handling everything from tournament setup and player registration to live, ball-by-ball scoring and real-time updates for viewers.

The primary sport supported is Cricket, with a full suite of features for managing tournaments, teams, players, and matches. A placeholder for Football exists, indicating the platform's potential for expansion into other sports.

A key architectural feature is the decoupling of the write-heavy Admin Scoring Console from the read-heavy Public Live Scoreboard. This is achieved through an event-driven telemetry sync framework using Pusher WebSockets, ensuring a smooth and responsive experience for all users, even under heavy load.

The platform features a premium dark UI aesthetic, with a color scheme based on deep charcoals, slate grays, and accented with vibrant emerald and violet, providing a modern and visually appealing interface.

---

## 2. Tech Stack

| Layer | Technology | Description |
|---|---|---|
| **Framework** | Next.js 14 | The core framework, utilizing the App Router for server-side rendering and API routes. |
| **Language** | TypeScript | For type safety and improved developer experience. |
| **Styling** | Tailwind CSS v4 | A utility-first CSS framework for rapid UI development. |
| **UI Components**| Shadcn UI | A collection of re-usable UI components built on Radix UI primitives. |
| **State Mgt.**| Zustand | A small, fast, and scalable state-management solution, used for the live scoring UI. |
| **Icons** | Lucide React | A library of beautiful and consistent icons. |
| **Database** | PostgreSQL | The relational database for storing all application data. |
| **ORM** | Prisma | A next-generation ORM for Node.js and TypeScript, used for database access. |
| **Hosting** | Supabase | Provides the hosted PostgreSQL database. |
| **Real-time** | Pusher Channels | For real-time communication between the server and clients, powering the live scoring. |
| **Auth** | NextAuth.js & Custom JWT | A hybrid system. NextAuth.js is set up, but a custom JWT implementation with `jose` is currently in use. |
| **File Upload** | `xlsx` | For bulk uploading of team and player data from Excel files. |

---

## 3. Directory Structure

```
fixtur/
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript configuration
├── middleware.ts                 # JWT verification middleware
├── tailwind.config.ts            # Tailwind configuration
├── prisma/
│   └── schema.prisma             # Database schema
├── lib/
│   ├── auth.ts                   # Auth helper functions
│   ├── prisma.ts                 # PrismaClient singleton
│   ├── pusher.ts                 # Pusher server & client
│   └── store.ts                  # In-memory match state
├── store/
│   └── useScoringStore.ts        # Zustand store for scoring
├── app/
│   ├── api/                      # API routes
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── host/
│   │   ├── player/
│   │   ├── scoring/
│   │   ├── tournament/
│   │   ├── tournaments/
│   │   └── users/
│   └── cricket/                  # Frontend pages
│       ├── admin/
│       ├── host/
│       └── live/
└── components/
    ├── Toast.tsx
    └── ui/
```

---

## 4. Database Architecture (Prisma Schema)

The database schema is defined in `prisma/schema.prisma` and managed using Prisma ORM.

### Enums

| Enum | Values | Description |
|---|---|---|
| `Sport` | `CRICKET`, `FOOTBALL` | Defines the supported sports. |
| `MatchStatus` | `SCHEDULED`, `LIVE`, `COMPLETED`, `ABANDONED` | Represents the current state of a match. |
| `Role` | `USER`, `HOST`, `SUPER_ADMIN` | Defines the user roles for authorization. |
| `Gender` | `MALE`, `FEMALE`, `OTHER` | Represents the gender of a user. |

### Models

#### `Tournament`
Represents a tournament.
- `id`: Unique identifier (CUID).
- `name`: Name of the tournament.
- `sport`: The sport of the tournament (from `Sport` enum).
- `location`: Optional location of the tournament.
- `format`: Optional format of the tournament (e.g., T20, ODI).
- `numberOfOvers`: Optional number of overs for cricket matches.
- `startDate`, `endDate`: The start and end dates of the tournament.
- `organizerId`, `organizer`: Relation to the `User` who is organizing the tournament.
- `matches`: A list of all matches in the tournament.
- `teams`: A list of all teams in the tournament.

#### `Team`
Represents a team participating in a tournament.
- `id`: Unique identifier (CUID).
- `name`, `shortName`: The full and short names of the team.
- `logoUrl`: Optional URL for the team's logo.
- `tournamentId`, `tournament`: Relation to the `Tournament` the team belongs to.
- `players`: A list of players in the team.
- `homeMatches`, `awayMatches`: Relations to the matches the team plays as home or away.

#### `Player`
Represents a player in a team.
- `id`: Unique identifier (CUID).
- `name`: The name of the player.
- `role`: The player's role (e.g., Batsman, Bowler).
- `isCaptain`: Boolean indicating if the player is the captain.
- `playerId`: Optional unique integer ID for the player.
- `teamId`, `team`: Relation to the `Team` the player belongs to.
- `deliveriesStruck`, `deliveriesNonStruck`, `deliveriesBowled`: Relations to `InningDelivery` for tracking player stats.

#### `Match`
Represents a match between two teams.
- `id`: Unique identifier (CUID).
- `title`: Optional title for the match.
- `status`: The current status of the match (from `MatchStatus` enum).
- `sport`: The sport of the match (from `Sport` enum).
- `tournamentId`, `tournament`: Relation to the `Tournament` the match belongs to.
- `homeTeamId`, `homeTeam`, `awayTeamId`, `awayTeam`: Relations to the two competing `Team`s.
- `tossWinnerId`, `tossDecision`: Stores the toss result.
- A set of fields for live scoring: `currentInning`, `totalRuns`, `totalWickets`, `overs`, etc.
- `deliveries`: A list of all deliveries in the match.

#### `User`
Represents a user of the platform.
- `id`: Unique identifier (CUID).
- `name`, `age`, `gender`, `email`: User's personal information.
- `password`: The user's hashed password.
- `playerId`: A unique auto-incrementing integer ID for the user as a player.
- `role`: The user's role (from `Role` enum).
- `organizedTournaments`: A list of tournaments organized by the user.
- `sessions`: A list of active sessions for the user.

#### `Session`
Represents a user's session.
- `id`: Unique identifier (CUID).
- `userId`, `user`: Relation to the `User`.
- `expiresAt`: The expiration date of the session.

#### `InningDelivery`
Represents a single ball delivery in a cricket match. This is the most granular level of data, used for detailed statistics and live scoring.
- `id`: Unique identifier (CUID).
- `matchId`, `match`: Relation to the `Match`.
- `inning`: The inning number (1 or 2).
- `strikerId`, `striker`, `nonStrikerId`, `nonStriker`, `bowlerId`, `bowler`: Relations to the `Player`s involved in the delivery.
- `runs`, `extras`, `extraType`: Details about the runs scored.
- `isWicket`, `wicketType`: Details if a wicket was taken.
- `isLegalDelivery`: Boolean indicating if the delivery was legal.

---

## 5. Core Architecture

### 5.1 Authentication Flow
The application employs a custom JWT-based authentication mechanism.
1.  **Signup/Login**: Users sign up or log in through dedicated API endpoints.
2.  **JWT Issuance**: Upon successful authentication, a JWT is generated using the `jose` library. The payload includes `userId` and `email`.
3.  **Cookie Management**: The JWT is sent to the client as an `httpOnly` cookie named `session`.
4.  **Middleware**: A Next.js middleware (`middleware.ts`) runs on most requests. It reads the `session` cookie, verifies the JWT, and if valid, injects the user's information (`x-user-id`, `x-user-email`, `x-user-role`) into the request headers.
5.  **Authorization**: API routes and server-side components can then access the user's information from the headers and use helper functions from `lib/auth.ts` to enforce role-based access control.

**NOTE on Auth Discrepancy**: A known issue exists where the middleware hardcodes the `x-user-role` header to `"USER"`. This prevents proper role-based authorization for `HOST` and `SUPER_ADMIN` roles. This needs to be fixed by including the user's role in the JWT payload.

### 5.2 State Management
- **Zustand (`useScoringStore.ts`)**: The frontend uses Zustand for managing the complex state of the live scoring interface. This includes the current score, players, delivery history, and UI state. The store provides actions for recording deliveries, undoing actions, and managing match state transitions (e.g., end of over, end of innings).
- **In-Memory Store (`lib/store.ts`)**: On the server-side, two in-memory `Map` objects (`activeMatches`, `matchStates`) are used to cache live match data. This provides fast access for the lobby and reduces database load.

### 5.3 Real-time Sync
The real-time functionality is powered by Pusher.
1.  When an admin updates the score, the client sends the new state to the `/api/scoring/sync` endpoint.
2.  The server updates the database and the in-memory cache.
3.  The server then broadcasts the updated state via Pusher to two channels:
    -   `match-{matchId}`: Sends detailed updates to viewers of a specific match.
    -   `global-lobby`: Sends a summary of all active matches to update the lobby view.
4.  Clients subscribed to these channels receive the updates in real-time and update their UI accordingly.

---

## 6. API Routes Documentation

This section details all the API endpoints available in the application.

### Authentication (`/api/auth`)
-   `POST /api/auth/signup`: Registers a new user.
-   `POST /api/auth/login`: Authenticates a user and returns a session cookie.
-   `POST /api/auth/logout`: Clears the session cookie.
-   `GET /api/auth/me`: Returns the details of the currently authenticated user.
-   `GET /api/auth/[...nextauth]`: The main endpoint for the NextAuth.js library (setup but not fully integrated).

### Admin (`/api/admin`)
-   `GET /api/admin/stats`: (SUPER_ADMIN) Returns platform-wide statistics.

### Host (`/api/host`)
-   `GET /api/host/tournaments`: (HOST) Returns a list of tournaments organized by the current host.
-   `POST /api/host/tournaments`: (HOST) Creates a new tournament for the current host.
-   `GET /api/host/tournaments/[id]`: (HOST) Returns details of a specific tournament.
-   `PUT /api/host/tournaments/[id]`: (HOST) Updates a specific tournament.
-   `POST /api/host/tournaments/[id]/teams`: (HOST) Adds teams to a tournament.

### Player (`/api/player`)
-   `GET /api/player/validate`: Validates if a `playerId` exists.

### Scoring (`/api/scoring`)
-   `POST /api/scoring/init`: Initializes a match for scoring.
-   `POST /api/scoring/sync`: Syncs the live score data, persists to DB, and broadcasts updates.
-   `GET /api/scoring/[matchId]`: Returns the full state of a specific match.

### Tournaments (`/api/tournaments` & `/api/tournament`)
-   `POST /api/tournament/setup`: A comprehensive endpoint for setting up a tournament, including teams and matches.
-   `GET /api/tournaments`: Returns a list of all public tournaments.
-   `GET /api/tournaments/[id]`: Returns details of a specific public tournament.
-   `GET /api/tournaments/[id]/matches`: Returns all matches for a tournament.
-   `GET /api/tournaments/[id]/teams`: Returns all teams for a tournament.
-   `GET /api/tournaments/[id]/matches/[matchId]/innings`: Returns detailed innings data for a match.

### Users (`/api/users`)
-   `GET /api/users`: (SUPER_ADMIN) Returns a list of all users.
-   `GET /api/users/[id]`: (SUPER_ADMIN) Returns details of a specific user.
-   `PUT /api/users/[id]`: (SUPER_ADMIN or User) Updates a user's details.
-   `GET /api/users/[id]/stats`: Returns statistics for a specific user.
-   `POST /api/users/role`: (SUPER_ADMIN) Updates the role of a user.

---

## 7. Application Flow

### Admin/Host Flow
1.  **Login**: Admins and Hosts log in to access their respective dashboards.
2.  **Tournament Creation**: Hosts can create tournaments from their dashboard. Admins can create and manage all tournaments.
3.  **Team & Player Management**: Teams and players can be added to a tournament, either manually or via Excel bulk upload. The system validates that all `playerId`s correspond to registered users.
4.  **Match Scheduling**: Matches are scheduled between teams in a tournament.
5.  **Live Scoring**: Once a match is started, the admin/host uses the live scoring console to record ball-by-ball data.

### Public Viewer Flow
1.  **Lobby**: Users can visit the `/cricket/live` page to see a lobby of all ongoing matches.
2.  **Match Viewing**: Clicking on a match takes the user to the detailed match view, where they can see the live scorecard, player stats, and ball-by-ball updates in real-time.
3.  **Player Profile**: Users can have their own profiles, and if they are players, their stats will be tracked.

---

## 8. Known Issues & Future Work

-   **Admin Auth**: The admin login is currently hardcoded and does not use a database-backed user.
-   **Auth Discrepancy**: The middleware hardcodes the user role, preventing proper role-based access control. This is a critical issue to be addressed.
-   **Football Module**: The football module is a placeholder and needs to be implemented.
-   **Testing**: The project lacks a test suite. Adding unit and integration tests is a priority.
-   **Voice Scoring**: The voice scoring engine has a limited vocabulary and could be improved.
-   **Route Protection**: Some admin routes may not be properly protected and could be accessible to unauthorized users.

This document provides a comprehensive overview of the Fixtur platform. It should be kept up-to-date as the platform evolves.