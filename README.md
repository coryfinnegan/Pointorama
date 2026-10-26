# Pointorama ⭐

A points-and-prizes rewards tracker for kids. Dad awards points for good behavior and school performance; your kid browses the Prize Shop and redeems prizes; Dad fulfills them in the Admin panel.

## Features

### Implemented

**Dashboard**
- Personalized greeting with level badge (Rookie → Explorer → Achiever → Champion → Legend)
- Live stat cards: Total Earned, Available to Spend, Spent
- Recent points feed

**Prize Shop**
- Browse all active prizes sorted by cost
- Redeem with a confirmation dialog (shows remaining balance after redemption)
- Confetti burst on successful redemption

**Admin Panel** *(PIN-protected)*
- Add or deduct points with an optional note
- Add prizes with name, description, point cost, and optional image URL
- Pending redemption queue — see what your kid redeemed and mark it fulfilled with one click
- Redemption history — log of everything already fulfilled
- Manage active prizes (remove/soft-delete)

**Test suite**
- 42 unit + integration tests (Vitest, in-memory SQLite)
- 19 Playwright E2E tests covering dashboard, shop, admin login, and the full add-prize → redeem → fulfill cycle

### Planned

- [ ] Weekly points chart (recharts, grouped by day)
- [ ] Edit existing prizes (dialog with pre-filled fields)
- [ ] Full point history page with date filters
- [ ] Prize image URL preview in the admin form
- [ ] Parent notification (email via Resend) when your kid redeems a prize
- [ ] Cancel redemption button for the kid
- [ ] Roku TV channel (reads `/api/points` + `/api/prizes` via BrightScript)
- [ ] Amazon integration — "Buy on Amazon" deep-link on each prize
- [ ] Hosted PostgreSQL for production (Drizzle supports it with minimal schema changes)

## Tech Stack

| Layer | Technology |
|---|---|
| Orchestration | .NET Aspire 9.5 |
| Frontend + API | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | SQLite via better-sqlite3 |
| ORM | Drizzle ORM |
| Unit/integration tests | Vitest |
| E2E tests | Playwright |

## Getting Started

### Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- [Aspire CLI](https://learn.microsoft.com/dotnet/aspire/fundamentals/aspire-sdk-tooling) — `dotnet tool install -g aspire`

### 1. Install dependencies

```bash
cd web && npm install
```

### 2. Configure environment

Create `web/.env.local`:

```env
# Kid's display name on the dashboard
NEXT_PUBLIC_KID_NAME=Kid

# SHA-256 hash of your admin PIN (default below = "1234")
ADMIN_PIN_HASH=03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4

# 32-byte random secret for signing session JWTs
# Generate with: node -e "require('crypto').randomBytes(32).toString('hex')"
SESSION_SECRET=your-random-secret-here
```

To use a different PIN:
```bash
node -e "const c=require('crypto'); console.log(c.createHash('sha256').update('YOUR_PIN').digest('hex'))"
```

### 3. Run the app

**Via Aspire** (recommended — gets you the dashboard + telemetry):
```bash
dotnet run --project Pointorama.AppHost
```

**Standalone Next.js:**
```bash
cd web
npm run dev          # http://localhost:3000
npm run db:studio    # Drizzle Studio visual DB browser
```

The SQLite database (`web/pointorama.db`) is created automatically on the first request.

## Running Tests

```bash
cd web

# Unit + integration tests (Vitest, no server needed)
npm test

# E2E tests (requires the app to be running on port 3000)
npm run test:e2e
```

## Project Structure

```
Pointorama/
├── Pointorama.AppHost/        # .NET Aspire orchestrator
├── Pointorama.ServiceDefaults/ # Shared telemetry/health config
├── web/
│   ├── e2e/                   # Playwright E2E specs
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── shop/          # Prize Shop
│   │   │   ├── admin/         # Admin panel + login
│   │   │   └── api/           # REST routes (points, prizes, redeem, redemptions, auth)
│   │   ├── db/                # Drizzle schema + lazy singleton
│   │   └── lib/               # Levels, session JWT helpers
│   └── src/__tests__/         # Vitest unit + integration tests
└── docs/                      # Architecture notes
```
