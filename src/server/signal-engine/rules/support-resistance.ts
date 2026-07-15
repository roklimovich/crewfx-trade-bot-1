import type { IndicatorSnapshot, RuleResult } from '../types';

/**
 * Support/Resistance: is price sitting close enough to a pivot support/resistance level that a
 * bounce (off support) or rejection (off resistance) is a plausible read? "Close enough" is
 * defined as within 0.15% of the level — tight enough to mean something, loose enough to account
 * for normal price noise around round-ish levels.
 */
export function analyzeSupportResistance(
  closePrice: number,
  indicators: IndicatorSnapshot,
): RuleResult {
  if (!indicators.pivotPoints) {
    return {
      name: 'support_resistance',
      bias: 0,
      strength: 0,
      rationale: 'Pivot points not yet available.',
      skipped: true,
    };
  }

  const { pivot, r1, s1 } = indicators.pivotPoints;
  const proximityThresholdPct = 0.15;

  const distanceToPct = (level: number) => (Math.abs(closePrice - level) / closePrice) * 100;

  if (distanceToPct(s1) < proximityThresholdPct) {
    return {
      name: 'support_resistance',
      bias: 1,
      strength: 0.6,
      rationale: `Price is sitting on S1 support (${s1.toFixed(5)}) — a bounce is plausible.`,
    };
  }
  if (distanceToPct(r1) < proximityThresholdPct) {
    return {
      name: 'support_resistance',
      bias: -1,
      strength: 0.6,
      rationale: `Price is sitting on R1 resistance (${r1.toFixed(5)}) — a rejection is plausible.`,
    };
  }
  if (distanceToPct(pivot) < proximityThresholdPct) {
    return {
      name: 'support_resistance',
      bias: 0,
      strength: 0.2,
      rationale: `Price is sitting right at the pivot (${pivot.toFixed(5)}) — no clear edge either way.`,
    };
  }

  return {
    name: 'support_resistance',
    bias: 0,
    strength: 0.1,
    rationale: 'Price is not near a significant pivot level.',
  };
}
