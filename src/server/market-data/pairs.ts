import type { Timeframe } from '@prisma/client';

/**
 * Pairs the ingestion job collects by default. Matches the landing page's "40+ pairs" claim
 * loosely — start smaller and real, grow this list as you validate provider coverage/cost.
 */
export const DEFAULT_PAIRS = [
  'EUR/USD',
  'GBP/USD',
  'USD/JPY',
  'USD/CHF',
  'AUD/USD',
  'USD/CAD',
  'NZD/USD',
  'EUR/GBP',
  'EUR/JPY',
  'GBP/JPY',
  'EUR/AUD',
  'GBP/AUD',
  'XAU/USD',
] as const;

/** Kept in sync with the seeded `signal.default_timeframes` platform setting (see prisma/seed.ts). */
export const DEFAULT_TIMEFRAMES: Timeframe[] = ['M1', 'M5', 'M15', 'H1'];

/**
 * Returns only the candle intervals that can have changed at `now`.
 *
 * The ingestion endpoint is invoked every minute. Re-fetching every timeframe every minute
 * wastes provider quota and makes a supposedly live service rate-limit itself. M1 is updated
 * on every pass, while higher timeframes are refreshed only after their candle boundary.
 */
export function timeframesDueAt(now: Date = new Date()): Timeframe[] {
  const minute = now.getUTCMinutes();
  return DEFAULT_TIMEFRAMES.filter((timeframe) => {
    if (timeframe === 'M1') return true;
    if (timeframe === 'M5') return minute % 5 === 0;
    if (timeframe === 'M15') return minute % 15 === 0;
    if (timeframe === 'M30') return minute % 30 === 0;
    if (timeframe === 'H1') return minute === 0;
    if (timeframe === 'H4') return minute === 0 && now.getUTCHours() % 4 === 0;
    return minute === 0 && now.getUTCHours() === 0; // D1
  });
}

/** How many candles to keep in the lookback window fed to indicator calculations. */
export const CANDLE_LOOKBACK = 200;
