export const CSRF_COOKIE_NAME = 'sf_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Double-submit cookie CSRF protection.
 *
 * Why this is needed even with SameSite cookies: SameSite=Lax still allows
 * top-level GET navigations to carry cookies, and defense-in-depth is cheap.
 * The token is unguessable and readable by our own JS (not HTTP-only) so the
 * frontend can echo it back in a custom header — cross-site requests can't
 * read it from another origin, so they can't reproduce a matching header.
 *
 * Uses the Web Crypto API (not Node's `crypto` module) because this file is
 * imported by src/middleware.ts, which runs on the Edge Runtime.
 */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Constant-time-ish comparison in environments without Node's timingSafeEqual (Edge Runtime). */
export function verifyCsrfToken(
  cookieValue: string | undefined,
  headerValue: string | null,
): boolean {
  if (!cookieValue || !headerValue || cookieValue.length !== headerValue.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cookieValue.length; i++) {
    mismatch |= cookieValue.charCodeAt(i) ^ headerValue.charCodeAt(i);
  }
  return mismatch === 0;
}

/** Any request that mutates state must pass CSRF verification; safe methods are exempt. */
export function requiresCsrfCheck(method: string): boolean {
  return !['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
}
