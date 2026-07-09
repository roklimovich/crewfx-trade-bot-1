import Redis from 'ioredis';

/**
 * Singleton Redis client.
 * Reused across hot-reloads in dev to avoid exhausting connections.
 */
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error('REDIS_URL is not set. Check your .env file.');
}

export const redis = global.__redis ?? new Redis(redisUrl);

if (process.env.NODE_ENV !== 'production') {
  global.__redis = redis;
}
