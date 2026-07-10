import type { NextResponse } from 'next/server';

const isProd = process.env.NODE_ENV === 'production';

export const ACCESS_COOKIE = 'sf_access';
export const REFRESH_COOKIE = 'sf_refresh';

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd, // allow http in local dev
  sameSite: 'lax' as const, // 'lax' balances CSRF protection with normal top-level navigation
  path: '/',
};

/** Sets both auth cookies + a readable (non-HTTP-only) CSRF cookie on the response. */
export function setAuthCookies(
  res: NextResponse,
  tokens: { accessToken: string; refreshToken: string },
  csrfToken: string,
): void {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    ...baseCookieOptions,
    maxAge: 60 * 15, // 15 minutes, matches JWT TTL
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    ...baseCookieOptions,
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
  res.cookies.set('sf_csrf', csrfToken, {
    ...baseCookieOptions,
    httpOnly: false, // frontend JS must read this to echo it back in a header
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(res: NextResponse): void {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, 'sf_csrf']) {
    res.cookies.set(name, '', { ...baseCookieOptions, maxAge: 0, httpOnly: name !== 'sf_csrf' });
  }
}
