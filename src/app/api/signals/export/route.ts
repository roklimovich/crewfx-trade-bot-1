import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import {
  parseSignalHistoryFilters,
  buildSignalHistoryWhere,
} from '@/server/analytics/signal-query';
import { buildCsv } from '@/lib/csv';

const CSV_COLUMNS = [
  'id',
  'pair',
  'direction',
  'entryPrice',
  'confidenceScore',
  'riskLevel',
  'timeframe',
  'status',
  'outcome',
  'closePrice',
  'pnlPips',
  'createdAt',
  'closedAt',
] as const;

/** GET /api/signals/export — same filters as GET /api/signals, streamed as a CSV file instead of JSON. */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Your account is not yet active.' }, { status: 403 });
  }

  const filters = parseSignalHistoryFilters(req.nextUrl.searchParams);
  const where = buildSignalHistoryWhere(filters);

  const signals = await prisma.signal.findMany({
    where,
    include: { history: true },
    orderBy: { createdAt: 'desc' },
    take: 5000, // a sane ceiling — this is a manual export, not a paginated feed
  });

  const rows = signals.map((s) => [
    s.id,
    s.pair,
    s.direction,
    s.entryPrice,
    s.confidenceScore,
    s.riskLevel,
    s.timeframe,
    s.status,
    s.history?.outcome ?? 'PENDING',
    s.history?.closePrice ?? '',
    s.history?.pnlPips ?? '',
    s.createdAt.toISOString(),
    s.history?.closedAt?.toISOString() ?? '',
  ]);

  const csv = buildCsv(CSV_COLUMNS, rows);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="crewfx-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
