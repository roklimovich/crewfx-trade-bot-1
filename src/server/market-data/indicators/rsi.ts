import type { Candle } from '../types';
import { at } from './safe-index';

/** Relative Strength Index (Wilder's smoothing method, the standard RSI(14) calculation). */
export function rsi(candles: Candle[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = at(candles, i).close - at(candles, i - 1).close;
    if (change > 0) avgGain += change;
    else avgLoss += -change;
  }
  avgGain /= period;
  avgLoss /= period;

  result[period] = computeRsi(avgGain, avgLoss);

  for (let i = period + 1; i < candles.length; i++) {
    const change = at(candles, i).close - at(candles, i - 1).close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    // Wilder's smoothing: each new value is a weighted blend of the running average and the latest change.
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    result[i] = computeRsi(avgGain, avgLoss);
  }

  return result;
}

function computeRsi(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}
