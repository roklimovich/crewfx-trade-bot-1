'use client';

import { Suspense, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [needsTwoFactor, setNeedsTwoFactor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiFetch('/api/auth/login', {
        method: 'POST',
        body: { email, password, twoFactorToken: needsTwoFactor ? twoFactorToken : undefined },
      });
      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError && err.status === 401 && err.message === '2FA_REQUIRED') {
        setNeedsTwoFactor(true);
        setError('Enter the 6-digit code from your authenticator app.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Something went wrong. Try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-medium">Welcome back</h1>
      <p className="mt-2 text-sm text-muted-foreground">Log in to see today&rsquo;s signals.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-muted-foreground">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={needsTwoFactor}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2 disabled:opacity-50"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm text-muted-foreground">
              Password
            </label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={needsTwoFactor}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2 disabled:opacity-50"
          />
        </div>

        {needsTwoFactor && (
          <div>
            <label htmlFor="twoFactorToken" className="mb-1.5 block text-sm text-muted-foreground">
              Authenticator code
            </label>
            <input
              id="twoFactorToken"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={twoFactorToken}
              onChange={(e) => setTwoFactorToken(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-center font-mono text-lg tracking-[0.5em] outline-none ring-primary/50 transition-shadow focus:ring-2"
              placeholder="000000"
            />
          </div>
        )}

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {needsTwoFactor ? 'Verify & log in' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&rsquo;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
