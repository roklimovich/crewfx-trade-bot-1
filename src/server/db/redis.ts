import Redis from 'ioredis';

/**
 * Singleton Redis client.
 * Reused across hot-reloads in dev to avoid exhausting connections.
 */
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

// Defaults to localhost rather than throwing — Redis being unreachable is now handled
// gracefully everywhere it's used (see checkRateLimit's fail-open behavior below), so a
// missing/misconfigured REDIS_URL shouldn't crash the entire app at import time.
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

function createRedisClient(): Redis {
  const client = new Redis(redisUrl, {
    // Fail fast: a single interactive HTTP request shouldn't sit retrying a dead connection —
    // better to reject quickly so checkRateLimit() can fail open (see src/server/security/rate-limit.ts)
    // than to hang the request for seconds while ioredis retries internally.
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      // Cap backoff at 5s and keep trying in the background so the app recovers automatically
      // once Redis comes back up, without spamming reconnect attempts.
      return Math.min(times * 500, 5000);
    },
  });

  // ioredis throws an unhandled-rejection-style warning for every connection error if nothing
  // is listening on 'error'. One listener here turns that into a single clean log line instead
  // of a stack trace per failed command.
  let lastLoggedAt = 0;
  client.on('error', (err) => {
    const now = Date.now();
    if (now - lastLoggedAt > 30_000) {
      // eslint-disable-next-line no-console
      console.error(`[redis] connection error (further errors suppressed for 30s): ${err.message}`);
      lastLoggedAt = now;
    }
  });

  return client;
}

export const redis = global.__redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  global.__redis = redis;
}
