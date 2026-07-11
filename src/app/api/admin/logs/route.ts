import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { requireAdmin } from '@/server/auth/admin-guard';
import type { LogLevel } from '@prisma/client';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const { searchParams } = req.nextUrl;
  const view = searchParams.get('view') === 'admin-actions' ? 'admin-actions' : 'logs';
  const level = searchParams.get('level') as LogLevel | null;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? 30)));

  if (view === 'admin-actions') {
    const [actions, total] = await Promise.all([
      prisma.adminAction.findMany({
        include: {
          admin: { select: { email: true } },
          targetUser: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.adminAction.count(),
    ]);
    return NextResponse.json({
      view,
      items: actions.map((a) => ({
        id: a.id,
        actionType: a.actionType,
        adminEmail: a.admin.email,
        targetEmail: a.targetUser?.email ?? null,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
      total,
      page,
      pageSize,
    });
  }

  const where = level ? { level } : {};
  const [logs, total] = await Promise.all([
    prisma.log.findMany({
      where,
      include: { user: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.log.count({ where }),
  ]);

  return NextResponse.json({
    view,
    items: logs.map((l) => ({
      id: l.id,
      level: l.level,
      message: l.message,
      userEmail: l.user?.email ?? null,
      context: l.context,
      createdAt: l.createdAt,
    })),
    total,
    page,
    pageSize,
  });
}
