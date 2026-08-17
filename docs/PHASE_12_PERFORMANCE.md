# CrewFX — Phase 12: Performance Optimization

## Approach: real bottlenecks, not a checkbox list

Your original spec listed nine things to implement. Rather than superficially touching each one,
I audited the actual codebase for where these would matter and applied them where they have real
effect — and I'm explicit below about the couple of items that don't have anything meaningful to
optimize yet, rather than inventing busywork to look complete.

## Redis Cache

`src/lib/cache.ts` — a generic cache-aside helper, `getOrSetCache(key, ttlSeconds, fn)`. Applied to:

- `/api/analytics/summary` — was recomputing win rate across **every** `SignalHistory` row on
  every request. Now cached for 60s.
- `/api/analytics/performance` — same treatment, cached per period (`daily`/`weekly`/`monthly` get
  separate cache keys).

**Fails open** on any Redis error, same precedent as the Phase 3 rate limiter and Phase 10's
realtime publishing — a cache is a performance optimization, never a correctness dependency.

**Cache invalidation**: `resolveExpiredSignals()` (Phase 11) now calls `invalidateCacheByPrefix('analytics:')`
whenever it actually resolves a new outcome, so users don't wait out the 60s TTL to see fresh
numbers after a signal closes. I used Redis `SCAN` for this, not `KEYS` — `KEYS` blocks the entire
Redis event loop at scale, which would be an ironic thing to ship in a performance-focused phase.

## Efficient database queries — a real N+1 fix

`resolveExpiredSignals()` (Phase 11) used to run one `MarketData` query **per stale signal** to
find the candle at expiration. Multiple signals commonly share a pair/timeframe (several EUR/USD
M15 signals from different generation runs, for example), so this phase groups stale signals by
`(pair, timeframe)` first, fetches each group's candles **once**, and finds each signal's closest
candle in memory via a new pure function, `findClosestCandleAtOrBefore()` — tested with 5 unit
tests (exact match, between-candles, target-after-everything, target-before-everything, empty
array). This turns what used to be _N_ database round-trips into _(number of distinct
pair/timeframe combinations among stale signals)_.

Also added: `SignalHistory.closedAt` index (was missing — Phase 11 introduced date-based analytics
queries against this column without one).

## Lazy Loading / Code Splitting / Dynamic Imports

Two components genuinely justified pulling out of the initial bundle:

- **`TradingViewChart`** (Phase 7) — loads a third-party script and only matters once actually
  visible. Now `next/dynamic` with `ssr: false` (it reaches for `window`/`document` anyway) and a
  loading skeleton.
- **recharts** (Phase 5/11's win-rate chart) — extracted the chart itself into
  `win-rate-area-chart.tsx` and dynamically imported it from `performance-chart.tsx`, so recharts'
  JS ships in its own chunk instead of the main dashboard bundle.

## Suspense / Streaming

The dashboard overview page (Phase 11) was one big `async` Server Component — the whole page
waited on every Prisma query before sending any HTML. Split into:

- `StatsRow` (own async Server Component, own Prisma queries) — wrapped in `<Suspense fallback={<StatsRowSkeleton />}>`
- `RecentSignalsSection` (same pattern) — wrapped in its own `<Suspense>`

The page shell now streams immediately; each section fills in independently as its own queries
resolve, instead of the slowest query gating everything. Also added `loading.tsx` for both the
`(dashboard)` and `(admin)` route groups — the Next.js App Router convention for an instant
skeleton during navigation, before any server component even starts fetching.

## Background Jobs — an honesty note, not a rewrite

The ingest → generate → analyze → notify pipeline (Phases 7–10) already runs as a background job
in the sense that matters for this deployment model: a Vercel Cron-triggered route, not something
a user's request blocks on. What I did **not** do is pretend that's the same thing as a real job
queue. Added `export const maxDuration = 60` to both pipeline routes with a code comment explaining
exactly why: at real scale, splitting each pair/timeframe into its own parallel job (via something
like BullMQ against the Redis this project already depends on) is the architecturally correct next
step — not a bigger `maxDuration` number. That's a genuine infrastructure change beyond what
"implement background jobs" asked for at this project's current complexity level, so I documented
the ceiling clearly instead of either ignoring it or scope-creeping into a job-queue rewrite
nobody asked for yet.

## Image Optimization — nothing to optimize yet, said plainly

This app has no raster images to optimize. The landing page uses SVG icons and CSS-only avatar
initials (Phase 4); the only `next/image` usage is the base64 2FA QR code (Phase 3), already
correctly marked `unoptimized` since data URLs bypass Next's image pipeline anyway.
`next.config.mjs`'s `images.remotePatterns` is already configured and ready for whenever real
images show up (e.g. user avatar uploads). Claiming to have "optimized images" that don't exist
would be a fabricated deliverable — flagged here honestly instead.

## Verified in this environment

- ✅ **83/83 tests pass** (5 new: `findClosestCandleAtOrBefore`'s five scenarios).
- ✅ `eslint` clean, `next build` webpack-compiles successfully; the only failure is the same known
  Prisma-stub wall from every prior phase.

## What you can edit right now

- `src/app/api/market-data/ingest/route.ts` → `maxDuration` — raise this if you're on a Vercel
  Pro/Enterprise plan and `DEFAULT_PAIRS` grows large enough to need more than 60s.
- `src/lib/cache.ts` → the 60s TTL on analytics caching is a reasonable default; tighten it if you
  want fresher numbers at the cost of more DB load, or loosen it for the opposite tradeoff.

## Next step

**Phase 13 — API**: a complete, documented REST API surface with OpenAPI/Swagger generation —
formalizing the ~25 routes built across Phases 3–12 into a spec real API consumers (not just this
app's own frontend) could integrate against.

**Reply "continue" (or request changes to Phase 12) before I start Phase 13.**
