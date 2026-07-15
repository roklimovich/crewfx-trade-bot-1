import type { Timeframe, IndicatorType } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import type { Candle } from './types';
import {
  sma,
  ema,
  rsi,
  macd,
  atr,
  adx,
  cci,
  vwap,
  bollingerBands,
  stochastic,
  pivotPoints,
} from './indicators';
import { at } from './indicators/safe-index';

/**
 * Canonical period per indicator type. The `Indicator` model's unique key is
 * (pair, timeframe, type, timestamp) — one value per type per candle, not per (type, period).
 * That means only a single EMA period (or SMA, or any other parameterized indicator) can be
 * stored at a time under the current schema. These are the periods this ingestion job uses:
 * EMA(50), SMA(20), RSI(14), MACD(12,26,9), ATR(14), ADX(14), CCI(20), Bollinger(20,2),
 * Stochastic(14,3), Pivot Points (standard). If you need multiple EMA periods tracked
 * simultaneously (e.g. 20 *and* 50), the schema needs a `period Int` column added to `Indicator`
 * and included in the unique constraint — noted in Phase 7 docs, not built here.
 */

interface IndicatorRow {
  type: IndicatorType;
  value: unknown;
  timestamp: Date;
}

/**
 * Calculates every indicator over the given candle window and stores only the *latest* valid
 * value per type — this is what the signal engine (Phase 8) actually needs to make a decision.
 * Full historical backfill of indicator values (useful for backtesting) isn't done here to keep
 * per-run write volume small; see the note above for how to extend it.
 */
export async function calculateAndStoreIndicators(
  pair: string,
  timeframe: Timeframe,
  candles: Candle[],
): Promise<number> {
  const rows: IndicatorRow[] = [];

  pushLatest(rows, 'SMA', sma(candles, 20), candles);
  pushLatest(rows, 'EMA', ema(candles, 50), candles);
  pushLatest(rows, 'RSI', rsi(candles, 14), candles);
  pushLatest(rows, 'MACD', macd(candles), candles);
  pushLatest(rows, 'ATR', atr(candles, 14), candles);
  pushLatest(rows, 'ADX', adx(candles, 14), candles);
  pushLatest(rows, 'CCI', cci(candles, 20), candles);
  pushLatest(rows, 'VWAP', vwap(candles), candles);
  pushLatest(rows, 'BOLLINGER_BANDS', bollingerBands(candles, 20, 2), candles);
  pushLatest(rows, 'STOCHASTIC', stochastic(candles, 14, 3), candles);
  pushLatest(rows, 'PIVOT_POINTS', pivotPoints(candles), candles);

  if (rows.length === 0) return 0;

  await prisma.$transaction(
    rows.map((row) =>
      prisma.indicator.upsert({
        where: {
          pair_timeframe_type_timestamp: {
            pair,
            timeframe,
            type: row.type,
            timestamp: row.timestamp,
          },
        },
        update: { value: row.value as never },
        create: {
          pair,
          timeframe,
          type: row.type,
          timestamp: row.timestamp,
          value: row.value as never,
        },
      }),
    ),
  );

  return rows.length;
}

/** Finds the last non-null value in a computed series and appends it as a storable row, if any. */
function pushLatest<T>(
  rows: IndicatorRow[],
  type: IndicatorType,
  series: (T | null)[],
  candles: Candle[],
): void {
  for (let i = series.length - 1; i >= 0; i--) {
    const value = at(series, i);
    if (value !== null && value !== undefined) {
      rows.push({ type, value, timestamp: at(candles, i).timestamp });
      return;
    }
  }
}
