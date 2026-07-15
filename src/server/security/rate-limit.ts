import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { redis } from '@/server/db/redis';
import { logEvent } from './audit-log';

/** Strict limiter for auth endpoints (login, register, password reset) — brute-force protection. */
export const authRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:auth',
  points: 5, // 5 attempts
  duration: 60, // per 60 seconds
  blockDuration: 300, // then block for 5 minutes
});

/** General API limiter — generous, mostly to blunt scraping/abuse. */
export const apiRateLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: 'rl:api',
  points: Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100),
  duration: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60000) / 1000,
});

/**
 * Consumes one point for the given key. Returns { allowed, retryAfterSeconds }.
 * Keyed by IP + route so one abusive IP can't exhaust another user's budget.
 *
 * IMPORTANT: rate-limiter-flexible rejects the promise in two very different situations —
 * (1) the caller genuinely hit the limit (rejects with a RateLimiterRes), or (2) something
 * broke, most commonly Redis being unreachable (rejects with a plain Error). Treating both
 * the same way — as earlier code here did — means a Redis outage silently makes every login
 * look like "too many attempts", which is confusing to debug and blocks all auth for no reason.
 * We fail OPEN (allow the request) on infra errors and log it, and only fail closed on an
 * actual RateLimiterRes.
 */
export async function checkRateLimit(
  limiter: RateLimiterRedis,
  key: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    await limiter.consume(key);
    return { allowed: true };
  } catch (rejection) {
    if (rejection instanceof RateLimiterRes) {
      return { allowed: false, retryAfterSeconds: Math.ceil(rejection.msBeforeNext / 1000) };
    }

    // Not a real rate-limit rejection — most likely Redis is unreachable. Fail open rather
    // than silently blocking every request with a misleading "too many attempts" error.
    await logEvent('ERROR', 'Rate limiter backend error — failing open', {
      context: { error: rejection instanceof Error ? rejection.message : String(rejection) },
    }).catch(() => {}); // logEvent itself may fail if the DB is also down; never let this throw
    return { allowed: true };
  }
}
