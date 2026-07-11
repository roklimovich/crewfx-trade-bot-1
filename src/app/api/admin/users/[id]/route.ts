import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { requireAdmin } from '@/server/auth/admin-guard';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      role: true,
      telegramAccount: true,
      pocketOptionAccounts: { orderBy: { submittedAt: 'desc' } },
      sessions: { where: { revokedAt: null }, orderBy: { createdAt: 'desc' } },
      referredBy: { select: { id: true, email: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    role: user.role.name,
    emailVerified: Boolean(user.emailVerified),
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
    referredBy: user.referredBy,
    telegram: user.telegramAccount,
    pocketOptionAccounts: user.pocketOptionAccounts,
    activeSessions: user.sessions.length,
  });
}
