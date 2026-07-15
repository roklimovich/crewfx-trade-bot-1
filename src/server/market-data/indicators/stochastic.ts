import type { Candle } from '../types';
import { at } from './safe-index';

export interface StochasticValue {
  k: number;
  d: number;
}

/** Stochastic Oscillator(14, %K smoothed by 3, %D = SMA(%K, 3)) — flags overbought/oversold conditions. */
export function stochastic(
  candles: Candle[],
  period = 14,
  dPeriod = 3,
): (StochasticValue | null)[] {
  const kValues: (number | null)[] = new Array(candles.length).fill(null);

  for (let i = period - 1; i < candles.length; i++) {
    const window = candles.slice(i - period + 1, i + 1);
    const highestHigh = Math.max(...window.map((c) => c.high));
    const lowestLow = Math.min(...window.map((c) => c.low));
    const range = highestHigh - lowestLow;
    kValues[i] = range === 0 ? 50 : ((at(candles, i).close - lowestLow) / range) * 100;
  }

  // %D is a simple moving average of the last `dPeriod` valid %K values.
  const dValues: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1 + dPeriod - 1) continue;
    const window = kValues.slice(i - dPeriod + 1, i + 1);
    if (window.some((v) => v == null)) continue;
    dValues[i] = (window as number[]).reduce((a, b) => a + b, 0) / dPeriod;
  }

  return candles.map((_, i) => {
    const k = kValues[i];
    const d = dValues[i];
    if (k == null || d == null) return null;
    return { k, d };
  });
}
