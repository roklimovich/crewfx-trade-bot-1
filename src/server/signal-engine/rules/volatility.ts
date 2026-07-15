import type { IndicatorSnapshot, RiskContribution } from '../types';

export interface VolatilityReading {
  risk: RiskContribution;
  /** A confidence multiplier (0–1): extremely low volatility means no real move is happening;
   * extremely high volatility means direction is unreliable even if indicators agree. */
  confidenceMultiplier: number;
  rationale: string;
}

/**
 * Volatility doesn't vote on direction — it decides how much to trust the direction other rules
 * already voted for, and what risk label to attach. High ATR relative to price = bigger, less
 * predictable moves. A Bollinger squeeze = compressed range, often *before* a real move starts,
 * so confidence is capped even if other indicators look confident.
 */
export function analyzeVolatility(
  closePrice: number,
  indicators: IndicatorSnapshot,
): VolatilityReading {
  const notes: string[] = [];
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  let confidenceMultiplier = 1;

  if (indicators.atr !== undefined && closePrice > 0) {
    const atrPct = (indicators.atr / closePrice) * 100;
    if (atrPct > 0.8) {
      riskLevel = 'HIGH';
      confidenceMultiplier *= 0.75;
      notes.push(`ATR is ${atrPct.toFixed(2)}% of price — volatility is elevated.`);
    } else if (atrPct < 0.15) {
      riskLevel = 'LOW';
      confidenceMultiplier *= 0.85; // too quiet can mean "nothing is happening", not "safe"
      notes.push(`ATR is ${atrPct.toFixed(2)}% of price — volatility is muted.`);
    } else {
      notes.push(`ATR is ${atrPct.toFixed(2)}% of price — normal range.`);
    }
  }

  if (indicators.bollinger) {
    const { upper, middle, lower } = indicators.bollinger;
    const bandwidthPct = middle > 0 ? ((upper - lower) / middle) * 100 : 0;
    if (bandwidthPct < 0.5) {
      confidenceMultiplier *= 0.6; // squeeze — a breakout may be coming but direction isn't confirmed yet
      notes.push('Bollinger Bands are in a squeeze — direction is not yet confirmed.');
      if (riskLevel === 'LOW') riskLevel = 'MEDIUM'; // a squeeze can resolve violently
    } else if (bandwidthPct > 3) {
      notes.push('Bollinger Bands are wide — an expansion is already underway.');
      confidenceMultiplier = Math.min(1, confidenceMultiplier * 1.1);
    }
  }

  return {
    risk: {
      level: riskLevel,
      rationale: notes.join(' ') || 'Insufficient data for a volatility read.',
    },
    confidenceMultiplier,
    rationale: notes.join(' '),
  };
}
