import type { Candle } from '../types';
import { at } from './safe-index';

/** Simple Moving Average of closing price. Returns one value per candle; null where lookback is insufficient. */
export function sma(candles: Candle[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  let sum = 0;

  for (let i = 0; i < candles.length; i++) {
    sum += at(candles, i).close;
    if (i >= period) sum -= at(candles, i - period).close;
    if (i >= period - 1) result[i] = sum / period;
  }

  return result;
}
