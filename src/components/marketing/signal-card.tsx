import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalCardProps {
  pair: string;
  direction: 'BUY' | 'SELL';
  confidence: number;
  price: string;
  timeframe: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SignalCard({
  pair,
  direction,
  confidence,
  price,
  timeframe,
  className,
  style,
}: SignalCardProps) {
  const isBuy = direction === 'BUY';
  return (
    <div
      className={cn(
        'glass-panel w-64 shrink-0 animate-float p-4 shadow-[0_20px_60px_-15px_rgba(139,107,255,0.35)]',
        className,
      )}
      style={style}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm tracking-wide text-muted-foreground">{pair}</span>
        <span
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            isBuy ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
          )}
        >
          {isBuy ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {direction}
        </span>
      </div>
      <div className="mt-3 font-mono text-2xl font-medium text-foreground">{price}</div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>{timeframe}</span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          {confidence}% confidence
        </span>
      </div>
    </div>
  );
}
