import type { Candle } from '../types';
import { ema, emaOfSeries } from './ema';

export interface MacdValue {
  macd: number;
  signal: number;
  histogram: number;
}

/** MACD(12, 26, 9) by default — the histogram is what the signal engine (Phase 8) reads for momentum shifts. */
export function macd(
  candles: Candle[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9,
): (MacdValue | null)[] {
  const fastEma = ema(candles, fastPeriod);
  const slowEma = ema(candles, slowPeriod);

  const macdLine: (number | null)[] = candles.map((_, i) => {
    const f = fastEma[i];
    const s = slowEma[i];
    return f != null && s != null ? f - s : null;
  });

  const signalLine = emaOfSeries(macdLine, signalPeriod);

  return candles.map((_, i) => {
    const m = macdLine[i];
    const sig = signalLine[i];
    if (m == null || sig == null) return null;
    return { macd: m, signal: sig, histogram: m - sig };
  });
}
