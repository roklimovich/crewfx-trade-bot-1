import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { requireAdmin } from '@/server/auth/admin-guard';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const [
    totalUsers,
    pendingUsers,
    activeUsers,
    blockedUsers,
    unverifiedPocketOptions,
    securityLogs24h,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'BLOCKED' } }),
    prisma.pocketOptionAccount.count({ where: { verified: false } }),
    prisma.log.count({
      where: { level: 'SECURITY', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  // Signal/win-rate analytics are genuinely empty until Phase 7/8/11 exist — reported as
  // zero rather than mocked, since this endpoint reflects real database state.
  const totalSignals = await prisma.signal.count();

  return NextResponse.json({
    totalUsers,
    pendingUsers,
    activeUsers,
    blockedUsers,
    unverifiedPocketOptions,
    securityLogs24h,
    totalSignals,
  });
}
