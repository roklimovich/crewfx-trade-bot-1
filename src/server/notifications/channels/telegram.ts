/**
 * Sends messages via Telegram's Bot API directly over HTTPS.
 *
 * `node-telegram-bot-api` (in package.json since Phase 1) is built around long-polling or
 * webhooks for *receiving* updates — overkill and awkward in a serverless environment for a
 * send-only use case. The Bot API's sendMessage endpoint is a plain HTTPS POST, so a direct
 * fetch call is simpler, has no persistent-connection requirements, and works identically in
 * any Next.js API route. The dependency is kept for a future interactive bot (Phase 10 doesn't
 * need one — commands, replies, etc. would be a separate webhook-based route).
 */
export async function sendTelegramMessage(chatId: string, html: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN is not set.');

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: html, parse_mode: 'HTML' }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
  }
}

export function isTelegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}
