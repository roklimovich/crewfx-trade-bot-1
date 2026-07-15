'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// recharts is a meaningfully large dependency for something that isn't needed until this chart
// actually renders — splitting it into its own chunk keeps it out of the initial dashboard bundle.
const WinRateAreaChart = dynamic(
  () => import('./win-rate-area-chart').then((m) => m.WinRateAreaChart),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[220px] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    ),
  },
);

type Period = 'daily' | 'weekly' | 'monthly';

interface PerformanceBucket {
  label: string;
  winRate: number | null;
  total: number;
}

const PERIOD_LABELS: Record<Period, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
};

export function PerformanceChart() {
  const [period, setPeriod] = useState<Period>('daily');
  const [buckets, setBuckets] = useState<PerformanceBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ buckets: PerformanceBucket[] }>(`/api/analytics/performance?period=${period}`)
      .then((res) => setBuckets(res.buckets))
      .finally(() => setLoading(false));
  }, [period]);

  // recharts can't plot a null win-rate point cleanly — filter to buckets that actually resolved.
  const chartData = buckets.filter((b) => b.winRate !== null);

  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-base font-medium">Win rate over time</h3>
        <div className="flex gap-1">
          {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                period === p
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-white/10 text-muted-foreground hover:bg-white/5',
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex h-[220px] items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-[220px] items-center justify-center text-center text-sm text-muted-foreground">
          No resolved signals yet for this period — the chart fills in as signals expire and get
          scored.
        </div>
      ) : (
        <WinRateAreaChart data={chartData} />
      )}
    </div>
  );
}
