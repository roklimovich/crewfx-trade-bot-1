# SignalForge — Phase 7: Market Data Service

## Two different "TradingView" things, and why both are here

This phase deliberately uses TradingView in two completely different ways:

1. **Display**: `src/components/dashboard/tradingview-chart.tsx` embeds TradingView's free
   **Advanced Chart widget** (`s3.tradingview.com/tv.js`). This is a client-side script — the
   browser loads it directly from TradingView's CDN and renders a live, professional chart with
   RSI/MACD studies built in. No API key, no approval process, no data ever touches our server.
2. **Backend data collection**: `src/server/market-data/` is a completely separate pipeline that
   fetches real OHLCV candles from **Twelve Data** (per your call), stores them in `MarketData`,
   and calculates real indicators server-side into `Indicator`. TradingView has no public API for
   this — their widget is display-only and doesn't expose data to a server, so this had to be a
   different, licensed provider.

The dashboard's live chart (TradingView) and the actual signal-generation data (Twelve Data →
`MarketData`/`Indicator`) are independent today. Phase 8's signal engine will read from the
database, not from what's rendered in the TradingView widget.

## What was implemented

```
src/server/market-data/
  types.ts                     → Candle interface, shared by every indicator + provider
  pairs.ts                      → DEFAULT_PAIRS (11 to start), DEFAULT_TIMEFRAMES, lookback size
  ingest.ts                      → ingestPairTimeframe() and ingestAll(): fetch → upsert
                                     MarketData → calculate + store Indicator, sequential
                                     (not parallel — free-tier APIs rate-limit per second)
  calculate-indicators.ts          → runs all 11 indicators over a candle window, stores the
                                       latest valid value per type (see schema note below)

  indicators/                        → pure, dependency-free math — no Prisma, no fetch
    sma.ts, ema.ts, rsi.ts, macd.ts, atr.ts, adx.ts, cci.ts, vwap.ts,
    bollinger-bands.ts, stochastic.ts, pivot-points.ts
    safe-index.ts                    → at() helper satisfying noUncheckedIndexedAccess honestly
    __tests__/indicators.test.ts     → 14 tests, all passing (see below)

  providers/
    types.ts        → MarketDataProvider interface — swap providers without touching ingest.ts
    twelve-data.ts    → real Twelve Data REST client
    index.ts            → getMarketDataProvider() factory

src/app/api/market-data/
  ingest/route.ts    → GET (Vercel Cron) + POST (manual admin trigger), both run the same pipeline
  candles/route.ts     → GET stored candles + latest indicators for a pair/timeframe

src/components/dashboard/
  tradingview-chart.tsx   → the widget itself
  live-chart-section.tsx    → pair/timeframe selector wrapping the chart, added to the dashboard overview

src/lib/tradingview-symbols.ts   → maps our "EUR/USD" format to TradingView's "FX:EURUSD"

vercel.json   → added a `crons` entry hitting /api/market-data/ingest every 5 minutes
```

## Indicator math is actually tested, not just written

Unlike most of this project (which I've verified with `tsc`/`eslint`/`next build` since I can't
reach most external services from this sandbox), the indicator math has **zero external
dependencies** — no network, no database — so I could write and run real unit tests:

```
Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
```

Coverage: SMA/EMA against hand-computed values, RSI at the 0/100 extremes (pure up/down trends),
MACD histogram sign during a sustained trend, ATR converging to a known constant true range, ADX
+DI/-DI ordering in a trend, CCI at exactly 0 for a flat market, VWAP against a hand-computed
two-candle example, Bollinger Bands collapsing to a single value at zero volatility, Stochastic
%K/%D at the 0/100 extremes, and Pivot Points against the textbook formula. One real bug surfaced
and got fixed during this: the Stochastic test data didn't give `%D` enough lookback, which is a
genuinely easy mistake to make with this indicator (it needs `period - 1 + dPeriod - 1` candles,
not just `period - 1`).

## A real schema limitation, documented rather than hidden

`Indicator`'s unique key is `(pair, timeframe, type, timestamp)` — **one value per indicator type
per candle**, not per `(type, period)`. That means the current schema can't store, say, EMA(20)
_and_ EMA(50) simultaneously — only one EMA period at a time. This phase uses fixed canonical
periods (EMA 50, SMA 20, RSI 14, MACD 12/26/9, ATR 14, ADX 14, CCI 20, Bollinger 20/2, Stochastic
14/3, standard Pivot Points), documented at the top of `calculate-indicators.ts`. If you need
multiple periods of the same indicator tracked at once, `Indicator` needs a `period Int` column
added to both the model and its unique constraint — that's a real schema change, not something to
route around quietly.

## Also worth knowing

- **Only the latest indicator value is stored per run**, not a full recalculated history — this
  keeps per-run write volume small (11 upserts per pair/timeframe instead of ~2,000). Full
  historical indicator backfill for backtesting is a deliberate omission, not an oversight — noted
  in `calculate-indicators.ts` for whoever picks it up later (possibly Phase 11).
- **Vercel Cron on the Hobby plan only supports daily schedules** — the `*/5 * * * *` in
  `vercel.json` needs a Pro plan to actually run every 5 minutes. On Hobby, either upgrade or
  trigger `/api/market-data/ingest` manually (as an admin, via POST) until you do.
- The CSP headers from Phase 3 (`next.config.mjs`) needed updating to allow TradingView's script
  and iframe — done here, since the widget would otherwise get silently blocked by the browser.

## Verified in this environment

- ✅ 14/14 indicator unit tests pass — real math verification, no network needed.
- ✅ `eslint` clean.
- ✅ `next build` — webpack compiled successfully (font-stubbed, as in every prior phase); the
  only failure is the same known Prisma-stub wall.
- ⚠️ **Not verified**: an actual live call to Twelve Data's API, since `api.twelvedata.com` isn't
  reachable from this sandbox. The request-building code (`twelve-data.ts`) follows their
  documented `/time_series` endpoint exactly, but you'll want to confirm it against a real API key
  before relying on it — this is the one piece of this phase I couldn't test end-to-end myself.

## Also in this update: role-based post-login redirect

Per your note — `src/app/(auth)/login/page.tsx` now sends ADMIN/MODERATOR accounts to `/admin`
and everyone else to `/dashboard` after a successful login, unless middleware had already bounced
them from a specific protected page (`?redirect=...`), in which case that takes priority.

## What you can edit right now

- `.env` — set `MARKET_DATA_API_KEY` to a real Twelve Data key to actually start collecting data.
- `src/server/market-data/pairs.ts` — `DEFAULT_PAIRS` is a starting list of 11; grow it once
  you've confirmed provider coverage and cost for the pairs you actually want.

## Next step

**Phase 8 — Trading Signal Engine**: the rule-based engine that reads `MarketData`/`Indicator`
and generates actual `Signal` rows — multi-indicator confirmation, market-structure/liquidity
checks, confidence scoring, and the "hold back during low-confidence/ranging conditions" rule from
your original spec.

**Reply "continue" (or request changes to Phase 7) before I start Phase 8.**
