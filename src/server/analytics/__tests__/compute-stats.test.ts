import { computeWinRateSummary, groupByPeriod, type ResolvedRecord } from '../compute-stats';

function record(partial: Partial<ResolvedRecord>): ResolvedRecord {
  return {
    outcome: 'WIN',
    closedAt: new Date('2026-07-12T10:00:00Z'),
    pnlPips: 10,
    confidenceScore: 70,
    ...partial,
  };
}

describe('computeWinRateSummary', () => {
  it('computes win rate as WIN / (WIN + LOSS), excluding BREAK_EVEN and PENDING', () => {
    const records = [
      record({ outcome: 'WIN' }),
      record({ outcome: 'WIN' }),
      record({ outcome: 'LOSS' }),
      record({ outcome: 'BREAK_EVEN' }),
      record({ outcome: 'PENDING', closedAt: null, pnlPips: null }),
    ];
    const summary = computeWinRateSummary(records);
    expect(summary.wins).toBe(2);
    expect(summary.losses).toBe(1);
    expect(summary.breakEven).toBe(1);
    expect(summary.winRate).toBeCloseTo((2 / 3) * 100, 5);
  });

  it('returns null win rate when there are no decisive (WIN/LOSS) records', () => {
    const records = [
      record({ outcome: 'BREAK_EVEN' }),
      record({ outcome: 'PENDING', closedAt: null }),
    ];
    const summary = computeWinRateSummary(records);
    expect(summary.winRate).toBeNull();
  });

  it('computes average pnlPips across all resolved records with a pnl value', () => {
    const records = [record({ pnlPips: 10 }), record({ pnlPips: -4 }), record({ pnlPips: 6 })];
    const summary = computeWinRateSummary(records);
    expect(summary.avgPnlPips).toBeCloseTo(4, 5);
  });

  it('returns 100% win rate when every decisive record won', () => {
    const records = [record({ outcome: 'WIN' }), record({ outcome: 'WIN' })];
    const summary = computeWinRateSummary(records);
    expect(summary.winRate).toBe(100);
  });

  it('returns 0% win rate when every decisive record lost', () => {
    const records = [record({ outcome: 'LOSS' }), record({ outcome: 'LOSS' })];
    const summary = computeWinRateSummary(records);
    expect(summary.winRate).toBe(0);
  });
});

describe('groupByPeriod', () => {
  it('groups records into daily buckets by closedAt date', () => {
    const records = [
      record({ closedAt: new Date('2026-07-12T08:00:00Z'), outcome: 'WIN' }),
      record({ closedAt: new Date('2026-07-12T20:00:00Z'), outcome: 'LOSS' }),
      record({ closedAt: new Date('2026-07-13T08:00:00Z'), outcome: 'WIN' }),
    ];
    const buckets = groupByPeriod(records, 'daily');
    expect(buckets).toHaveLength(2);
    expect(buckets[0]!.label).toBe('2026-07-12');
    expect(buckets[0]!.total).toBe(2);
    expect(buckets[1]!.label).toBe('2026-07-13');
    expect(buckets[1]!.total).toBe(1);
  });

  it('groups records into monthly buckets', () => {
    const records = [
      record({ closedAt: new Date('2026-06-01T00:00:00Z') }),
      record({ closedAt: new Date('2026-06-28T00:00:00Z') }),
      record({ closedAt: new Date('2026-07-01T00:00:00Z') }),
    ];
    const buckets = groupByPeriod(records, 'monthly');
    expect(buckets.map((b) => b.label)).toEqual(['2026-06', '2026-07']);
  });

  it('excludes PENDING (unresolved) records from every bucket', () => {
    const records = [
      record({ outcome: 'WIN', closedAt: new Date('2026-07-12T00:00:00Z') }),
      record({ outcome: 'PENDING', closedAt: null }),
    ];
    const buckets = groupByPeriod(records, 'daily');
    expect(buckets).toHaveLength(1);
    expect(buckets[0]!.total).toBe(1);
  });

  it('sorts buckets chronologically', () => {
    const records = [
      record({ closedAt: new Date('2026-07-13T00:00:00Z') }),
      record({ closedAt: new Date('2026-07-11T00:00:00Z') }),
      record({ closedAt: new Date('2026-07-12T00:00:00Z') }),
    ];
    const buckets = groupByPeriod(records, 'daily');
    expect(buckets.map((b) => b.label)).toEqual(['2026-07-11', '2026-07-12', '2026-07-13']);
  });
});
