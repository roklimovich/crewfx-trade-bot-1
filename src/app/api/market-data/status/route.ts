import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';

/**
 * Safe operational readiness check for the dashboard. It deliberately returns only whether a
 * provider key is configured—not the key or any connection details.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const [candleCount, indicatorCount, newestCandle] = await Promise.all([
    prisma.marketData.count(),
    prisma.indicator.count(),
    prisma.marketData.findFirst({ orderBy: { timestamp: 'desc' }, select: { timestamp: true } }),
  ]);

  return NextResponse.json({
    providerConfigured: Boolean(process.env.MARKET_DATA_API_KEY),
    candleCount,
    indicatorCount,
    newestCandleAt: newestCandle?.timestamp.toISOString() ?? null,
    ready: candleCount >= 20 && indicatorCount > 0,
  });
}
