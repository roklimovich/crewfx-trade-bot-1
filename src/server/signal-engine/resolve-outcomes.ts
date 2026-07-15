import { prisma } from '@/server/db/prisma';
import { logEvent } from '@/server/security/audit-log';
import { invalidateCacheByPrefix } from '@/lib/cache';
import { evaluateOutcome } from './evaluate-outcome';
import { findClosestCandleAtOrBefore } from './find-closest-candle';

export interface ResolveOutcomesResult {
  resolved: number;
  unresolvable: number; // expired but no market data existed to judge the outcome
}

/**
 * Finds every ACTIVE signal whose expirationTime has passed, looks up the closest MarketData
 * candle at-or-before that expiration, and resolves its real outcome. Signal.status becomes
 * WON or LOST when an outcome could be determined (matching SignalOutcome), or EXPIRED when it
 * couldn't (e.g. market data ingestion had a gap) — in the "couldn't determine" case,
 * SignalHistory.outcome stays PENDING rather than guessing. A BREAK_EVEN outcome also sets
 * status to EXPIRED, since SignalStatus has no BREAK_EVEN value of its own.
 *
 * Performance note (Phase 12): candles are fetched ONCE per unique (pair, timeframe) among the
 * stale signals, not once per signal — several stale signals commonly share a pair/timeframe
 * (e.g. multiple EUR/USD M15 signals from different generation runs), so this turns what used to
 * be N database round-trips into "number of distinct pair/timeframe combinations," with the
 * actual closest-candle matching done in memory via findClosestCandleAtOrBefore().
 */
export async function resolveExpiredSignals(): Promise<ResolveOutcomesResult> {
  const staleSignals = await prisma.signal.findMany({
    where: { status: 'ACTIVE', expirationTime: { lte: new Date() } },
  });

  if (staleSignals.length === 0) {
    return { resolved: 0, unresolvable: 0 };
  }

  // Group by pair+timeframe so each combination's candles are fetched exactly once.
  const groups = new Map<string, typeof staleSignals>();
  for (const signal of staleSignals) {
    const key = `${signal.pair}__${signal.timeframe}`;
    const existing = groups.get(key) ?? [];
    existing.push(signal);
    groups.set(key, existing);
  }

  let resolved = 0;
  let unresolvable = 0;

  for (const groupSignals of groups.values()) {
    const { pair, timeframe } = groupSignals[0]!;
    const latestExpiration = groupSignals.reduce(
      (latest, s) => (s.expirationTime > latest ? s.expirationTime : latest),
      groupSignals[0]!.expirationTime,
    );

    // One query covers every signal in this pair/timeframe group.
    const candles = await prisma.marketData.findMany({
      where: { pair, timeframe, timestamp: { lte: latestExpiration } },
      orderBy: { timestamp: 'asc' },
      select: { timestamp: true, close: true },
    });

    const updates = groupSignals.map(async (signal) => {
      const candle = findClosestCandleAtOrBefore(candles, signal.expirationTime);

      if (!candle) {
        await prisma.signal.update({ where: { id: signal.id }, data: { status: 'EXPIRED' } });
        unresolvable++;
        return;
      }

      const { outcome, pnlPips } = evaluateOutcome({
        pair: signal.pair,
        direction: signal.direction,
        entryPrice: signal.entryPrice,
        closePriceAtExpiration: candle.close,
      });

      const status = outcome === 'WIN' ? 'WON' : outcome === 'LOSS' ? 'LOST' : 'EXPIRED';

      await prisma.$transaction([
        prisma.signal.update({ where: { id: signal.id }, data: { status } }),
        prisma.signalHistory.upsert({
          where: { signalId: signal.id },
          update: { outcome, closePrice: candle.close, pnlPips, closedAt: new Date() },
          create: {
            signalId: signal.id,
            outcome,
            closePrice: candle.close,
            pnlPips,
            closedAt: new Date(),
          },
        }),
      ]);
      resolved++;
    });

    // Independent writes within a group — safe to run concurrently.
    await Promise.all(updates);
  }

  await logEvent(
    'INFO',
    `Resolved ${resolved} expired signal outcome(s), ${unresolvable} unresolvable`,
    {
      context: { resolved, unresolvable },
    },
  );

  if (resolved > 0) {
    // New outcomes exist — don't make users wait out the analytics cache TTL to see them.
    await invalidateCacheByPrefix('analytics:');
  }

  return { resolved, unresolvable };
}
