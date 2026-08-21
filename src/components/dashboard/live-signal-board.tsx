'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Radio, Timer } from 'lucide-react';
import type { SignalFeedItem } from '@/types/signal';
import { cn } from '@/lib/utils';

function timeLeft(expirationTime: string, now: number): string {
  const remaining = Math.max(0, new Date(expirationTime).getTime() - now);
  const minutes = Math.floor(remaining / 60_000);
  const seconds = Math.floor((remaining % 60_000) / 1_000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function LiveSignalBoard({ signals }: { signals: SignalFeedItem[] }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, []);

  const active = useMemo(
    () =>
      signals.filter(
        (signal) =>
          signal.status === 'ACTIVE' &&
          signal.expirationTime &&
          new Date(signal.expirationTime).getTime() > now,
      ),
    [signals, now],
  );

  return (
    <section className="space-y-4">
      <div className="glass-panel p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Radio className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                CrewFX Pulse
              </p>
              <h2 className="mt-1 font-display text-xl font-medium">Live signal engine</h2>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                The engine scans configured Forex pairs automatically. A signal appears only after
                strategy confirmation; no manual refresh is needed.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
            Live market scan
          </span>
        </div>
      </div>

      <div className="glass-panel overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-white/5 px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-medium">Active signals</h2>
            <p className="text-xs text-muted-foreground">
              Signals leave this area at expiry and move to validated results.
            </p>
          </div>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
            {active.length} live
          </span>
        </div>

        {active.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No confirmed setup is active right now. The engine is still scanning—rather than issuing
            a low-confidence signal.
          </div>
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((signal) => {
              const buy = signal.direction === 'BUY';
              return (
                <a
                  key={signal.id}
                  href="#live-signal-chart"
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg',
                          buy ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
                        )}
                      >
                        {buy ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </span>
                      <div>
                        <p className="font-mono text-sm font-medium">{signal.pair}</p>
                        <p className="text-xs text-muted-foreground">
                          {signal.timeframe} · {signal.direction}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-medium text-primary">
                      {signal.confidenceScore}%
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/5 pt-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Entry
                      </p>
                      <p className="mt-1 font-mono text-sm">{signal.entryPrice}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                        <Timer className="h-3 w-3" /> Remaining
                      </p>
                      <p className="mt-1 font-mono text-sm">
                        {timeLeft(signal.expirationTime!, now)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-medium text-primary">Open chart and analysis →</p>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
