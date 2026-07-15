import type { Candle } from '../types';
import { sma } from './sma';

export interface BollingerValue {
  upper: number;
  middle: number;
  lower: number;
}

/** Bollinger Bands(20, 2) — the signal engine reads a squeeze/expansion as a volatility signal. */
export function bollingerBands(
  candles: Candle[],
  period = 20,
  stdDevMultiplier = 2,
): (BollingerValue | null)[] {
  const middleLine = sma(candles, period);
  const result: (BollingerValue | null)[] = new Array(candles.length).fill(null);

  for (let i = period - 1; i < candles.length; i++) {
    const middle = middleLine[i];
    if (middle == null) continue;

    const window = candles.slice(i - period + 1, i + 1);
    const variance = window.reduce((sum, c) => sum + (c.close - middle) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);

    result[i] = {
      upper: middle + stdDevMultiplier * stdDev,
      middle,
      lower: middle - stdDevMultiplier * stdDev,
    };
  }

  return result;
}
