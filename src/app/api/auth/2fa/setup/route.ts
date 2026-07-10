import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import { generateTwoFactorSecret, generateTwoFactorQrCode } from '@/server/auth/two-factor';

/** Step 1 of 2FA enrollment: issue a secret + QR code. Not yet enabled until /2fa/verify confirms it. */
export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin accounts only.' }, { status: 403 });
  }

  const secret = generateTwoFactorSecret();
  const qrCodeDataUrl = await generateTwoFactorQrCode(user.email, secret);

  // Stored but twoFactorEnabled stays false until the user proves they can generate a valid code.
  await prisma.user.update({ where: { id: user.sub }, data: { twoFactorSecret: secret } });

  return NextResponse.json({ qrCodeDataUrl, secret });
}
