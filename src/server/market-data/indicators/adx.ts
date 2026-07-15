import type { Candle } from '../types';
import { trueRange } from './atr';
import { at } from './safe-index';

export interface AdxValue {
  adx: number;
  plusDi: number;
  minusDi: number;
}

/**
 * Average Directional Index — measures trend *strength* (not direction). The signal engine
 * (Phase 8) uses this to avoid firing signals in a directionless, ranging market.
 */
export function adx(candles: Candle[], period = 14): (AdxValue | null)[] {
  const result: (AdxValue | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period * 2) return result;

  const plusDm: number[] = [0];
  const minusDm: number[] = [0];
  const tr: number[] = [0];

  for (let i = 1; i < candles.length; i++) {
    const curr = at(candles, i);
    const prev = at(candles, i - 1);
    const upMove = curr.high - prev.high;
    const downMove = prev.low - curr.low;
    plusDm.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDm.push(downMove > upMove && downMove > 0 ? downMove : 0);
    tr.push(trueRange(curr, prev));
  }

  // Wilder smoothing of TR / +DM / -DM over the first `period` values.
  let smoothedTr = tr.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smoothedPlusDm = plusDm.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let smoothedMinusDm = minusDm.slice(1, period + 1).reduce((a, b) => a + b, 0);

  const dxValues: number[] = [];

  for (let i = period + 1; i < candles.length; i++) {
    smoothedTr = smoothedTr - smoothedTr / period + at(tr, i);
    smoothedPlusDm = smoothedPlusDm - smoothedPlusDm / period + at(plusDm, i);
    smoothedMinusDm = smoothedMinusDm - smoothedMinusDm / period + at(minusDm, i);

    const plusDi = (smoothedPlusDm / smoothedTr) * 100;
    const minusDi = (smoothedMinusDm / smoothedTr) * 100;
    const dx = (Math.abs(plusDi - minusDi) / (plusDi + minusDi || 1)) * 100;
    dxValues.push(dx);

    if (dxValues.length === period) {
      const initialAdx = dxValues.reduce((a, b) => a + b, 0) / period;
      result[i] = { adx: initialAdx, plusDi, minusDi };
    } else if (dxValues.length > period) {
      const prevResult = result[i - 1];
      const prevAdx = prevResult ? prevResult.adx : at(dxValues, dxValues.length - 2);
      const smoothedAdx = (prevAdx * (period - 1) + dx) / period;
      result[i] = { adx: smoothedAdx, plusDi, minusDi };
    }
  }

  return result;
}
