# Pointorama — Architecture

## Overview

A points-and-prizes rewards tracker for a kid. Parent adds points daily based on school performance; kid browses and redeems prizes in the Prize Shop; parent fulfills offline and marks complete.

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Orchestration | .NET Aspire 9.5 | Dashboard, service discovery, future service wiring |
| Frontend + API | Next.js 16 (App Router, TypeScript) | Full-stack in one project, great for vibe coding |
| Styling | Tailwind CSS v4 + shadcn/ui | Copy-paste components, fast iteration |
| Database | SQLite via better-sqlite3 | Zero infrastructure, single file, perfect for personal apps |
| ORM | Drizzle ORM | Type-safe queries, lightweight, great DX |

## Repository Structure

```
Pointorama/
├── Pointorama.sln
├── Pointorama.AppHost/          # .NET Aspire orchestrator
│   └── AppHost.cs               # Wires up Next.js npm dev server on port 3000
├── Pointorama.ServiceDefaults/  # Shared Aspire telemetry/health defaults
├── web/                         # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx       # Root layout — Nav + Toaster
│   │   │   ├── page.tsx         # Dashboard (balance, recent points, redemptions)
│   │   │   ├── shop/page.tsx    # Prize Shop (browse + redeem flow)
│   │   │   ├── admin/page.tsx   # Admin panel (add points, manage prizes, fulfill)
│   │   │   └── api/
│   │   │       ├── points/route.ts             # GET total+log, POST add points
│   │   │       ├── prizes/route.ts             # GET active prizes, POST new prize
│   │   │       ├── prizes/[id]/route.ts        # PATCH (edit/deactivate), DELETE (soft)
│   │   │       ├── redeem/route.ts             # POST — validate balance, create redemption
│   │   │       ├── redemptions/route.ts        # GET all redemptions
│   │   │       └── redemptions/[id]/route.ts   # PATCH status (pending → fulfilled)
│   │   ├── components/
│   │   │   ├── Nav.tsx          # Top navigation bar
│   │   │   └── ui/              # shadcn/ui components
│   │   └── db/
│   │       ├── schema.ts        # Drizzle table definitions
│   │       └── index.ts         # Lazy singleton getDb() — avoids build-time lock
│   ├── drizzle.config.ts
│   └── pointorama.db            # Auto-created on first request (gitignored)
└── docs/
    ├── architecture.md          # This file
    └── next-steps.md
```

## Data Model

### `points_log`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | Auto-increment |
| amount | INTEGER | Positive = add, negative = deduct |
| note | TEXT | e.g. "Great homework!" |
| created_at | TEXT | SQLite datetime |

### `prizes`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | e.g. "Minecraft Skin Pack" |
| description | TEXT | Optional flavor text |
| point_cost | INTEGER | Points required to redeem |
| image_url | TEXT | Optional product image |
| active | INTEGER | 0 = soft-deleted, hidden from shop |
| created_at | TEXT | |

### `redemptions`
| Column | Type | Notes |
|---|---|---|
| id | INTEGER PK | |
| prize_id | INTEGER FK | References prizes.id |
| prize_name | TEXT | Snapshot at redemption time |
| points_spent | INTEGER | Snapshot of cost |
| status | TEXT | `pending` → `fulfilled` or `cancelled` |
| redeemed_at | TEXT | |

## Available Balance Calculation

```
available = SUM(points_log.amount) - SUM(redemptions.points_spent WHERE status != 'cancelled')
```

Calculated live on every request — no denormalized balance field to go stale.

## Key Design Decisions

- **Lazy DB singleton (`getDb()`)** — The DB connection is opened on the first API call, not at module load. This prevents `SQLITE_BUSY` errors during Next.js's multi-worker build phase.
- **Soft deletes for prizes** — Setting `active = false` preserves the foreign key reference integrity for past redemptions.
- **Prize name snapshot on redemption** — `prize_name` is copied into the redemption row so history stays accurate even if the prize is later renamed or removed.
- **No auth (intentional)** — This is a household app. Adding a simple PIN for the Admin page is a natural next step.

## Running the App

### Via Aspire (recommended)
```bash
dotnet run --project Pointorama.AppHost
```
Opens the Aspire developer dashboard and launches the Next.js dev server.

### Standalone Next.js
```bash
cd web
npm run dev        # http://localhost:3000
npm run db:studio  # Drizzle Studio — visual DB browser
```

## Pages

| Route | Audience | Purpose |
|---|---|---|
| `/` | Kid + Parent | Dashboard — current balance, recent points, recent redemptions |
| `/shop` | Kid | Browse prizes, redeem with confirmation dialog |
| `/admin` | Parent | Add/remove points, add prizes, mark redemptions fulfilled |
