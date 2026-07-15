export interface TimestampedClose {
  timestamp: Date;
  close: number;
}

/**
 * Finds the candle with the latest timestamp that is still <= target, from an array assumed
 * sorted ascending by timestamp. Returns null if every candle is after the target (or the array
 * is empty). Extracted as a pure function specifically so resolve-outcomes.ts can fetch each
 * (pair, timeframe) group's candles ONCE and reuse this in memory per signal, instead of issuing
 * one `findFirst` database query per signal — the real N+1 this phase fixes.
 */
export function findClosestCandleAtOrBefore<T extends TimestampedClose>(
  candles: readonly T[],
  target: Date,
): T | null {
  let result: T | null = null;
  for (const candle of candles) {
    if (candle.timestamp.getTime() <= target.getTime()) {
      result = candle; // candles are ascending, so the last one that still qualifies is the closest
    } else {
      break;
    }
  }
  return result;
}
