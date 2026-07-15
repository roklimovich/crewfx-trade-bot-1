# SignalForge — Phase 11: Signal History & Analytics

## The gap this phase closes

Phases 8 and 9 both flagged the same honest limitation in their docs: expired signals sat at
`SignalHistory.outcome = PENDING` forever, because nothing ever went back and checked what price
actually did. That's the first thing this phase fixes.

## What was implemented

```
src/server/signal-engine/
  evaluate-outcome.ts     → pure function: entry price + direction + price-at-expiration → WIN/LOSS/BREAK_EVEN
  resolve-outcomes.ts       → orchestrator: finds stale ACTIVE signals, looks up the closest
                               candle at-or-before expiration, resolves real outcomes

  __tests__/evaluate-outcome.test.ts   → 6 tests: BUY/SELL win/loss (direction correctly
                                          inverted for SELL), break-even threshold, JPY pip sizing

src/server/analytics/
  compute-stats.ts       → computeWinRateSummary(), groupByPeriod() (daily/weekly/monthly ISO buckets)
  signal-query.ts           → shared filter-building, used by both the list and export endpoints

  __tests__/compute-stats.test.ts   → 9 tests covering the win-rate formula, period bucketing,
                                        chronological sorting, PENDING exclusion

src/lib/csv.ts   → extracted, tested CSV builder (RFC 4180 escaping) — used by the export endpoint
  __tests__/csv.test.ts   → 7 tests: commas, quotes, newlines, null handling

src/app/api/
  analytics/summary/route.ts       → overall win rate + per-pair breakdown, from real data
  analytics/performance/route.ts     → daily/weekly/monthly buckets for the chart
  signals/route.ts                     → now supports direction/dateFrom/dateTo/search + real
                                          pagination (superset of Phase 8's original filters)
  signals/export/route.ts                → CSV export, same filters as the list endpoint

src/app/(dashboard)/dashboard/
  page.tsx           → rewritten as a server component querying Prisma directly (same pattern as
                        the admin overview) — real active-signal count, real win rate, real avg
                        confidence, no more mock-data.ts
  signals/page.tsx      → rewritten with real status/pair/search filters, pagination, and a CSV
                           export button

src/components/dashboard/
  performance-chart.tsx        → now self-contained: fetches its own data, has a
                                  Daily/Weekly/Monthly toggle
  pair-breakdown-table.tsx       → new — win rate, W/L/BE counts, and avg pips per pair
  signal-feed.tsx                  → generalized from MockSignal to a shared SignalFeedItem type

src/lib/mock-data.ts   → DELETED. Every page that used it now uses real data; nothing imports it anymore.
```

## The outcome-evaluation methodology, stated plainly

`evaluateOutcome()` compares entry price to the closing price of the candle at (or nearest before)
expiration. That's **not** a take-profit/stop-loss simulation — the `Signal` model never defined
explicit TP/SL levels back in Phase 2, so "did the market end up favorable by the time the signal
expired" is the most defensible outcome definition available from what's actually stored. A more
sophisticated engine with real TP/SL levels would check whether price _touched_ those levels
during the window, not just where it ended up — a real, meaningful difference, documented as a
known simplification rather than silently pretending this does more than it does.

`Signal.status` now genuinely becomes `WON` or `LOST` (not just `EXPIRED`) when an outcome could
be determined — `EXPIRED` is reserved for a break-even result (the schema has no `BREAK_EVEN`
status of its own) or the case where market data had a gap and no candle existed near expiration
to judge against. In that last case, `SignalHistory.outcome` stays `PENDING` rather than guessing.

## "Win rate" and "accuracy" are the same number here

Your original spec listed these as separate bullets. I deliberately did **not** invent two
different formulas to produce two official-looking-but-different percentages — for a rule-based
signal engine, manufacturing a second "accuracy" metric with its own arbitrary weighting would
create false precision, not real insight. `computeWinRateSummary()` is documented as the single
source for both concepts: `WIN / (WIN + LOSS)`, with `BREAK_EVEN` excluded from both sides of the
ratio and unresolved (`PENDING`) records excluded entirely.

## Verified in this environment

- ✅ **78/78 tests pass** (22 new this phase: 6 outcome-evaluation, 9 analytics, 7 CSV). Every one
  of these is a pure function tested with zero network/DB dependency — genuinely verified logic,
  not just code that compiles.
- ✅ `eslint` clean, `next build` — webpack compiled successfully before hitting the same known
  Prisma-stub wall from every prior phase (this time surfacing as an implicit-`any` on
  `histories.map()` in the new dashboard page — same root cause, not a new category of issue).

## What you can edit right now

- `src/server/signal-engine/evaluate-outcome.ts` → `BREAK_EVEN_THRESHOLD_PIPS` (currently 0.5) —
  how much price movement counts as "actually decisive" vs. a wash.
- `/dashboard/signals` → the CSV export respects whatever filters are currently applied in the UI
  (status, pair, search) — try filtering to one pair and exporting to see the full pipeline work
  end-to-end once you have real data flowing.

## Next step

**Phase 12 — Performance Optimization**: Redis caching, lazy loading, code splitting, dynamic
imports, image optimization, Suspense/streaming, background jobs, and efficient database queries —
a good moment to revisit some of the sequential-loop patterns in the market-data/signal-engine
pipeline (Phases 7–8) now that there's real load to optimize against.

**Reply "continue" (or request changes to Phase 11) before I start Phase 12.**
