import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/format-time';
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
          <div
            key={signal.id}
            className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
          >
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
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
