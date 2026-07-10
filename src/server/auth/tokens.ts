import { randomBytes, createHash } from 'crypto';

/**
 * Generates an opaque, cryptographically random token (returned to the client)
 * and its SHA-256 hash (stored server-side). We never store raw tokens — a DB
 * leak should not hand out usable refresh/reset tokens.
 */
export function generateOpaqueToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
