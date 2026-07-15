import type { Timeframe } from '@prisma/client';
import { DEFAULT_PAIRS, DEFAULT_TIMEFRAMES } from '../market-data/pairs';
import { generateSignalForPairTimeframe, type GenerateSignalResult } from './generate-signal';
import { resolveExpiredSignals } from './resolve-outcomes';

export async function generateAllSignals(
  pairs: readonly string[] = DEFAULT_PAIRS,
  timeframes: readonly Timeframe[] = DEFAULT_TIMEFRAMES,
): Promise<GenerateSignalResult[]> {
  // Resolve outcomes for anything that expired since the last run (Phase 11) before generating
  // anything new — this is what finally closes the loop Phase 8 left open (SignalHistory sitting
  // at PENDING forever).
  await resolveExpiredSignals();

  const results: GenerateSignalResult[] = [];

  for (const pair of pairs) {
    for (const timeframe of timeframes) {
      results.push(await generateSignalForPairTimeframe(pair, timeframe));
    }
  }

  return results;
}
