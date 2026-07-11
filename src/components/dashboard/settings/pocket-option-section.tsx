'use client';

import { useState } from 'react';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';

interface PocketOptionSectionProps {
  pocketOption: { accountId: string; verified: boolean } | null;
  onSubmitted: (accountId: string) => void;
}

export function PocketOptionSection({ pocketOption, onSubmitted }: PocketOptionSectionProps) {
  const [accountId, setAccountId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/auth/pocket-option', { method: 'POST', body: { accountId } });
      onSubmitted(accountId);
      setAccountId('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not submit.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-panel p-6">
      <h2 className="font-display text-lg font-medium">Pocket Option ID</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Submit your Pocket Option account ID for admin verification. We only ever ask for the ID —
        never credentials, and we never place trades on your account.
      </p>

      {pocketOption ? (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
          {pocketOption.verified ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
          ) : (
            <Clock className="h-5 w-5 shrink-0 text-accent" />
          )}
          <div>
            <p className="font-mono text-sm">{pocketOption.accountId}</p>
            <p className="text-xs text-muted-foreground">
              {pocketOption.verified ? 'Verified' : 'Pending admin verification'}
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            placeholder="Your Pocket Option account ID"
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none ring-primary/50 focus:ring-2"
          />
          <button
            onClick={handleSubmit}
            disabled={loading || accountId.length < 3}
            className="flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
    </section>
  );
}
