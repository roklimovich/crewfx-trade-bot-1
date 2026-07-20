import { Radar, Trophy, Activity, Gauge } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { prisma } from '@/server/db/prisma';
import { getMessages } from '@/i18n/get-messages';

/**
 * Its own async Server Component (rather than inline in the page) specifically so it can be
 * wrapped in a <Suspense> boundary — see Phase 12's streaming notes in the overview page. This
 * section's Prisma queries can resolve independently of the recent-signals section below it,
 * so a slow one doesn't block the other from appearing.
 */
export async function StatsRow() {
  const t = getMessages();
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const [activeSignals, signalsToday, outcomeCounts, avgConfidenceResult] = await Promise.all([
    prisma.signal.count({ where: { status: 'ACTIVE' } }),
    prisma.signal.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.signalHistory.groupBy({
      by: ['outcome'],
      where: { outcome: { in: ['WIN', 'LOSS'] } },
      _count: { _all: true },
    }),
    prisma.signal.aggregate({ _avg: { confidenceScore: true } }),
  ]);

  const wins = outcomeCounts.find((result) => result.outcome === 'WIN')?._count._all ?? 0;
  const losses = outcomeCounts.find((result) => result.outcome === 'LOSS')?._count._all ?? 0;
  const decisiveSignals = wins + losses;
  const winRateSummary = {
    winRate: decisiveSignals > 0 ? (wins / decisiveSignals) * 100 : null,
  };

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label={t.dashboard.overview.activeSignals}
        value={String(activeSignals)}
        icon={Radar}
      />
      <StatCard
        label={t.dashboard.overview.winRate}
        value={winRateSummary.winRate !== null ? `${winRateSummary.winRate.toFixed(1)}%` : '—'}
        icon={Trophy}
        tone="success"
      />
      <StatCard
        label={t.dashboard.overview.signalsToday}
        value={String(signalsToday)}
        icon={Activity}
      />
      <StatCard
        label={t.dashboard.overview.avgConfidence}
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
