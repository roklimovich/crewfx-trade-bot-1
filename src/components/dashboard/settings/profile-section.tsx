'use client';

import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';

export function ProfileSection({
  name,
  email,
  onSaved,
}: {
  name: string | null;
  email: string;
  onSaved: (name: string) => void;
}) {
  const [value, setValue] = useState(name ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiFetch('/api/auth/me', { method: 'PATCH', body: { name: value } });
      onSaved(value);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-panel p-6">
      <h2 className="font-display text-lg font-medium">Profile</h2>
      <p className="mt-1 text-sm text-muted-foreground">Your name and email on this account.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Name</label>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm outline-none ring-primary/50 focus:ring-2"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Email</label>
          <input
            value={email}
            disabled
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-muted-foreground opacity-70"
          />
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <button
        onClick={handleSave}
        disabled={saving || value === (name ?? '')}
        className="mt-5 flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <Check className="h-4 w-4" />
        ) : null}
        {saved ? 'Saved' : 'Save changes'}
      </button>
    </section>
  );
}
