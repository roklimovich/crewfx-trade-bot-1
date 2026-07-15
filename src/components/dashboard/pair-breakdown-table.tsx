'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface PairSummary {
  pair: string;
  winRate: number | null;
  totalResolved: number;
  wins: number;
  losses: number;
  breakEven: number;
  avgPnlPips: number | null;
}

export function PairBreakdownTable() {
  const [rows, setRows] = useState<PairSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ byPair: PairSummary[] }>('/api/analytics/summary')
      .then((res) => setRows(res.byPair))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="glass-panel overflow-hidden p-0">
      <div className="border-b border-white/10 px-5 py-3 text-sm font-medium">Win rate by pair</div>

      {loading ? (
        <div className="flex h-32 items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No resolved signals yet — this fills in as signals expire.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
              <th className="px-5 py-2 font-medium">Pair</th>
              <th className="px-5 py-2 font-medium">Win rate</th>
              <th className="px-5 py-2 font-medium">W / L / BE</th>
              <th className="px-5 py-2 font-medium">Avg pips</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.pair} className="border-b border-white/5 last:border-0">
                <td className="px-5 py-2.5 font-mono">{r.pair}</td>
                <td
                  className={cn(
                    'px-5 py-2.5 font-medium',
                    r.winRate === null
                      ? 'text-muted-foreground'
                      : r.winRate >= 50
                        ? 'text-success'
                        : 'text-danger',
                  )}
                >
                  {r.winRate !== null ? `${r.winRate.toFixed(1)}%` : '—'}
                </td>
                <td className="px-5 py-2.5 text-muted-foreground">
                  {r.wins} / {r.losses} / {r.breakEven}
                </td>
                <td className="px-5 py-2.5 font-mono text-muted-foreground">
                  {r.avgPnlPips !== null ? r.avgPnlPips.toFixed(1) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
