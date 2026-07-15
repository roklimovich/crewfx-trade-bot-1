import type { Candle } from '../../market-data/types';
import type { RuleResult } from '../types';

/**
 * A full swing-point detection algorithm (tracking each local high/low and comparing sequences)
 * is real work that deserves its own pass later. This is a deliberately simpler proxy: split the
 * recent window in half and compare the extremes of each half. Higher highs *and* higher lows in
 * the second half vs the first = uptrend structure; the mirror case = downtrend; anything mixed
 * is treated as unclear structure (bias 0), which is the conservative/safe default.
 */
export function analyzeMarketStructure(candles: Candle[]): RuleResult {
  const windowSize = 20;
  if (candles.length < windowSize) {
    return {
      name: 'market_structure',
      bias: 0,
      strength: 0,
      rationale: 'Not enough candle history for a structure read.',
      skipped: true,
    };
  }

  const window = candles.slice(-windowSize);
  const midpoint = Math.floor(window.length / 2);
  const firstHalf = window.slice(0, midpoint);
  const secondHalf = window.slice(midpoint);

  const firstHigh = Math.max(...firstHalf.map((c) => c.high));
  const firstLow = Math.min(...firstHalf.map((c) => c.low));
  const secondHigh = Math.max(...secondHalf.map((c) => c.high));
  const secondLow = Math.min(...secondHalf.map((c) => c.low));

  const higherHigh = secondHigh > firstHigh;
  const higherLow = secondLow > firstLow;
  const lowerHigh = secondHigh < firstHigh;
  const lowerLow = secondLow < firstLow;

  if (higherHigh && higherLow) {
    return {
      name: 'market_structure',
      bias: 1,
      strength: 0.7,
      rationale: 'Recent structure shows higher highs and higher lows.',
    };
  }
  if (lowerHigh && lowerLow) {
    return {
      name: 'market_structure',
      bias: -1,
      strength: 0.7,
      rationale: 'Recent structure shows lower highs and lower lows.',
    };
  }

  return {
    name: 'market_structure',
    bias: 0,
    strength: 0.2,
    rationale: 'Structure is mixed — no clear sequence of higher/lower highs and lows.',
  };
}
