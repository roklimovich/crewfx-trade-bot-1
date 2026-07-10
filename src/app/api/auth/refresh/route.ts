import { NextRequest, NextResponse } from 'next/server';
import { rotateSession } from '@/server/auth/session';
import { setAuthCookies, clearAuthCookies, REFRESH_COOKIE } from '@/lib/cookies';
import { generateCsrfToken } from '@/server/security/csrf';

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token.' }, { status: 401 });
  }

  const tokens = await rotateSession(refreshToken);
  if (!tokens) {
    const res = NextResponse.json(
      { error: 'Session expired. Please log in again.' },
      { status: 401 },
    );
    clearAuthCookies(res);
    return res;
  }

  const res = NextResponse.json({ message: 'Session refreshed.' });
  setAuthCookies(res, tokens, generateCsrfToken());
  return res;
}
