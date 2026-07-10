import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { hashToken } from '@/server/auth/tokens';
import { hashPassword, isPasswordStrongEnough } from '@/server/auth/password';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { revokeAllSessionsForUser } from '@/server/auth/session';
import { logEvent } from '@/server/security/audit-log';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }
  const { token, newPassword } = parsed.data;

  if (!isPasswordStrongEnough(newPassword)) {
    return NextResponse.json(
      { error: 'Password must be 10+ characters with upper, lower, and a digit.' },
      { status: 400 },
    );
  }

  const tokenHash = hashToken(token);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (
    !record ||
    record.type !== 'PASSWORD_RESET' ||
    record.usedAt ||
    record.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: 'This reset link is invalid or has expired.' },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  // Password changed → kill every existing session. If an attacker had a live
  // session, this cuts them off the moment the legitimate owner resets.
  await revokeAllSessionsForUser(record.userId);

  await logEvent('SECURITY', 'Password reset completed', { userId: record.userId });

  return NextResponse.json({ message: 'Password updated. Please log in again.' });
}
