import { Radar, Trophy, Activity, Gauge } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { prisma } from '@/server/db/prisma';
import { computeWinRateSummary, type ResolvedRecord } from '@/server/analytics/compute-stats';

/**
 * Its own async Server Component (rather than inline in the page) specifically so it can be
 * wrapped in a <Suspense> boundary — see Phase 12's streaming notes in the overview page. This
 * section's Prisma queries can resolve independently of the recent-signals section below it,
 * so a slow one doesn't block the other from appearing.
 */
export async function StatsRow() {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [activeSignals, signalsToday, histories, avgConfidenceResult] = await Promise.all([
    prisma.signal.count({ where: { status: 'ACTIVE' } }),
    prisma.signal.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.signalHistory.findMany({ include: { signal: { select: { confidenceScore: true } } } }),
    prisma.signal.aggregate({ _avg: { confidenceScore: true } }),
  ]);

  const records: ResolvedRecord[] = histories.map((h) => ({
    outcome: h.outcome,
    closedAt: h.closedAt,
    pnlPips: h.pnlPips,
    confidenceScore: h.signal.confidenceScore,
  }));
  const winRateSummary = computeWinRateSummary(records);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Active signals" value={String(activeSignals)} icon={Radar} />
      <StatCard
        label="Win rate (all time)"
        value={winRateSummary.winRate !== null ? `${winRateSummary.winRate.toFixed(1)}%` : '—'}
        icon={Trophy}
        tone="success"
      />
      <StatCard label="Signals today" value={String(signalsToday)} icon={Activity} />
      <StatCard
        label="Avg. confidence"
        value={
          avgConfidenceResult._avg.confidenceScore !== null
            ? `${Math.round(avgConfidenceResult._avg.confidenceScore)}%`
            : '—'
        }
        icon={Gauge}
        tone="accent"
      />
    </div>
  );
}

export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass-panel h-[92px] animate-pulse p-5" />
      ))}
    </div>
  );
}
