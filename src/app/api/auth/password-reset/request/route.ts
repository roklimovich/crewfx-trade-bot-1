import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { generateOpaqueToken } from '@/server/auth/tokens';
import { requestPasswordResetSchema } from '@/lib/validations/auth';
import { sendPasswordResetEmail } from '@/lib/mailer';
import { checkRateLimit, authRateLimiter } from '@/server/security/rate-limit';
import { logEvent } from '@/server/security/audit-log';

const GENERIC_RESPONSE = {
  message: 'If that email is registered, a password reset link has been sent.',
};

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { allowed } = await checkRateLimit(authRateLimiter, `pwreset:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = requestPasswordResetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Always return the same response regardless of whether the user exists —
  // this endpoint must not be usable to check which emails are registered.
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) {
    return NextResponse.json(GENERIC_RESPONSE);
  }

  const { token, tokenHash } = generateOpaqueToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      type: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    },
  });

  await sendPasswordResetEmail(user.email, token);
  await logEvent('INFO', 'Password reset requested', { userId: user.id, context: { ip } });

  return NextResponse.json(GENERIC_RESPONSE);
}
