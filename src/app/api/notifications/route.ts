import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';

/** GET /api/notifications?unreadOnly=true&limit=20 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const unreadOnly = searchParams.get('unreadOnly') === 'true';
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? 20)));

  const notifications = await prisma.notification.findMany({
    where: { userId: user.sub, ...(unreadOnly ? { readAt: null } : {}) },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.sub, readAt: null },
  });

  return NextResponse.json({ notifications, unreadCount });
}
