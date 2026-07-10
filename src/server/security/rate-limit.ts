import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '@/server/db/redis';

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
 */
export async function checkRateLimit(
  limiter: RateLimiterRedis,
  key: string,
): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  try {
    await limiter.consume(key);
    return { allowed: true };
  } catch (rejection) {
    const retryAfterSeconds =
      rejection && typeof rejection === 'object' && 'msBeforeNext' in rejection
        ? Math.ceil((rejection as { msBeforeNext: number }).msBeforeNext / 1000)
        : 60;
    return { allowed: false, retryAfterSeconds };
  }
}
