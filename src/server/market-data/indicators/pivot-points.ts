import type { Candle } from '../types';
import { at } from './safe-index';

export interface PivotPointsValue {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

/**
 * Standard (floor trader) pivot points, calculated from the *previous* candle's high/low/close.
 * Each candle's pivot set describes the support/resistance levels traders watch for the period
 * that follows it — so result[i] is derived from candles[i - 1], not candles[i].
 */
export function pivotPoints(candles: Candle[]): (PivotPointsValue | null)[] {
  return candles.map((_, i) => {
    if (i === 0) return null;
    const prev = at(candles, i - 1);
    const pivot = (prev.high + prev.low + prev.close) / 3;
    const range = prev.high - prev.low;

    return {
      pivot,
      r1: 2 * pivot - prev.low,
      s1: 2 * pivot - prev.high,
      r2: pivot + range,
      s2: pivot - range,
      r3: prev.high + 2 * (pivot - prev.low),
      s3: prev.low - 2 * (prev.high - pivot),
    };
  });
}
