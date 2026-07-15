'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Download, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { SignalFeed } from '@/components/dashboard/signal-feed';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { SignalFeedItem } from '@/types/signal';

const STATUS_FILTERS = ['ALL', 'ACTIVE', 'WON', 'LOST', 'EXPIRED'] as const;
const PAGE_SIZE = 20;

export default function SignalsPage() {
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('ALL');
  const [pair, setPair] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [signals, setSignals] = useState<SignalFeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    if (pair) params.set('pair', pair);
    if (search) params.set('search', search);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    return params;
  }, [status, pair, search, page]);

  const load = useCallback(() => {
    setLoading(true);
    apiFetch<{ signals: SignalFeedItem[]; total: number }>(
      `/api/signals?${buildParams().toString()}`,
    )
      .then((res) => {
        setSignals(res.signals);
        setTotal(res.total);
      })
      .finally(() => setLoading(false));
  }, [buildParams]);

  useEffect(() => {
    const t = setTimeout(load, 250); // light debounce, mainly for the search box
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    setPage(1); // any filter change resets to page 1
  }, [status, pair, search]);

  function handleExport() {
    const params = buildParams();
    params.delete('page');
    params.delete('pageSize');
    window.open(`/api/signals/export?${params.toString()}`, '_blank');
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium">Signals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} signal{total === 1 ? '' : 's'} match your filters.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-medium hover:bg-white/5"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                status === f
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-white/10 text-muted-foreground hover:bg-white/5',
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          value={pair}
          onChange={(e) => setPair(e.target.value)}
          placeholder="Pair (e.g. EUR/USD)"
          className="w-40 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs outline-none ring-primary/50 focus:ring-2"
        />

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technical summary…"
            className="w-full rounded-full border border-white/10 bg-white/5 py-1.5 pl-8 pr-3 text-xs outline-none ring-primary/50 focus:ring-2"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : (
        <>
          <SignalFeed signals={signals} />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-full border border-white/10 p-2 text-muted-foreground hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-full border border-white/10 p-2 text-muted-foreground hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
