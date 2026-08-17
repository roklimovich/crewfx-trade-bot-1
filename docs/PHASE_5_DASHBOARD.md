# CrewFX — Phase 5: Dashboard UI (+ Login/Register)

## Scope note

This phase absorbed the login/register pages (per your call) on top of the original Phase 5 brief:
sidebar, navbar, signal feed, trading statistics, charts, profile, notifications, settings, Telegram
integration.

## What was implemented

```
src/app/(auth)/
  layout.tsx        → centered glass card, no marketing chrome
  login/page.tsx     → calls /api/auth/login (Phase 3), handles the 2FA_REQUIRED challenge inline
  register/page.tsx   → calls /api/auth/register, shows a "check your email" state on success

src/app/(dashboard)/
  layout.tsx                    → server component: reads x-user-id from middleware, queries
                                    Prisma directly, redirects to /login if missing
  dashboard/page.tsx             → overview: stat cards, performance chart, recent signals
  dashboard/signals/page.tsx      → full feed with status filter tabs
  dashboard/settings/page.tsx      → profile, Pocket Option ID, Telegram, admin 2FA

src/components/dashboard/
  dashboard-shell.tsx    → client component owning mobile-drawer state, wraps Sidebar + topbar + content
  sidebar.tsx              → desktop nav, role-gated Admin panel link
  nav-items.tsx              → shared nav config (desktop sidebar + mobile drawer both read this)
  notifications-dropdown.tsx  → click-outside-to-close dropdown, mock data (Phase 10 wires it live)
  user-menu.tsx                 → avatar initials, settings link, logout
  stat-card.tsx                   → overview metric tiles
  signal-feed.tsx                   → signal row list, shared by overview (limited) and full page
  performance-chart.tsx               → recharts area chart of win rate
  settings/profile-section.tsx          → name update (PATCH /api/auth/me)
  settings/pocket-option-section.tsx      → submit ID → /api/auth/pocket-option
  settings/telegram-section.tsx             → real Telegram Login Widget, posts to /api/auth/telegram
  settings/two-factor-section.tsx             → admin-only, QR enrollment → /api/auth/2fa/setup + /verify

src/lib/
  api-client.ts   → fetch wrapper: attaches X-CSRF-Token from the readable csrf cookie, throws
                     ApiError with the parsed message on non-2xx
  mock-data.ts     → clearly-labeled placeholder signals/stats/notifications (see below)
  format-time.ts    → relative time formatting

src/app/api/auth/me/route.ts   → new: GET (profile + integration status) and PATCH (name) —
                                   needed by the dashboard shell and settings page, wasn't built in Phase 3
```

## Why mock data, and how it's structured to be replaced

Phase 7 (Market Data) and Phase 8 (Signal Engine) haven't been built yet, so there are no real rows
in `Signal` or `MarketData` to render. Rather than leave the dashboard empty, `src/lib/mock-data.ts`
exports data shaped exactly like the real Prisma models, with a comment block at the top mapping each
export to the future real query (e.g. `mockSignals` → `prisma.signal.findMany(...)`). When Phase 7/8
land, swapping this out is a matter of changing the data source in the page components, not
redesigning the UI.

## Two implementation decisions worth flagging

1. **The dashboard layout queries Prisma directly in a Server Component**, rather than calling its
   own `/api/auth/me` API route. `src/middleware.ts` already verified the JWT and forwarded
   `x-user-id` as a header — re-verifying via an HTTP round-trip to our own API would be redundant.
   The `/api/auth/me` route still exists and is used by _client_ components (the settings page) that
   need to fetch/refetch after a mutation, which can't read Prisma directly.
2. **Telegram linking uses the real Telegram Login Widget** (`telegram.org/js/telegram-widget.js`),
   not a mock button — it needs `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` set in `.env` to render. Without
   it, the settings page shows a note telling you what to set instead of a broken widget.

## Verified in this environment

- ✅ `eslint` and `tsc --noEmit` pass clean (same two sandbox-only Prisma stub errors as prior phases
  — see Phase 3/4 docs for why).
- ✅ Ran an actual `next build` (with the same temporary local-font stub used in Phase 4, since this
  sandbox can't reach Google Fonts) — **webpack compiled successfully** for every page and component
  in this phase before hitting the same known Prisma stub wall. That means all the client/server
  component boundaries, recharts usage, and the Telegram widget's `window` global are all valid.

## What you can edit right now

- `src/lib/mock-data.ts` — tune the placeholder signals/stats to whatever looks right for a demo
  before Phase 7/8 exist.
- `.env` — set `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` to your bot's username to light up the real
  Telegram login widget in Settings.

## Next step

**Phase 6 — Admin Panel**: user management (search, filters, approve/reject/block, view Pocket
Option ID and Telegram), logs, analytics, settings — built on the `AdminAction`/`Log` models from
Phase 2 and the role gating already in `src/middleware.ts`.

**Reply "continue" (or request changes to Phase 5) before I start Phase 6.**
