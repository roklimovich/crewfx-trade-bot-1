import { redis } from '@/server/db/redis';

export interface RealtimeNotificationEvent {
  id: string;
  title: string;
  body: string;
  signalId?: string;
  createdAt: string;
}

function channelName(userId: string): string {
  return `notifications:${userId}`;
}

/**
 * Publishes a real-time event for one user. Redis pub/sub (not an in-memory Map of open
 * connections) specifically because this app can run as multiple serverless instances — an
 * in-memory hub would only reach clients connected to the same instance that happened to handle
 * this request, silently missing everyone else. Failure here is non-fatal: if Redis is
 * unreachable, the user simply doesn't get the live push and falls back to seeing it next time
 * they load /api/notifications — the Notification DB row is already written regardless (see
 * dispatch.ts), this is purely the live-update layer on top.
 */
export async function publishRealtimeEvent(
  userId: string,
  event: RealtimeNotificationEvent,
): Promise<void> {
  try {
    await redis.publish(channelName(userId), JSON.stringify(event));
  } catch {
    // Intentionally swallowed — see comment above. checkRateLimit's Redis-outage handling
    // (src/server/security/rate-limit.ts) established the same fail-open precedent.
  }
}

export { channelName as realtimeChannelName };
