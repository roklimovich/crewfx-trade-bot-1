# CrewFX — Phase 6: Admin Panel

## Schema change (heads-up)

Added one enum value: `AdminActionType.VERIFY_POCKET_OPTION`. Verifying a submitted Pocket Option
ID is a distinct admin action from the four already defined (approve/reject/block/unblock user),
and reusing `UPDATE_SETTING` for it would have made the audit trail misleading — an admin scanning
logs for "who changed a setting" shouldn't see Pocket Option verifications mixed in.

## What was implemented

```
src/server/auth/admin-guard.ts   → requireAdmin(req, allowedRoles?) — every admin route starts
                                     with this; returns a typed { ok, response|user } result

src/server/admin/user-actions.ts  → approveUser / rejectUser / blockUser / unblockUser /
                                      verifyPocketOptionAccount — all state transitions + audit
                                      logging in one place, so route handlers stay thin

src/app/api/admin/
  users/route.ts                        → GET, search + status/role filter + pagination
  users/[id]/route.ts                    → GET, full detail incl. sessions, Pocket Option, Telegram
  users/[id]/approve/route.ts             → POST
  users/[id]/reject/route.ts               → POST
  users/[id]/block/route.ts                 → POST (also revokes every active session)
  users/[id]/unblock/route.ts                → POST
  users/[id]/verify-pocket-option/route.ts    → POST, confirms the account belongs to that user first
  logs/route.ts                                → GET, ?view=logs|admin-actions, level filter, pagination
  analytics/route.ts                             → GET, live counts (no mock data — see below)
  settings/route.ts                               → GET (admin+moderator), PATCH (admin only)

src/app/(admin)/admin/
  layout.tsx        → server component, same pattern as the dashboard layout
  page.tsx           → overview, queries Prisma directly (server component)
  users/page.tsx       → search/filter/table, opens UserDetailPanel on row click
  logs/page.tsx          → system logs + admin-action audit trail toggle
  settings/page.tsx        → edit platform settings as raw JSON values

src/components/admin/
  admin-shell.tsx    → sidebar/topbar shell, mirrors dashboard-shell.tsx but with admin nav
  nav-items.tsx        → Overview / Users / Logs / Settings (Settings hidden from Moderators)
  user-detail-panel.tsx  → slide-over: full profile, Pocket Option verify button, approve/reject/block
```

## Why the overview page has real zeros, not mock numbers

Unlike the dashboard's signal feed (Phase 5, intentionally mocked), the admin overview and
`/api/admin/analytics` query Prisma directly and will show **0 total signals** until Phase 7/8
exist. An admin panel is the one place in this app where a wrong number has real consequences —
someone could act on a fake "signals generated today" count. So this page shows what's actually in
the database, with a note explaining why signal-related numbers are 0 for now, rather than
inventing plausible-looking figures the way the Phase 4 landing page's testimonials do.

## Role enforcement, end to end

- `src/middleware.ts` (Phase 3) already blocks non-ADMIN/MODERATOR browsers from `/admin/*` at the
  edge, before any page or API route runs.
- Every `/api/admin/*` route calls `requireAdmin()` independently — defense in depth, since API
  routes shouldn't rely solely on middleware (e.g. if middleware config ever changes).
- **Settings writes are ADMIN-only**, not Moderator: `requireAdmin(req, ['ADMIN'])`. Moderators can
  view settings (so they understand platform config) but can't change them. The Settings nav link
  is hidden from Moderators in the UI too, though the API enforces it regardless of what the UI shows.
- A few guardrails in `user-actions.ts`: an admin can't approve/reject/block their own account
  (`adminId === targetUserId` check), and blocking always revokes every active session immediately.

## Verified in this environment

- ✅ `eslint` passes clean.
- ✅ Ran `next build` (font-stubbed for the same reason as prior phases) — **webpack compiled
  successfully** again. The only failure is the same known Prisma-stub wall, this time cascading
  into a few "implicit any" errors on `.map()` callbacks in the new admin routes — that's a
  downstream symptom of the stub client returning untyped arrays, not a real bug. It resolves the
  same way it has every phase: run `npx prisma generate` with real network access.

## What you can edit right now

- `src/lib/mock-data.ts` (from Phase 5) — once you manually insert a few real rows via
  `npm run db:studio`, the admin overview's "Total signals" will reflect them immediately, since
  that number was never mocked.
- `prisma/seed.ts` — `signal.min_confidence_score` and friends are now editable live from
  `/admin/settings` instead of only at seed time.

## Next step

**Phase 7 — Market Data Service**: the engine that actually populates `MarketData` and `Indicator`
with real OHLCV candles and calculated indicators (RSI, EMA, SMA, MACD, ATR, ADX, CCI, VWAP,
Bollinger Bands, Stochastic, Pivot Points) across multiple timeframes — this is what will finally
make the admin overview's signal count, and the dashboard's mock feed, real.

**Reply "continue" (or request changes to Phase 6) before I start Phase 7.**
