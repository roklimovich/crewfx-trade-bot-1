import type { Candle } from '../types';
import { at } from './safe-index';

/**
 * Volume-Weighted Average Price, cumulative over the provided candle window.
 * Real VWAP resets each session — the ingestion job (see ../ingest.ts) is responsible for
 * passing in only the current session's candles, not the whole history.
 */
export function vwap(candles: Candle[]): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  let cumulativePv = 0;
  let cumulativeVolume = 0;

  for (let i = 0; i < candles.length; i++) {
    const c = at(candles, i);
    const typicalPrice = (c.high + c.low + c.close) / 3;
    cumulativePv += typicalPrice * c.volume;
    cumulativeVolume += c.volume;
    result[i] = cumulativeVolume > 0 ? cumulativePv / cumulativeVolume : null;
  }

  return result;
}
