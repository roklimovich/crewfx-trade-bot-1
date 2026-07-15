import type { Timeframe } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { logEvent } from '@/server/security/audit-log';
import { getMarketDataProvider } from './providers';
import { CANDLE_LOOKBACK, DEFAULT_PAIRS, DEFAULT_TIMEFRAMES } from './pairs';
import { calculateAndStoreIndicators } from './calculate-indicators';
import type { Candle } from './types';

export interface IngestResult {
  pair: string;
  timeframe: Timeframe;
  candlesStored: number;
  indicatorsStored: number;
  error?: string;
}

/** Ingests one pair/timeframe: fetch → upsert candles → calculate + store indicators. */
export async function ingestPairTimeframe(
  pair: string,
  timeframe: Timeframe,
): Promise<IngestResult> {
  const provider = getMarketDataProvider();

  try {
    const candles = await provider.fetchCandles(pair, timeframe, CANDLE_LOOKBACK);

    if (candles.length === 0) {
      return {
        pair,
        timeframe,
        candlesStored: 0,
        indicatorsStored: 0,
        error: 'No candles returned.',
      };
    }

    await upsertCandles(pair, timeframe, candles);
    const indicatorsStored = await calculateAndStoreIndicators(pair, timeframe, candles);

    return { pair, timeframe, candlesStored: candles.length, indicatorsStored };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown ingestion error';
    await logEvent('ERROR', `Market data ingestion failed for ${pair} ${timeframe}`, {
      context: { error: message },
    });
    return { pair, timeframe, candlesStored: 0, indicatorsStored: 0, error: message };
  }
}

async function upsertCandles(pair: string, timeframe: Timeframe, candles: Candle[]): Promise<void> {
  // Upsert one at a time on the compound unique (pair, timeframe, timestamp) — batched into a
  // transaction so a partial provider response never leaves half-written data.
  await prisma.$transaction(
    candles.map((c) =>
      prisma.marketData.upsert({
        where: { pair_timeframe_timestamp: { pair, timeframe, timestamp: c.timestamp } },
        update: { open: c.open, high: c.high, low: c.low, close: c.close, volume: c.volume },
        create: {
          pair,
          timeframe,
          timestamp: c.timestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
        },
      }),
    ),
  );
}

/** Ingests every configured pair/timeframe combination. Called by the cron-triggered API route. */
export async function ingestAll(
  pairs: readonly string[] = DEFAULT_PAIRS,
  timeframes: readonly Timeframe[] = DEFAULT_TIMEFRAMES,
): Promise<IngestResult[]> {
  const results: IngestResult[] = [];

  // Sequential, not Promise.all — most free-tier market-data APIs (including Twelve Data) rate-limit
  // aggressively per second, and a burst of parallel requests would just trigger 429s.
  for (const pair of pairs) {
    for (const timeframe of timeframes) {
      results.push(await ingestPairTimeframe(pair, timeframe));
    }
  }

  const failures = results.filter((r) => r.error);
  if (failures.length > 0) {
    await logEvent('WARN', `Market data ingestion completed with ${failures.length} failure(s)`, {
      context: { failedPairs: failures.map((f) => `${f.pair} ${f.timeframe}`) },
    });
  }

  return results;
}
