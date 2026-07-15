import type { Candle } from '../types';
import { at } from './safe-index';

/** True Range for a single candle relative to the previous close. */
function trueRange(current: Candle, previous: Candle): number {
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - previous.close),
    Math.abs(current.low - previous.close),
  );
}

/** Average True Range — a volatility measure the signal engine uses to size risk (Phase 8). */
export function atr(candles: Candle[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  let sum = 0;
  for (let i = 1; i <= period; i++) sum += trueRange(at(candles, i), at(candles, i - 1));
  let prevAtr = sum / period;
  result[period] = prevAtr;

  for (let i = period + 1; i < candles.length; i++) {
    const tr = trueRange(at(candles, i), at(candles, i - 1));
    prevAtr = (prevAtr * (period - 1) + tr) / period;
    result[i] = prevAtr;
  }

  return result;
}

export { trueRange };
