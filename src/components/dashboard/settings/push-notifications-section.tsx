'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { requestNotificationPermission } from '@/hooks/use-notification-stream';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function PushNotificationsSection() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(isSupported);
    if (!isSupported) return;

    navigator.serviceWorker.getRegistration().then(async (reg) => {
      const existing = await reg?.pushManager.getSubscription();
      setSubscribed(Boolean(existing));
    });
  }, []);

  async function handleSubscribe() {
    if (!vapidPublicKey) {
      setError('Push isn\u2019t configured yet \u2014 set NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const permission = await requestNotificationPermission();
      if (permission !== 'granted') {
        setError('Notification permission was not granted.');
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = subscription.toJSON();
      await apiFetch('/api/notifications/push/subscribe', {
        method: 'POST',
        body: { endpoint: json.endpoint, keys: json.keys },
      });

      setSubscribed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable push notifications.');
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setLoading(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await apiFetch('/api/notifications/push/unsubscribe', {
          method: 'POST',
          body: { endpoint: subscription.endpoint },
        });
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not disable push notifications.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-panel p-6">
      <h2 className="font-display text-lg font-medium">Push notifications</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Get a signal alert even when SignalForge isn&rsquo;t open in a tab.
      </p>

      <div className="mt-5">
        {!supported ? (
          <p className="text-sm text-muted-foreground">
            Your browser doesn&rsquo;t support push notifications.
          </p>
        ) : subscribed ? (
          <button
            onClick={handleUnsubscribe}
            disabled={loading}
            className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            Disable push notifications
          </button>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
            Enable push notifications
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
