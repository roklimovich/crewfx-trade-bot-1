import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import { verifyTwoFactorToken } from '@/server/auth/two-factor';
import { twoFactorVerifySchema } from '@/lib/validations/auth';
import { logEvent } from '@/server/security/audit-log';

/** Step 2 of 2FA enrollment: confirm the user's authenticator app is producing valid codes, then flip it on. */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin accounts only.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = twoFactorVerifySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid code.' }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.sub } });
  if (!dbUser?.twoFactorSecret) {
    return NextResponse.json({ error: 'Call /2fa/setup first.' }, { status: 400 });
  }

  if (!verifyTwoFactorToken(parsed.data.token, dbUser.twoFactorSecret)) {
    return NextResponse.json({ error: 'Invalid code.' }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.sub }, data: { twoFactorEnabled: true } });
  await logEvent('SECURITY', 'Admin 2FA enabled', { userId: user.sub });

  return NextResponse.json({ message: '2FA enabled.' });
}
