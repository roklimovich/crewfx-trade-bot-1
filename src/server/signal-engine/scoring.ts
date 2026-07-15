import type { RuleResult } from './types';
import type { VolatilityReading } from './rules/volatility';

export interface SignalDecision {
  direction: 'BUY' | 'SELL';
  confidenceScore: number; // 0–100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  technicalSummary: string;
  contributingRuleNames: string[];
}

/** Minimum number of non-skipped directional rules required before the engine will even consider firing. */
const MIN_ACTIVE_RULES = 3;
/** Net weighted bias (-1..1) must clear this magnitude to count as a direction, not "ranging". */
const DIRECTION_THRESHOLD = 0.25;

/**
 * Combines every rule's vote into one decision. This is the "avoid generating signals during
 * low-confidence or ranging market conditions" requirement made concrete: returns null whenever
 * there isn't enough data, the rules disagree, or the net signal is too weak — never forces a
 * BUY/SELL out of a coin flip.
 */
export function combineSignalRules(
  directionalRules: RuleResult[],
  volatility: VolatilityReading,
  minConfidenceScore: number,
): SignalDecision | null {
  const active = directionalRules.filter((r) => !r.skipped);

  if (active.length < MIN_ACTIVE_RULES) {
    return null; // not enough data to make a responsible call
  }

  const weightedSum = active.reduce((sum, r) => sum + r.bias * r.strength, 0);
  const totalWeight = active.reduce((sum, r) => sum + r.strength, 0);
  const net = totalWeight > 0 ? weightedSum / totalWeight : 0;

  if (Math.abs(net) < DIRECTION_THRESHOLD) {
    return null; // ranging / conflicting — the whole point of this function is to say nothing here
  }

  const direction: 'BUY' | 'SELL' = net > 0 ? 'BUY' : 'SELL';

  // Agreement ratio: what fraction of the *votes in the winning direction's favor* actually agree,
  // vs voting the other way. A near-unanimous read scores higher than a narrow majority.
  const agreeing = active.filter((r) => Math.sign(r.bias) === Math.sign(net) || r.bias === 0);
  const agreementRatio = agreeing.length / active.length;

  const magnitudeScore = Math.min(1, Math.abs(net)); // 0–1
  const baseConfidence = 45 + magnitudeScore * 40; // 45–85 before adjustments
  const confidenceScore = clamp(
    Math.round(baseConfidence * agreementRatio * volatility.confidenceMultiplier),
    0,
    100,
  );

  if (confidenceScore < minConfidenceScore) {
    return null; // below the platform's configured bar (Setting: signal.min_confidence_score)
  }

  const contributingRuleNames = active.map((r) => r.name);
  const technicalSummary = [...active.map((r) => r.rationale), volatility.rationale]
    .filter(Boolean)
    .join(' ');

  return {
    direction,
    confidenceScore,
    riskLevel: volatility.risk.level,
    technicalSummary,
    contributingRuleNames,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
