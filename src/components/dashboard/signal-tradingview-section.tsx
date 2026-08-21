'use client';

import { TradingViewChart } from './tradingview-chart';
import type { SignalFeedItem } from '@/types/signal';
import { cn } from '@/lib/utils';

const ZONE_STYLES: Record<string, string> = {
  SUPPORT: 'border-success/30 bg-success/10 text-success',
  RESISTANCE: 'border-danger/30 bg-danger/10 text-danger',
  LIQUIDITY: 'border-accent/30 bg-accent/10 text-accent',
  ORDER_BLOCK: 'border-primary/30 bg-primary/10 text-primary',
  IMBALANCE: 'border-orange-400/30 bg-orange-400/10 text-orange-300',
  TRENDLINE: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
};

export function SignalTradingViewSection({ signals }: { signals: SignalFeedItem[] }) {
  const signal =
    signals.find((item) => item.status === 'ACTIVE' && item.analysisSnapshot) ??
    signals.find((item) => item.analysisSnapshot);
  if (!signal) return null;

  const snapshot = signal.analysisSnapshot!;
  return (
    <section id="live-signal-chart" className="glass-panel overflow-hidden p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium">Live signal chart</h2>
          <p className="text-xs text-muted-foreground">
            {signal.pair} · {signal.timeframe} · TradingView live data and indicators
          </p>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
          {signal.direction} · entry {signal.entryPrice} · {signal.confidenceScore}%
        </span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <TradingViewChart pair={signal.pair} timeframe={signal.timeframe} height={560} />
        <aside className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <h3 className="text-sm font-medium">Why this setup</h3>
          <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
            {snapshot.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <h3 className="mt-5 text-sm font-medium">Detected price areas</h3>
          <div className="mt-3 space-y-2">
            {snapshot.zones.map((zone) => (
              <div
                key={`${zone.label}-${zone.low}`}
                className={cn('rounded-lg border p-2 text-xs', ZONE_STYLES[zone.kind])}
              >
                <p className="font-medium">
                  {zone.label}
                  {zone.used ? ' · used' : ''}
                </p>
                <p className="mt-0.5 font-mono opacity-80">
                  {zone.low} – {zone.high}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
            EMA, RSI, and MACD are enabled on the chart. The free TradingView embed cannot accept
            custom drawings, so engine-detected zones are kept here with their exact price ranges.
          </p>
        </aside>
      </div>
    </section>
  );
}
