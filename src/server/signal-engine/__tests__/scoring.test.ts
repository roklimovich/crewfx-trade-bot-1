import { combineSignalRules } from '../scoring';
import type { RuleResult } from '../types';
import type { VolatilityReading } from '../rules/volatility';

const neutralVolatility: VolatilityReading = {
  risk: { level: 'MEDIUM', rationale: 'Normal volatility.' },
  confidenceMultiplier: 1,
  rationale: 'Normal volatility.',
};

function rule(name: string, bias: -1 | 0 | 1, strength: number, skipped = false): RuleResult {
  return { name, bias, strength, rationale: `${name} says ${bias}`, skipped };
}

describe('combineSignalRules', () => {
  it('returns a BUY when rules strongly and consistently agree bullish', () => {
    const rules = [
      rule('trend', 1, 0.8),
      rule('momentum', 1, 0.7),
      rule('market_structure', 1, 0.6),
    ];
    const result = combineSignalRules(rules, neutralVolatility, 50);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('BUY');
    expect(result!.confidenceScore).toBeGreaterThanOrEqual(50);
  });

  it('returns a SELL when rules strongly and consistently agree bearish', () => {
    const rules = [
      rule('trend', -1, 0.8),
      rule('momentum', -1, 0.7),
      rule('market_structure', -1, 0.6),
    ];
    const result = combineSignalRules(rules, neutralVolatility, 50);
    expect(result).not.toBeNull();
    expect(result!.direction).toBe('SELL');
  });

  it('returns null when rules conflict (net bias near zero)', () => {
    const rules = [
      rule('trend', 1, 0.5),
      rule('momentum', -1, 0.5),
      rule('market_structure', 1, 0.4),
      rule('support_resistance', -1, 0.4),
    ];
    const result = combineSignalRules(rules, neutralVolatility, 50);
    expect(result).toBeNull();
  });

  it('returns null when fewer than the minimum number of rules have real data', () => {
    const rules = [
      rule('trend', 1, 0.9),
      rule('momentum', 0, 0, true), // skipped
      rule('market_structure', 0, 0, true), // skipped
    ];
    const result = combineSignalRules(rules, neutralVolatility, 50);
    expect(result).toBeNull();
  });

  it('returns null when confidence falls below the configured minimum', () => {
    const rules = [
      rule('trend', 1, 0.3),
      rule('momentum', 1, 0.3),
      rule('market_structure', 1, 0.3),
    ];
    const result = combineSignalRules(rules, neutralVolatility, 95); // deliberately high bar
    expect(result).toBeNull();
  });

  it('lets volatility suppress an otherwise-confident signal (Bollinger squeeze scenario)', () => {
    const rules = [
      rule('trend', 1, 0.8),
      rule('momentum', 1, 0.7),
      rule('market_structure', 1, 0.6),
    ];
    const squeeze: VolatilityReading = {
      risk: { level: 'MEDIUM', rationale: 'Squeeze.' },
      confidenceMultiplier: 0.1, // heavy penalty
      rationale: 'Bollinger squeeze — direction not confirmed.',
    };
    const result = combineSignalRules(rules, squeeze, 50);
    expect(result).toBeNull();
  });

  it('never returns a direction without at least one contributing rule listed', () => {
    const rules = [
      rule('trend', 1, 0.9),
      rule('momentum', 1, 0.9),
      rule('market_structure', 1, 0.9),
    ];
    const result = combineSignalRules(rules, neutralVolatility, 50);
    expect(result!.contributingRuleNames.length).toBeGreaterThan(0);
  });
});
