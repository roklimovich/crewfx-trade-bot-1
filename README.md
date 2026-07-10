# SignalForge — Phase 1: Architecture

Informational technical-analysis signal platform for Forex & OTC markets.
Signals are informational only — the platform never places trades automatically.

## Tech Stack & Why

| Layer                     | Choice                                                         | Reason                                                                                                                                                       |
| ------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework                 | Next.js 14 (App Router)                                        | Single codebase for marketing site, dashboard, admin panel, and API routes. Server components cut client JS for data-heavy screens (signal feed, analytics). |
| Language                  | TypeScript (strict)                                            | Signal payloads, indicator math, and financial data need strong typing — a wrong `number vs string` on a price field is a real bug, not a nuisance.          |
| Styling                   | Tailwind CSS + shadcn/ui                                       | Utility CSS for speed, shadcn for accessible unstyled primitives we can restyle into the dark/glass look from your reference.                                |
| ORM / DB                  | Prisma + PostgreSQL                                            | Relational data (users, signals, indicators, history) benefits from real joins/constraints; Prisma gives type-safe queries end-to-end.                       |
| Cache / Realtime backbone | Redis                                                          | Rate limiting, session/refresh-token blacklists, caching indicator calculations, and pub/sub for pushing live signals to connected clients.                  |
| Auth                      | JWT (access + refresh) via `jose`, bcrypt for password hashing | Stateless access tokens for API/mobile-friendliness, rotating refresh tokens stored server-side so we can revoke sessions (needed for admin "block user").   |
| AI layer                  | Anthropic SDK                                                  | Used only in Phase 9 to _explain_ rule-based signals in plain language — never to generate the signal itself.                                                |
| Testing                   | Jest (unit/integration) + Playwright (E2E)                     | Standard, well-supported combo for this stack.                                                                                                               |
| Deployment                | Vercel + managed Postgres/Redis                                | Matches the Next.js App Router deployment model; `vercel.json` runs `prisma generate` on build.                                                              |

## Application Layers (Clean Architecture)

```
Presentation   → src/app/**              (pages, layouts, route handlers — thin, no business logic)
Components     → src/components/**       (pure UI, receives data via props)
Application    → src/server/**           (use-cases: signal-engine, market-data, auth, ai, notifications, security)
Data Access    → src/server/db/**        (Prisma + Redis clients — the only place raw DB/cache calls happen)
Shared         → src/lib, src/types, src/hooks
```

Rule of dependency: `app` → `server` → `db`. Nothing in `db` imports from `server`, nothing in
`server` imports React/Next primitives. This keeps the signal engine and market-data service
testable in isolation and reusable by a future background worker/cron process, not just HTTP routes.

## Folder Structure

```
signalforge/
├── src/
│   ├── app/
│   │   ├── (marketing)/          → public landing page (Phase 4)
│   │   ├── (auth)/login|register → auth pages (Phase 3)
│   │   ├── (dashboard)/dashboard → user app (Phase 5)
│   │   ├── (admin)/admin         → admin panel (Phase 6)
│   │   └── api/                  → route handlers: auth, signals, admin, webhooks
│   ├── components/
│   │   ├── ui/                   → shadcn/ui primitives
│   │   ├── marketing/ dashboard/ admin/ shared/
│   ├── server/
│   │   ├── auth/                 → JWT issuing/verifying, password hashing (Phase 3)
│   │   ├── market-data/          → data collection + indicator calculations (Phase 7)
│   │   ├── signal-engine/        → rule-based signal generation (Phase 8)
│   │   ├── ai/                   → LLM explanation layer (Phase 9)
│   │   ├── notifications/        → Telegram/email/push/WebSocket (Phase 10)
│   │   ├── security/             → rate limiting, CSRF, audit logging
│   │   └── db/                   → Prisma + Redis singletons ✅ done
│   ├── lib/                      → cn(), shared helpers
│   ├── hooks/                    → client-side React hooks
│   ├── types/                    → shared TS types/interfaces
│   └── styles/globals.css        → design tokens (dark/glass theme) ✅ done
├── prisma/schema.prisma          → datasource/generator skeleton (models in Phase 2)
├── .husky/pre-commit             → runs lint-staged
├── vercel.json
└── .env.example
```

## Configured in Phase 1

- ✅ TypeScript strict mode + path aliases (`@/...`)
- ✅ ESLint (`next/core-web-vitals` + Prettier compatibility)
- ✅ Prettier (with Tailwind class sorting plugin)
- ✅ Husky pre-commit → lint-staged (auto-fixes staged files)
- ✅ Tailwind CSS with dark/glassmorphism design tokens matching the reference style
- ✅ shadcn/ui wired via `components.json` (violet base color, CSS variables)
- ✅ Prisma configured for PostgreSQL (schema/models next phase)
- ✅ Redis client singleton
- ✅ Environment variable template (`.env.example`)
- ✅ Vercel deployment config with security headers

## Not Yet Built (by design — later phases)

Database models, auth logic, UI pages, market-data collection, and the signal engine itself are
intentionally empty/placeholder right now. Building them now would violate the phase-by-phase plan.

## What You Can Edit Right Now

- `src/styles/globals.css` — the `:root` CSS variables control the entire color theme. Try changing `--primary` / `--accent` hue values to shift the palette.
- `tailwind.config.ts` — animation timing, border radius, container width.
- `.env.example` — copy to `.env` and fill in real values once you provision Postgres/Redis.
- `package.json` — dependency versions if you want to pin differently.

## Next Step

Phase 2 — Database Design: full Prisma schema (Users, Roles, Sessions, Pocket Option IDs, Telegram
Accounts, Signals, Signal History, Indicators, Market Data, Notifications, AI Analysis, Logs,
Settings, Admin Actions) with relationships, indexes, and constraints.

**Reply "continue" (or request changes to Phase 1) before I start Phase 2.**
