export interface ResolvedRecord {
  outcome: 'WIN' | 'LOSS' | 'BREAK_EVEN' | 'PENDING';
  closedAt: Date | null;
  pnlPips: number | null;
  confidenceScore: number;
}

export interface WinRateSummary {
  winRate: number | null; // null when there's nothing resolved yet to compute from
  totalResolved: number;
  wins: number;
  losses: number;
  breakEven: number;
  avgPnlPips: number | null;
}

/**
 * Win rate is defined as WIN / (WIN + LOSS) — BREAK_EVEN is excluded from both sides of the
 * ratio (neither a win nor a loss) and PENDING records aren't resolved yet, so they're excluded
 * entirely. "Win rate" and "accuracy" are treated as the same number throughout this app rather
 * than inventing two different formulas that would produce two official-looking percentages
 * without a clear, meaningful distinction between them for a rule-based signal engine.
 */
export function computeWinRateSummary(records: ResolvedRecord[]): WinRateSummary {
  const wins = records.filter((r) => r.outcome === 'WIN').length;
  const losses = records.filter((r) => r.outcome === 'LOSS').length;
  const breakEven = records.filter((r) => r.outcome === 'BREAK_EVEN').length;
  const totalResolved = wins + losses + breakEven;

  const decisive = wins + losses;
  const winRate = decisive > 0 ? (wins / decisive) * 100 : null;

  const pnlValues = records.filter((r) => r.pnlPips !== null).map((r) => r.pnlPips as number);
  const avgPnlPips =
    pnlValues.length > 0 ? pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length : null;

  return { winRate, totalResolved, wins, losses, breakEven, avgPnlPips };
}

export interface PeriodBucket {
  label: string; // e.g. "2026-07-12", "2026-W28", "2026-07"
  winRate: number | null;
  total: number;
}

/** Groups resolved records into daily/weekly/monthly buckets by their closedAt date, each with its own win rate. */
export function groupByPeriod(
  records: ResolvedRecord[],
  period: 'daily' | 'weekly' | 'monthly',
): PeriodBucket[] {
  const resolved = records.filter((r) => r.closedAt !== null && r.outcome !== 'PENDING');
  const buckets = new Map<string, ResolvedRecord[]>();

  for (const record of resolved) {
    const label = periodLabel(record.closedAt as Date, period);
    const existing = buckets.get(label) ?? [];
    existing.push(record);
    buckets.set(label, existing);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, bucketRecords]) => {
      const summary = computeWinRateSummary(bucketRecords);
      return { label, winRate: summary.winRate, total: bucketRecords.length };
    });
}

function periodLabel(date: Date, period: 'daily' | 'weekly' | 'monthly'): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  if (period === 'daily') return `${year}-${month}-${day}`;
  if (period === 'monthly') return `${year}-${month}`;

  // ISO week number
  const target = new Date(Date.UTC(year, date.getUTCMonth(), date.getUTCDate()));
  const dayNumber = (target.getUTCDay() + 6) % 7; // Monday = 0
  target.setUTCDate(target.getUTCDate() - dayNumber + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const weekNumber =
    1 +
    Math.round(
      ((target.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}
