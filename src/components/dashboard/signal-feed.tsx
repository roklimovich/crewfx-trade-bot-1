'use client';

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format-time';
import { apiFetch } from '@/lib/api-client';
import type { SignalFeedItem, SignalFeedStatus } from '@/types/signal';

const STATUS_STYLES: Record<SignalFeedStatus, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  ACTIVE: 'bg-primary/15 text-primary',
  WON: 'bg-success/15 text-success',
  LOST: 'bg-danger/15 text-danger',
  EXPIRED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-muted text-muted-foreground',
};

const RISK_STYLES: Record<SignalFeedItem['riskLevel'], string> = {
  LOW: 'text-success',
  MEDIUM: 'text-accent',
  HIGH: 'text-danger',
};

export function SignalFeed({ signals, limit }: { signals: SignalFeedItem[]; limit?: number }) {
  const rows = limit ? signals.slice(0, limit) : signals;
  const [reportedLosses, setReportedLosses] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function reportLoss(signalId: string) {
    setSubmitting(signalId);
    try {
      await apiFetch(`/api/signals/${signalId}/feedback`, {
        method: 'POST',
        body: { verdict: 'LOST' },
      });
      setReportedLosses((current) => new Set(current).add(signalId));
    } finally {
      setSubmitting(null);
    }
  }

  if (rows.length === 0) {
    return (
      <div className="glass-panel p-10 text-center text-sm text-muted-foreground">
        No signals yet. Once the engine runs, they&rsquo;ll show up here.
      </div>
    );
  }

  return (
    <div className="glass-panel divide-y divide-white/5 overflow-hidden p-0">
      {rows.map((signal) => {
        const isBuy = signal.direction === 'BUY';
        return (
          <div key={signal.id} className="flex flex-col gap-4 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-full',
                    isBuy ? 'bg-success/15' : 'bg-danger/15',
                  )}
                >
                  {isBuy ? (
                    <ArrowUpRight className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-danger" />
                  )}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{signal.pair}</span>
                    <span className="text-xs text-muted-foreground">{signal.timeframe}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[11px] font-medium',
                        STATUS_STYLES[signal.status],
                      )}
                    >
                      {signal.status}
                    </span>
                  </div>
                  <p className="mt-1 max-w-md text-xs text-muted-foreground">
                    {signal.technicalSummary}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <div className="text-right">
                  <p className="font-mono text-sm">{signal.entryPrice}</p>
                  <p className={cn('text-xs font-medium', RISK_STYLES[signal.riskLevel])}>
                    {signal.riskLevel} risk
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm">{signal.confidenceScore}%</p>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(signal.createdAt)}
                  </p>
                  {signal.status === 'ACTIVE' && signal.expirationTime && (
                    <p className="text-xs text-muted-foreground">
                      Valid until{' '}
                      {new Date(signal.expirationTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {signal.analysisSnapshot && (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs">
                <p className="mb-2 font-medium text-foreground">
                  Why this {isBuy ? 'BUY' : 'SELL'} setup
                </p>
                <ul className="space-y-1 text-muted-foreground">
                  {signal.analysisSnapshot.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap gap-2">
                  {signal.analysisSnapshot.zones.map((zone) => (
                    <span
                      key={`${zone.label}-${zone.low}`}
                      className={cn(
                        'rounded-md border px-2 py-1 font-mono',
                        zone.used
                          ? 'border-primary/40 bg-primary/10 text-primary'
                          : 'border-white/10 text-muted-foreground',
                      )}
                    >
                      {zone.label}: {zone.low}–{zone.high}
                      {zone.used ? ' • used' : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {signal.history && signal.history.outcome !== 'PENDING' && (
              <p className="text-xs text-muted-foreground">
                Reference close: {signal.history.closePrice ?? '—'} · {signal.history.outcome} ({' '}
                {signal.history.pnlPips?.toFixed(1) ?? '—'} pips)
              </p>
            )}

            {signal.status !== 'ACTIVE' && (
              <div>
                {signal.reportedLoss || reportedLosses.has(signal.id) ? (
                  <span className="text-xs text-muted-foreground">
                    Your loss report was saved for review.
                  </span>
                ) : (
                  <button
                    onClick={() => reportLoss(signal.id)}
                    disabled={submitting === signal.id}
                    className="text-xs text-danger hover:underline disabled:opacity-50"
                  >
                    {submitting === signal.id ? 'Saving…' : 'I lost money on this signal'}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
