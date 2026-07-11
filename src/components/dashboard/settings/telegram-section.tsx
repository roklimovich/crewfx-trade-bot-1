'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Send } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';

interface TelegramSectionProps {
  telegram: { username: string | null; linkedAt: string } | null;
  onLinked: (username: string | null) => void;
}

interface TelegramAuthPayload {
  id: number;
  first_name: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramAuthPayload) => void;
  }
}

export function TelegramSection({ telegram, onLinked }: TelegramSectionProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

  useEffect(() => {
    if (telegram || !botUsername || !widgetRef.current) return;

    window.onTelegramAuth = async (user: TelegramAuthPayload) => {
      try {
        await apiFetch('/api/auth/telegram', { method: 'POST', body: user });
        onLinked(user.username ?? null);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Could not link Telegram.');
      }
    };

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', botUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    widgetRef.current.appendChild(script);

    return () => {
      window.onTelegramAuth = undefined;
    };
  }, [telegram, botUsername, onLinked]);

  return (
    <section className="glass-panel p-6">
      <h2 className="font-display text-lg font-medium">Telegram</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Link Telegram to receive signals instantly (Phase 10) and to log in with one tap.
      </p>

      <div className="mt-5">
        {telegram ? (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
            <div>
              <p className="text-sm">
                {telegram.username ? `@${telegram.username}` : 'Telegram account linked'}
              </p>
              <p className="text-xs text-muted-foreground">
                Linked {new Date(telegram.linkedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ) : botUsername ? (
          <div ref={widgetRef} />
        ) : (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Send className="h-4 w-4" />
            Set <code className="rounded bg-white/10 px-1">
              NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
            </code>{' '}
            in .env to enable the login widget here.
          </p>
        )}
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
