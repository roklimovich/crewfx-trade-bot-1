import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { requireAdmin } from '@/server/auth/admin-guard';
import type { Prisma, UserStatus, RoleName } from '@prisma/client';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const { searchParams } = req.nextUrl;
  const q = searchParams.get('q')?.trim();
  const status = searchParams.get('status') as UserStatus | null;
  const role = searchParams.get('role') as RoleName | null;
  const page = Math.max(1, Number(searchParams.get('page') ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)));

  const where: Prisma.UserWhereInput = {
    ...(status ? { status } : {}),
    ...(role ? { role: { name: role } } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        role: true,
        telegramAccount: true,
        pocketOptionAccounts: { orderBy: { submittedAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users: users.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      status: u.status,
      role: u.role.name,
      emailVerified: Boolean(u.emailVerified),
      createdAt: u.createdAt,
      telegram: u.telegramAccount ? { username: u.telegramAccount.username } : null,
      pocketOption: u.pocketOptionAccounts[0]
        ? {
            accountId: u.pocketOptionAccounts[0].accountId,
            verified: u.pocketOptionAccounts[0].verified,
          }
        : null,
    })),
    total,
    page,
    pageSize,
  });
}
