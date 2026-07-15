import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import type { Timeframe } from '@prisma/client';

/** GET /api/market-data/candles?pair=EUR/USD&timeframe=M15&limit=200 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const pair = searchParams.get('pair');
  const timeframe = searchParams.get('timeframe') as Timeframe | null;
  const limit = Math.min(500, Math.max(1, Number(searchParams.get('limit') ?? 200)));

  if (!pair || !timeframe) {
    return NextResponse.json({ error: 'pair and timeframe are required.' }, { status: 400 });
  }

  const candles = await prisma.marketData.findMany({
    where: { pair, timeframe },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  const indicators = await prisma.indicator.findMany({
    where: { pair, timeframe },
    orderBy: { timestamp: 'desc' },
    distinct: ['type'],
  });

  return NextResponse.json({
    pair,
    timeframe,
    candles: candles.reverse(), // oldest-first for chart consumption
    latestIndicators: indicators,
  });
}
