import { createHash, createHmac } from 'crypto';

export interface TelegramLoginPayload {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verifies the signature Telegram's Login Widget attaches to the auth payload.
 * See: https://core.telegram.org/widgets/login#checking-authorization
 * Rejects payloads older than 24h to prevent replay of a leaked callback URL.
 */
export function verifyTelegramLogin(payload: TelegramLoginPayload): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error('TELEGRAM_BOT_TOKEN is not set');

  const { hash, ...rest } = payload;
  const checkString = Object.entries(rest)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const secretKey = createHash('sha256').update(botToken).digest();
  const computedHash = createHmac('sha256', secretKey).update(checkString).digest('hex');

  const isFresh = Date.now() / 1000 - payload.auth_date < 24 * 60 * 60;
  return computedHash === hash && isFresh;
}
