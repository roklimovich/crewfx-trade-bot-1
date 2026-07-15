'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { DEFAULT_PAIRS, DEFAULT_TIMEFRAMES } from '@/server/market-data/pairs';
import { cn } from '@/lib/utils';

// TradingViewChart pulls in a third-party script and only matters once it's actually visible —
// splitting it into its own chunk keeps it out of the initial dashboard JS bundle. ssr:false
// because it reaches for `window`/`document` to inject the script tag, which doesn't exist
// during server rendering anyway.
const TradingViewChart = dynamic(
  () => import('./tradingview-chart').then((m) => m.TradingViewChart),
  {
    ssr: false,
    loading: () => (
      <div className="glass-panel flex h-[680px] items-center justify-center p-2 text-sm text-muted-foreground">
        Loading chart…
      </div>
    ),
  },
);

export function LiveChartSection() {
  const [pair, setPair] = useState<string>(DEFAULT_PAIRS[0]);
  const [timeframe, setTimeframe] = useState<string>('M15');

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-medium">Live chart</h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-foreground outline-none"
          >
            {DEFAULT_PAIRS.map((p) => (
              <option key={p} value={p} className="bg-background">
                {p}
              </option>
            ))}
          </select>
          <div className="flex gap-1">
            {DEFAULT_TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                  timeframe === tf
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-white/10 text-muted-foreground hover:bg-white/5',
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>
      <TradingViewChart pair={pair} timeframe={timeframe} />
    </div>
  );
}
