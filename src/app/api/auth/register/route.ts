import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { hashPassword, isPasswordStrongEnough } from '@/server/auth/password';
import { generateOpaqueToken } from '@/server/auth/tokens';
import { registerSchema } from '@/lib/validations/auth';
import { sendVerificationEmail } from '@/lib/mailer';
import { logEvent } from '@/server/security/audit-log';
import { checkRateLimit, authRateLimiter } from '@/server/security/rate-limit';
import { RoleName } from '@prisma/client';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  const { allowed } = await checkRateLimit(authRateLimiter, `register:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { email, password, name, referralCode } = parsed.data;

  if (!isPasswordStrongEnough(password)) {
    return NextResponse.json(
      { error: 'Password must be 10+ characters with upper, lower, and a digit.' },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Deliberately vague — don't reveal whether an email is registered.
    return NextResponse.json(
      { message: 'If this email can be registered, a verification email has been sent.' },
      { status: 200 },
    );
  }

  const userRole = await prisma.role.findUnique({ where: { name: RoleName.USER } });
  if (!userRole) {
    return NextResponse.json(
      { error: 'Platform not fully configured (missing default role).' },
      { status: 500 },
    );
  }

  // referralCode is treated as the referring user's id — validated against a real user.
  const referrer = referralCode
    ? await prisma.user.findUnique({ where: { id: referralCode } })
    : null;

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      roleId: userRole.id,
      referredById: referrer?.id,
    },
  });

  const { token, tokenHash } = generateOpaqueToken();
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      tokenHash,
      type: 'EMAIL_VERIFICATION',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendVerificationEmail(email, token).catch(async (err) => {
    await logEvent('ERROR', 'Failed to send verification email', {
      userId: user.id,
      context: { err: String(err) },
    });
  });

  await logEvent('INFO', 'User registered', {
    userId: user.id,
    context: { ip, referredById: referrer?.id },
  });

  return NextResponse.json(
    { message: 'Registration successful. Check your email to verify your account.' },
    { status: 201 },
  );
}
