import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { verifyPassword } from '@/server/auth/password';
import { createSession } from '@/server/auth/session';
import { verifyTwoFactorToken } from '@/server/auth/two-factor';
import { loginSchema } from '@/lib/validations/auth';
import { setAuthCookies } from '@/lib/cookies';
import { generateCsrfToken } from '@/server/security/csrf';
import { logEvent } from '@/server/security/audit-log';
import { checkRateLimit, authRateLimiter } from '@/server/security/rate-limit';
import { LOCALE_COOKIE } from '@/i18n/config';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { allowed, retryAfterSeconds } = await checkRateLimit(authRateLimiter, `login:${ip}`);
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too many login attempts. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(retryAfterSeconds ?? 60) } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { email, password, twoFactorToken } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email }, include: { role: true } });

  // Same generic error whether the email doesn't exist or the password is wrong —
  // don't let a login form be used to enumerate registered emails.
  const genericError = NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });

  if (!user) {
    await logEvent('SECURITY', 'Login attempt for unknown email', { context: { ip, email } });
    return genericError;
  }

  const passwordValid = await verifyPassword(password, user.passwordHash);
  if (!passwordValid) {
    await logEvent('SECURITY', 'Failed login attempt', { userId: user.id, context: { ip } });
    return genericError;
  }

  if (user.status === 'BLOCKED') {
    await logEvent('SECURITY', 'Login attempt on blocked account', {
      userId: user.id,
      context: { ip },
    });
    return NextResponse.json({ error: 'This account has been blocked.' }, { status: 403 });
  }

  if (user.status === 'PENDING') {
    return NextResponse.json({ error: 'Your account is pending admin approval.' }, { status: 403 });
  }

  // Admin 2FA is mandatory once enrolled (see Phase 3 rules — "Admin Two-Factor Authentication").
  if (user.role.name === 'ADMIN' && user.twoFactorEnabled) {
    if (!twoFactorToken) {
      return NextResponse.json({ error: '2FA_REQUIRED' }, { status: 401 });
    }
    if (!user.twoFactorSecret || !verifyTwoFactorToken(twoFactorToken, user.twoFactorSecret)) {
      await logEvent('SECURITY', 'Failed 2FA attempt', { userId: user.id, context: { ip } });
      return NextResponse.json({ error: 'Invalid 2FA code.' }, { status: 401 });
    }
  }

  const tokens = await createSession({
    userId: user.id,
    email: user.email,
    role: user.role.name,
    status: user.status,
    userAgent: req.headers.get('user-agent'),
    ipAddress: ip,
  });

  await logEvent('INFO', 'User logged in', { userId: user.id, context: { ip } });

  const res = NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role.name },
  });
  setAuthCookies(res, tokens, generateCsrfToken());
  // Sync this device's language to whatever the user last picked on any device — a fresh login
  // shouldn't leave them looking at a stale/different-device language choice.
  res.cookies.set(LOCALE_COOKIE, user.locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return res;
}
