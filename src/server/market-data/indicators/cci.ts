import type { Candle } from '../types';
import { at } from './safe-index';

function typicalPrice(c: Candle): number {
  return (c.high + c.low + c.close) / 3;
}

/** Commodity Channel Index — flags extreme moves relative to a rolling mean deviation. */
export function cci(candles: Candle[], period = 20): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);

  for (let i = period - 1; i < candles.length; i++) {
    const window = candles.slice(i - period + 1, i + 1);
    const typicalPrices = window.map(typicalPrice);
    const meanTp = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = typicalPrices.reduce((a, b) => a + Math.abs(b - meanTp), 0) / period;

    if (meanDeviation === 0) {
      result[i] = 0;
      continue;
    }

    result[i] = (typicalPrice(at(candles, i)) - meanTp) / (0.015 * meanDeviation);
  }

  return result;
}
