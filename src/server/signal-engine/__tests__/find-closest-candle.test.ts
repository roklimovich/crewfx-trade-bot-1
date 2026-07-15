import { findClosestCandleAtOrBefore } from '../find-closest-candle';

function candle(isoTime: string, close: number) {
  return { timestamp: new Date(isoTime), close };
}

describe('findClosestCandleAtOrBefore', () => {
  const candles = [
    candle('2026-07-12T10:00:00Z', 1.08),
    candle('2026-07-12T10:15:00Z', 1.081),
    candle('2026-07-12T10:30:00Z', 1.082),
    candle('2026-07-12T10:45:00Z', 1.083),
  ];

  it('returns the exact match when the target equals a candle timestamp', () => {
    const result = findClosestCandleAtOrBefore(candles, new Date('2026-07-12T10:15:00Z'));
    expect(result?.close).toBe(1.081);
  });

  it('returns the closest earlier candle when the target falls between two candles', () => {
    const result = findClosestCandleAtOrBefore(candles, new Date('2026-07-12T10:20:00Z'));
    expect(result?.close).toBe(1.081);
  });

  it('returns the last candle when the target is after every candle', () => {
    const result = findClosestCandleAtOrBefore(candles, new Date('2026-07-12T23:00:00Z'));
    expect(result?.close).toBe(1.083);
  });

  it('returns null when every candle is after the target', () => {
    const result = findClosestCandleAtOrBefore(candles, new Date('2026-07-12T00:00:00Z'));
    expect(result).toBeNull();
  });

  it('returns null for an empty array', () => {
    expect(findClosestCandleAtOrBefore([], new Date())).toBeNull();
  });
});
