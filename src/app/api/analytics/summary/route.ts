import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import { computeWinRateSummary, type ResolvedRecord } from '@/server/analytics/compute-stats';
import { getOrSetCache } from '@/lib/cache';

const CACHE_TTL_SECONDS = 60;

export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  // Every ACTIVE user sees the same numbers here — this isn't per-user data — so one cache
  // entry serves everyone. A 60s TTL means at most one recomputation per minute regardless of
  // how many dashboard tabs are open, instead of scanning every SignalHistory row on every load.
  const data = await getOrSetCache('analytics:summary', CACHE_TTL_SECONDS, async () => {
    const histories = await prisma.signalHistory.findMany({
      include: { signal: { select: { pair: true, confidenceScore: true } } },
    });

    const records: (ResolvedRecord & { pair: string })[] = histories.map((h) => ({
      outcome: h.outcome,
      closedAt: h.closedAt,
      pnlPips: h.pnlPips,
      confidenceScore: h.signal.confidenceScore,
      pair: h.signal.pair,
    }));

    const overall = computeWinRateSummary(records);

    const byPairMap = new Map<string, ResolvedRecord[]>();
    for (const r of records) {
      const existing = byPairMap.get(r.pair) ?? [];
      existing.push(r);
      byPairMap.set(r.pair, existing);
    }
    const byPair = [...byPairMap.entries()]
      .map(([pair, pairRecords]) => ({ pair, ...computeWinRateSummary(pairRecords) }))
      .sort((a, b) => b.totalResolved - a.totalResolved);

    const totalSignals = await prisma.signal.count();
    const activeSignals = await prisma.signal.count({ where: { status: 'ACTIVE' } });

    return { overall, byPair, totalSignals, activeSignals };
  });

  return NextResponse.json(data);
}
