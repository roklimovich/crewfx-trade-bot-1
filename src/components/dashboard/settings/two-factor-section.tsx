'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Loader2, ShieldCheck } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';

export function TwoFactorSection({
  enabled,
  onEnabled,
}: {
  enabled: boolean;
  onEnabled: () => void;
}) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSetup() {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ qrCodeDataUrl: string }>('/api/auth/2fa/setup', {
        method: 'POST',
      });
      setQrCode(res.qrCodeDataUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start setup.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSetup() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/auth/2fa/verify', { method: 'POST', body: { token: code } });
      onEnabled();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid code.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-panel p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-medium">
        <ShieldCheck className="h-5 w-5 text-primary" />
        Two-factor authentication
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Required for admin accounts to log in.</p>

      {enabled ? (
        <p className="mt-5 text-sm text-success">2FA is enabled on this account.</p>
      ) : qrCode ? (
        <div className="mt-5 space-y-4">
          <div className="w-fit rounded-lg bg-white p-3">
            <Image src={qrCode} alt="2FA QR code" width={160} height={160} unoptimized />
          </div>
          <p className="text-sm text-muted-foreground">
            Scan with your authenticator app, then enter the code:
          </p>
          <div className="flex gap-3">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              inputMode="numeric"
              placeholder="000000"
              className="w-32 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-center font-mono outline-none ring-primary/50 focus:ring-2"
            />
            <button
              onClick={confirmSetup}
              disabled={loading || code.length !== 6}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={startSetup}
          disabled={loading}
          className="mt-5 flex items-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-medium hover:bg-white/5 disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Enable 2FA
        </button>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
