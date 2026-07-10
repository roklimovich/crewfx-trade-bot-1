import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { hashToken } from '@/server/auth/tokens';
import { verifyEmailSchema } from '@/lib/validations/auth';
import { logEvent } from '@/server/security/audit-log';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid token.' }, { status: 400 });
  }

  const tokenHash = hashToken(parsed.data.token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (
    !record ||
    record.type !== 'EMAIL_VERIFICATION' ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: 'This verification link is invalid or has expired.' },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { emailVerified: new Date() } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  await logEvent('INFO', 'Email verified', { userId: record.userId });

  return NextResponse.json({ message: 'Email verified. You can now log in.' });
}
