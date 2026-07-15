import type { NextRequest } from 'next/server';
import { redis } from '@/server/db/redis';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import { realtimeChannelName } from '@/server/notifications/realtime';

// SSE needs a long-lived connection and the Node runtime (ioredis isn't Edge-compatible).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const HEARTBEAT_MS = 25_000; // keep intermediary proxies/load balancers from closing an idle connection

/**
 * GET /api/notifications/stream — real-time signal notifications (Phase 10's "WebSockets or SSE"
 * requirement, implemented as SSE: simpler than WebSockets for this one-directional
 * server→client use case, and works as a plain HTTP response Next.js already supports).
 *
 * Deployment note: on serverless platforms with hard execution-time limits (Vercel's default
 * plans included), a connection this long-lived will eventually be cut by the platform, not by
 * this code. The client (see use-notification-stream.ts) reconnects automatically via
 * EventSource's built-in retry, so a cut connection is a brief gap, not a broken feature — but
 * for guaranteed always-on real-time at scale, a dedicated long-running service (or a hosted
 * realtime provider) is the more correct production architecture. Documented, not hidden.
 */
export async function GET(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  const subscriber = redis.duplicate(); // pub/sub requires a connection dedicated to subscribing

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: string) => controller.enqueue(encoder.encode(data));

      send(`event: connected\ndata: {}\n\n`);

      subscriber.on('message', (_channel, message) => {
        send(`event: notification\ndata: ${message}\n\n`);
      });

      try {
        await subscriber.subscribe(realtimeChannelName(user.sub));
      } catch {
        // Redis unreachable — close gracefully rather than hang; client will retry via EventSource.
        controller.close();
        return;
      }

      const heartbeat = setInterval(() => {
        try {
          send(`: heartbeat\n\n`);
        } catch {
          clearInterval(heartbeat);
        }
      }, HEARTBEAT_MS);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        subscriber.unsubscribe().catch(() => {});
        subscriber.quit().catch(() => {});
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
