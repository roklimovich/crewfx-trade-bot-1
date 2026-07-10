import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { verifyTelegramLogin } from '@/lib/telegram-auth';
import { telegramLoginSchema } from '@/lib/validations/auth';
import { createSession } from '@/server/auth/session';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import { setAuthCookies } from '@/lib/cookies';
import { generateCsrfToken } from '@/server/security/csrf';
import { logEvent } from '@/server/security/audit-log';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = telegramLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Telegram payload.' }, { status: 400 });
  }

  if (!verifyTelegramLogin(parsed.data)) {
    await logEvent('SECURITY', 'Telegram login signature verification failed');
    return NextResponse.json({ error: 'Could not verify Telegram signature.' }, { status: 401 });
  }

  const telegramId = String(parsed.data.id);
  const existingLink = await prisma.telegramAccount.findUnique({
    where: { telegramId },
    include: { user: { include: { role: true } } },
  });

  if (existingLink) {
    // Known Telegram account → log this browser in as its linked user.
    if (existingLink.user.status === 'BLOCKED') {
      return NextResponse.json({ error: 'This account has been blocked.' }, { status: 403 });
    }
    const tokens = await createSession({
      userId: existingLink.user.id,
      email: existingLink.user.email,
      role: existingLink.user.role.name,
      status: existingLink.user.status,
      userAgent: req.headers.get('user-agent'),
      ipAddress: req.headers.get('x-forwarded-for'),
    });
    const res = NextResponse.json({
      user: { id: existingLink.user.id, email: existingLink.user.email },
    });
    setAuthCookies(res, tokens, generateCsrfToken());
    return res;
  }

  // No existing link — this only makes sense if the browser already has a
  // SignalForge session; we link Telegram to that account.
  const currentUser = await getAuthenticatedUser(req);
  if (!currentUser) {
    return NextResponse.json(
      {
        error:
          'No SignalForge account is linked to this Telegram account. Log in first, then link Telegram from your dashboard.',
      },
      { status: 404 },
    );
  }

  const account = await prisma.telegramAccount.create({
    data: {
      userId: currentUser.sub,
      telegramId,
      username: parsed.data.username,
      chatId: telegramId, // for a private-chat bot, chatId == user id; group/channel bots would differ
    },
  });

  await logEvent('INFO', 'Telegram account linked', { userId: currentUser.sub });

  return NextResponse.json({ message: 'Telegram account linked.', id: account.id });
}
