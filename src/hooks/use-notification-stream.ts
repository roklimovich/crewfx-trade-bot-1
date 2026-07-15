'use client';

import { useEffect, useRef, useState } from 'react';
import { playNotificationChime } from '@/lib/notification-sound';

export interface RealtimeNotification {
  id: string;
  title: string;
  body: string;
  signalId?: string;
  createdAt: string;
}

/**
 * Opens an EventSource to /api/notifications/stream and, on each event:
 * - plays a short chime (Sound Alerts)
 * - shows a native browser Notification if permission was granted (Browser Notifications)
 * - appends to `liveNotifications`, which callers (e.g. the dropdown) merge into their list
 *
 * EventSource reconnects automatically on a dropped connection — no manual retry logic needed
 * here, though see src/app/api/notifications/stream/route.ts for the serverless-longevity caveat.
 */
export function useNotificationStream() {
  const [liveNotifications, setLiveNotifications] = useState<RealtimeNotification[]>([]);
  const sourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const source = new EventSource('/api/notifications/stream');
    sourceRef.current = source;

    source.addEventListener('notification', (event) => {
      try {
        const data: RealtimeNotification = JSON.parse((event as MessageEvent).data);
        setLiveNotifications((prev) => [data, ...prev].slice(0, 50));

        playNotificationChime();

        if (
          typeof window !== 'undefined' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification(data.title, { body: data.body });
        }
      } catch {
        // Malformed event — ignore rather than crash the stream handler.
      }
    });

    return () => {
      source.close();
    };
  }, []);

  return { liveNotifications };
}

/** Requests browser notification permission — call this from a user gesture (e.g. a settings toggle). */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.requestPermission();
}
