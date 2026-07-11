'use client';

import { useEffect, useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';

interface Setting {
  id: string;
  key: string;
  value: unknown;
  updatedAt: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ settings: Setting[] }>('/api/admin/settings')
      .then((res) => {
        setSettings(res.settings);
        setDrafts(Object.fromEntries(res.settings.map((s) => [s.key, JSON.stringify(s.value)])));
      })
      .finally(() => setLoading(false));
  }, []);

  async function save(key: string) {
    setSavingKey(key);
    setError(null);
    try {
      const value = JSON.parse(drafts[key] ?? 'null');
      await apiFetch('/api/admin/settings', { method: 'PATCH', body: { key, value } });
      setSavedKey(key);
      setTimeout(() => setSavedKey(null), 2000);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof SyntaxError
            ? 'Value must be valid JSON (e.g. 65, true, or ["A","B"]).'
            : 'Could not save.',
      );
    } finally {
      setSavingKey(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Platform settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Values are stored as JSON — numbers, booleans, strings, and arrays are all valid.
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-4">
        {settings.map((setting) => (
          <div key={setting.key} className="glass-panel p-5">
            <label className="mb-1.5 block text-sm font-medium">{setting.key}</label>
            <div className="flex gap-3">
              <input
                value={drafts[setting.key] ?? ''}
                onChange={(e) => setDrafts((d) => ({ ...d, [setting.key]: e.target.value }))}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2.5 font-mono text-sm outline-none ring-primary/50 focus:ring-2"
              />
              <button
                onClick={() => save(setting.key)}
                disabled={savingKey === setting.key}
                className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {savingKey === setting.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : savedKey === setting.key ? (
                  <Check className="h-4 w-4" />
                ) : null}
                Save
              </button>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Last updated {new Date(setting.updatedAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
