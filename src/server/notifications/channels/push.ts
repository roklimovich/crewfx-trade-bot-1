import webpush from 'web-push';

let vapidConfigured = false;

function ensureVapidConfigured(): void {
  if (vapidConfigured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error('VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT must all be set.');
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/**
 * Sends a push notification. Throws `PushSubscriptionExpiredError` specifically on a 404/410
 * response — that means the browser unsubscribed or the subscription otherwise died, and the
 * caller (dispatch.ts) should delete the stored PushSubscription row rather than keep retrying it.
 */
export async function sendWebPush(
  subscription: WebPushSubscription,
  payload: PushPayload,
): Promise<void> {
  ensureVapidConfigured();

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err) {
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      throw new PushSubscriptionExpiredError();
    }
    throw err;
  }
}

export class PushSubscriptionExpiredError extends Error {
  constructor() {
    super('Push subscription is no longer valid (404/410).');
  }
}

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT,
  );
}
