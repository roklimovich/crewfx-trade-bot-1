'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { useTranslations } from '@/i18n/locale-provider';

export default function RegisterPage() {
  const { messages: t } = useTranslations();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: { name, email, password } });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h1 className="mt-4 font-display text-2xl font-medium">{t.auth.register.checkEmail}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t.auth.register.checkEmailDescriptionPrefix}{' '}
          <span className="text-foreground">{email}</span>.{' '}
          {t.auth.register.checkEmailDescriptionSuffix}
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-primary hover:underline">
          {t.auth.register.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">{t.auth.register.title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{t.auth.register.subtitle}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="name" className="mb-1.5 block text-sm text-muted-foreground">
            {t.auth.register.name}
          </label>
          <input
            id="name"
            type="text"
            required
            minLength={2}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-muted-foreground">
            {t.auth.register.email}
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm text-muted-foreground">
            {t.auth.register.password}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">{t.auth.register.passwordHint}</p>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {t.auth.register.submit}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t.auth.register.haveAccount}{' '}
        <Link href="/login" className="text-primary hover:underline">
          {t.auth.login.submit}
        </Link>
      </p>
    </div>
  );
}
