import type { NextRequest } from 'next/server';
import { verifyAccessToken, type AccessTokenPayload } from './jwt';
import { ACCESS_COOKIE } from '@/lib/cookies';

/**
 * Reads the access token from the HTTP-only cookie (browser clients) or the
 * Authorization: Bearer header (API/mobile clients), and verifies it.
 * Returns null for any missing/invalid/expired token — callers decide how to respond.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AccessTokenPayload | null> {
  const cookieToken = req.cookies.get(ACCESS_COOKIE)?.value;
  const authHeader = req.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  const token = cookieToken ?? bearerToken;
  if (!token) return null;

  return verifyAccessToken(token);
}
