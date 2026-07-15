import { redis } from '@/server/db/redis';

/**
 * Cache-aside helper: returns the cached value if present, otherwise computes it with `fn`,
 * stores it, and returns it. Fails OPEN on any Redis error — same precedent as
 * src/server/security/rate-limit.ts (Phase 3/local-dev fix): a cache is a performance
 * optimization, never a correctness dependency, so a Redis outage should degrade to "just
 * compute it every time," not break the endpoint.
 */
export async function getOrSetCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redis.get(key);
    if (cached !== null) {
      return JSON.parse(cached) as T;
    }
  } catch {
    // Redis unreachable — fall through to computing fresh below.
  }

  const value = await fn();

  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // Caching the result failed — not fatal, the caller still gets a correct value this request.
  }

  return value;
}

/** Deletes every key matching a prefix — used to invalidate analytics caches when new data lands. */
export async function invalidateCacheByPrefix(prefix: string): Promise<void> {
  try {
    const keysToDelete: string[] = [];
    const stream = redis.scanStream({ match: `${prefix}*`, count: 100 });

    for await (const keys of stream) {
      keysToDelete.push(...(keys as string[]));
    }

    if (keysToDelete.length > 0) await redis.del(...keysToDelete);
  } catch {
    // Non-fatal — worst case, a stale cached value is served until its TTL naturally expires.
  }
}
