import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import {
  parseSignalHistoryFilters,
  buildSignalHistoryWhere,
} from '@/server/analytics/signal-query';

/**
 * GET /api/signals?pair=EUR/USD&direction=BUY&status=WON&dateFrom=2026-07-01&dateTo=2026-07-12
 *                  &search=RSI&page=1&pageSize=25
 *
 * Superset of Phase 8's original filters (pair/status still work as before) — pageSize/page
 * replace the old single `limit` param now that Phase 11 needs real pagination for the signal
 * history table, not just "give me the latest N".
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Your account is not yet active.' }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const filters = parseSignalHistoryFilters(searchParams);
  const where = buildSignalHistoryWhere(filters);

  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get('pageSize') ?? searchParams.get('limit') ?? 25)),
  );

  const [signals, total] = await Promise.all([
    prisma.signal.findMany({
      where,
      include: { history: true, aiAnalysis: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.signal.count({ where }),
  ]);

  return NextResponse.json({ signals, total, page, pageSize });
}
