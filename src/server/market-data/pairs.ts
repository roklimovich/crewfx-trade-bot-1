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
  'XAU/USD',
] as const;

/** Kept in sync with the seeded `signal.default_timeframes` platform setting (see prisma/seed.ts). */
export const DEFAULT_TIMEFRAMES: Timeframe[] = ['M5', 'M15', 'H1'];

/** How many candles to keep in the lookback window fed to indicator calculations. */
export const CANDLE_LOOKBACK = 200;
