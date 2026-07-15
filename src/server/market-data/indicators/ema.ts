import type { Candle } from '../types';
import { at } from './safe-index';

/**
 * Exponential Moving Average of closing price, seeded with an SMA of the first `period` closes
 * (the standard approach — an EMA needs a starting point, and seeding with SMA avoids biasing
 * toward whatever the very first close happened to be).
 */
export function ema(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length < period) return result;

  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += at(candles, i).close;
  seed /= period;
  result[period - 1] = seed;

  let prev = seed;
  for (let i = period; i < candles.length; i++) {
    const value = at(candles, i).close * k + prev * (1 - k);
    result[i] = value;
    prev = value;
  }

  return result;
}

/** Same as ema() but operating on an arbitrary numeric series instead of candles (used by MACD's signal line). */
export function emaOfSeries(series: (number | null)[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(series.length).fill(null);
  const values = series.filter((v): v is number => v !== null);
  if (values.length < period) return result;

  const k = 2 / (period + 1);
  const firstValidIndex = series.findIndex((v) => v !== null);

  let seed = 0;
  for (let i = 0; i < period; i++) seed += at(values, i);
  seed /= period;

  let seededAt = -1;
  let count = 0;
  for (let i = firstValidIndex; i < series.length; i++) {
    if (series[i] === null) continue;
    count++;
    if (count === period) {
      seededAt = i;
      break;
    }
  }
  if (seededAt === -1) return result;

  result[seededAt] = seed;
  let prev = seed;
  for (let i = seededAt + 1; i < series.length; i++) {
    const v = series[i];
    if (v === null || v === undefined) continue;
    const value = v * k + prev * (1 - k);
    result[i] = value;
    prev = value;
  }

  return result;
}
