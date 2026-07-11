import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from './request-context';
import type { AccessTokenPayload } from './jwt';

type AdminGuardResult =
  | { ok: true; user: AccessTokenPayload }
  | { ok: false; response: NextResponse };

/**
 * Verifies the request comes from an authenticated ADMIN or MODERATOR (unless a
 * narrower `allowedRoles` is passed, e.g. ['ADMIN'] for settings writes).
 * Route handlers call this first and return `.response` immediately on failure:
 *
 *   const guard = await requireAdmin(req);
 *   if (!guard.ok) return guard.response;
 *   const { user } = guard;
 */
export async function requireAdmin(
  req: NextRequest,
  allowedRoles: Array<'ADMIN' | 'MODERATOR'> = ['ADMIN', 'MODERATOR'],
): Promise<AdminGuardResult> {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Not authenticated.' }, { status: 401 }),
    };
  }
  if (!allowedRoles.includes(user.role as 'ADMIN' | 'MODERATOR')) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Insufficient permissions.' }, { status: 403 }),
    };
  }
  return { ok: true, user };
}
