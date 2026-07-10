import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/server/auth/jwt';
import { revokeSession } from '@/server/auth/session';
import { clearAuthCookies, ACCESS_COOKIE } from '@/lib/cookies';
import { logEvent } from '@/server/security/audit-log';

export async function POST(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value;
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      await revokeSession(payload.sessionId);
      await logEvent('INFO', 'User logged out', { userId: payload.sub });
    }
  }

  const res = NextResponse.json({ message: 'Logged out.' });
  clearAuthCookies(res);
  return res;
}
