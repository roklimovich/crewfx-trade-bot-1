import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import { LOCALES } from '@/i18n/config';

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
    locale: user.locale,
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

// `name` and `locale` are independent, optional fields — the language switcher (Phase 13) calls
// this with only `{ locale }` on every toggle, and shouldn't be forced to resend the user's name.
const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  locale: z.enum(LOCALES).optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await getAuthenticatedUser(req);
  if (!auth) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  if (parsed.data.name === undefined && parsed.data.locale === undefined) {
    return NextResponse.json({ error: 'Nothing to update.' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.sub },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.locale !== undefined ? { locale: parsed.data.locale } : {}),
    },
  });
  return NextResponse.json({ id: user.id, name: user.name, locale: user.locale });
}
