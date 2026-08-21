import { buildStrategySnapshot } from '../strategy-snapshot';

const candles = Array.from({ length: 20 }, (_, i) => ({
  timestamp: new Date(1_700_000_000_000 + i * 60_000),
  open: 1.1,
  high: 1.101 + i * 0.0001,
  low: 1.099 - i * 0.0001,
  close: 1.1,
  volume: 0,
}));

describe('buildStrategySnapshot', () => {
  it('marks only zones backed by a contributing rule as used', () => {
    const snapshot = buildStrategySnapshot(
      1.1,
      candles,
      {
        atr: 0.001,
        pivotPoints: { pivot: 1.1, r1: 1.11, r2: 1.12, r3: 1.13, s1: 1.09, s2: 1.08, s3: 1.07 },
      },
      {
        direction: 'BUY',
        confidenceScore: 80,
        riskLevel: 'MEDIUM',
        technicalSummary: 'test',
        contributingRuleNames: ['market_structure'],
      },
      [{ name: 'market_structure', bias: 1, strength: 0.7, rationale: 'Higher highs and lows.' }],
    );

    expect(
      snapshot.zones.filter((zone) => zone.kind === 'LIQUIDITY').every((zone) => zone.used),
    ).toBe(true);
    expect(
      snapshot.zones.filter((zone) => zone.kind !== 'LIQUIDITY').every((zone) => !zone.used),
    ).toBe(true);
  });
});
