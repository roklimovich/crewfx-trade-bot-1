import { SignalFeed } from '@/components/dashboard/signal-feed';
import { prisma } from '@/server/db/prisma';
import type { SignalFeedItem } from '@/types/signal';

export async function RecentSignalsSection() {
  const recentSignals = await prisma.signal.findMany({ orderBy: { createdAt: 'desc' }, take: 4 });

  const feedItems: SignalFeedItem[] = recentSignals.map((s) => ({
    id: s.id,
    pair: s.pair,
    direction: s.direction,
    entryPrice: s.entryPrice,
    confidenceScore: s.confidenceScore,
    riskLevel: s.riskLevel,
    timeframe: s.timeframe,
    status: s.status,
    technicalSummary: s.technicalSummary,
    createdAt: s.createdAt.toISOString(),
  }));

  return <SignalFeed signals={feedItems} limit={4} />;
}

export function RecentSignalsSkeleton() {
  return (
    <div className="glass-panel divide-y divide-white/5 overflow-hidden p-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-[84px] animate-pulse p-5" />
      ))}
    </div>
  );
}
