'use client';

import { useState } from 'react';
import { SignalFeed } from '@/components/dashboard/signal-feed';
import { mockSignals } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

const FILTERS = ['ALL', 'ACTIVE', 'WON', 'LOST', 'EXPIRED'] as const;

export default function SignalsPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');

  const filtered = filter === 'ALL' ? mockSignals : mockSignals.filter((s) => s.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Signals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Full history and search land in Phase 11 — this is the live feed for now.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
              filter === f
                ? 'border-primary/50 bg-primary/15 text-primary'
                : 'border-white/10 text-muted-foreground hover:bg-white/5',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <SignalFeed signals={filtered} />
      ) : (
        <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
          No signals match this filter right now.
        </div>
      )}
    </div>
  );
}
