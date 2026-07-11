import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: auth.sub },
    include: {
      role: true,
      telegramAccount: true,
      pocketOptionAccounts: { orderBy: { submittedAt: 'desc' }, take: 1 },
    },
  });
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    status: user.status,
    emailVerified: Boolean(user.emailVerified),
    twoFactorEnabled: user.twoFactorEnabled,
    telegram: user.telegramAccount
      ? { username: user.telegramAccount.username, linkedAt: user.telegramAccount.linkedAt }
      : null,
    pocketOption: user.pocketOptionAccounts[0]
      ? {
          accountId: user.pocketOptionAccounts[0].accountId,
          verified: user.pocketOptionAccounts[0].verified,
        }
      : null,
  });
}

const updateProfileSchema = z.object({ name: z.string().min(2).max(80) });

export async function PATCH(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });

  const user = await prisma.user.update({
    where: { id: auth.sub },
    data: { name: parsed.data.name },
  });
  return NextResponse.json({ id: user.id, name: user.name });
}
