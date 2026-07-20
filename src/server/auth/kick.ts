import { redis } from '@/server/db/redis';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // matches signAccessToken's expiry in src/server/auth/jwt.ts

function kickKey(userId: string): string {
  return `kicked:${userId}`;
}

/**
 * Marks a user as kicked — every request they make is rejected until this expires, regardless
 * of whether their access token JWT is still cryptographically valid.
 *
 * Why this exists: JWTs are stateless by design (that's the whole performance benefit — no DB
 * round-trip to verify a request). But that means revoking a Session row (what blockUser() did
 * before this) only stops *future* token refreshes — an access token issued minutes earlier
 * keeps working until it naturally expires (up to 15 minutes later). For a "block" or "kick"
 * action to actually be immediate, something has to short-circuit that. A Redis flag with a TTL
 * exactly matching the access token's lifetime does that cheaply (one fast Redis GET per
 * request) without giving up statelessness for the common case (a kick key almost never exists).
 *
 * TTL is capped at the access token's own lifetime — there's no reason to remember a kick longer
 * than the longest-lived token it could possibly need to invalidate.
 */
export async function kickUser(userId: string): Promise<void> {
  try {
    await redis.set(kickKey(userId), '1', 'EX', ACCESS_TOKEN_TTL_SECONDS);
  } catch {
    // Fails open, same precedent as rate-limit.ts and cache.ts: if Redis is down, an admin kick
    // silently doesn't take effect immediately, but blockUser() still revokes the DB session
    // (stopping future refreshes) and the JWT still expires naturally within 15 minutes regardless.
  }
}

/** Checked by getAuthenticatedUser() on every request — see src/server/auth/request-context.ts. */
export async function isUserKicked(userId: string): Promise<boolean> {
  try {
    const value = await redis.get(kickKey(userId));
    return value !== null;
  } catch {
    return false; // fail open — see kickUser()'s comment
  }
}
