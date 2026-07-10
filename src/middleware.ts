import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/server/auth/jwt';
import {
  verifyCsrfToken,
  requiresCsrfCheck,
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
} from '@/server/security/csrf';
import { ACCESS_COOKIE } from '@/lib/cookies';

const PROTECTED_PREFIXES = ['/dashboard'];
const ADMIN_PREFIXES = ['/admin'];
// Auth endpoints are exempt from the CSRF check because they're what *establish*
// the CSRF cookie in the first place (no session yet to protect).
const CSRF_EXEMPT_PATHS = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/telegram',
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- CSRF enforcement on mutating API requests ---
  if (
    pathname.startsWith('/api/') &&
    requiresCsrfCheck(req.method) &&
    !CSRF_EXEMPT_PATHS.some((p) => pathname.startsWith(p))
  ) {
    const cookieToken = req.cookies.get(CSRF_COOKIE_NAME)?.value;
    const headerToken = req.headers.get(CSRF_HEADER_NAME);
    if (!verifyCsrfToken(cookieToken, headerToken)) {
      return NextResponse.json({ error: 'CSRF validation failed.' }, { status: 403 });
    }
  }

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAuth || needsAdmin) {
    const token = req.cookies.get(ACCESS_COOKIE)?.value;
    const payload = token ? await verifyAccessToken(token) : null;

    if (!payload) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (needsAdmin && payload.role !== 'ADMIN' && payload.role !== 'MODERATOR') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Forward identity to route handlers/pages via headers, so they don't need to re-verify the JWT.
    const res = NextResponse.next();
    res.headers.set('x-user-id', payload.sub);
    res.headers.set('x-user-role', payload.role);
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/api/:path*'],
};
