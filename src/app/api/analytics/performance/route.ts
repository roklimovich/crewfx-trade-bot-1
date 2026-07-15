import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import { groupByPeriod, type ResolvedRecord } from '@/server/analytics/compute-stats';
import { getOrSetCache } from '@/lib/cache';

const CACHE_TTL_SECONDS = 60;

/** GET /api/analytics/performance?period=daily|weekly|monthly */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const period =
    (req.nextUrl.searchParams.get('period') as 'daily' | 'weekly' | 'monthly') || 'daily';
  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    return NextResponse.json(
      { error: 'period must be daily, weekly, or monthly.' },
      { status: 400 },
    );
  }

  const buckets = await getOrSetCache(
    `analytics:performance:${period}`,
    CACHE_TTL_SECONDS,
    async () => {
      const histories = await prisma.signalHistory.findMany({
        include: { signal: { select: { confidenceScore: true } } },
      });

      const records: ResolvedRecord[] = histories.map((h) => ({
        outcome: h.outcome,
        closedAt: h.closedAt,
        pnlPips: h.pnlPips,
        confidenceScore: h.signal.confidenceScore,
      }));

      return groupByPeriod(records, period);
    },
  );

  return NextResponse.json({ period, buckets });
}
