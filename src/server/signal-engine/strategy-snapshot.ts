import type { Candle } from '../market-data/types';
import type { SignalDecision } from './scoring';
import type { IndicatorSnapshot, RuleResult } from './types';

export type StrategyZoneKind =
  | 'SUPPORT'
  | 'RESISTANCE'
  | 'LIQUIDITY'
  | 'ORDER_BLOCK'
  | 'IMBALANCE'
  | 'TRENDLINE';

export interface StrategyZone {
  kind: StrategyZoneKind;
  label: string;
  low: number;
  high: number;
  used: boolean;
  points?: Array<{ timestamp: string; price: number }>;
}

export interface StrategySnapshot {
  version: 'zones-v1';
  entryPrice: number;
  zones: StrategyZone[];
  reasons: string[];
  indicators: { ema?: number; rsi?: number; atr?: number };
}

/** Captures the concrete areas and rule evidence used when an actionable setup is found. */
export function buildStrategySnapshot(
  entryPrice: number,
  candles: Candle[],
  indicators: IndicatorSnapshot,
  decision: SignalDecision,
  rules: RuleResult[],
): StrategySnapshot {
  const halfWidth = Math.max(indicators.atr ? indicators.atr * 0.25 : 0, entryPrice * 0.00015);
  const zone = (
    kind: StrategyZoneKind,
    label: string,
    price: number,
    used: boolean,
  ): StrategyZone => ({
    kind,
    label,
    low: Number((price - halfWidth).toFixed(6)),
    high: Number((price + halfWidth).toFixed(6)),
    used,
  });
  const zones: StrategyZone[] = [];

  if (indicators.pivotPoints) {
    const supportResistanceUsed = decision.contributingRuleNames.includes('support_resistance');
    zones.push(
      zone('SUPPORT', 'Pivot support (S1)', indicators.pivotPoints.s1, supportResistanceUsed),
    );
    zones.push(
      zone('RESISTANCE', 'Pivot resistance (R1)', indicators.pivotPoints.r1, supportResistanceUsed),
    );
  }

  const recent = candles.slice(-20);
  if (recent.length > 0) {
    // These swing extremes come from the exact window read by the market-structure rule.
    const structureUsed = decision.contributingRuleNames.includes('market_structure');
    zones.push(
      zone(
        'LIQUIDITY',
        'Recent swing-high liquidity',
        Math.max(...recent.map((c) => c.high)),
        structureUsed,
      ),
    );
    zones.push(
      zone(
        'LIQUIDITY',
        'Recent swing-low liquidity',
        Math.min(...recent.map((c) => c.low)),
        structureUsed,
      ),
    );
  }

  const imbalance = findLatestImbalance(recent);
  if (imbalance)
    zones.push({ ...imbalance, used: decision.contributingRuleNames.includes('market_structure') });

  const orderBlock = findOrderBlock(recent, decision.direction);
  if (orderBlock)
    zones.push({
      ...orderBlock,
      used: decision.contributingRuleNames.includes('market_structure'),
    });

  const trendline = findTrendline(recent, decision.direction);
  if (trendline)
    zones.push({ ...trendline, used: decision.contributingRuleNames.includes('market_structure') });

  return {
    version: 'zones-v1',
    entryPrice,
    zones,
    indicators: { ema: indicators.ema, rsi: indicators.rsi, atr: indicators.atr },
    reasons: rules
      .filter((rule) => !rule.skipped && decision.contributingRuleNames.includes(rule.name))
      .map((rule) => rule.rationale),
  };
}

function findLatestImbalance(candles: Candle[]): StrategyZone | null {
  // A three-candle fair-value gap: candle 1 and 3 do not overlap. We retain the most recent
  // one only; older gaps are chart context, not evidence for a new short-expiry signal.
  for (let i = candles.length - 3; i >= 0; i--) {
    const first = candles[i]!;
    const third = candles[i + 2]!;
    if (first.high < third.low) {
      return {
        kind: 'IMBALANCE',
        label: 'Bullish imbalance (FVG)',
        low: first.high,
        high: third.low,
        used: false,
      };
    }
    if (first.low > third.high) {
      return {
        kind: 'IMBALANCE',
        label: 'Bearish imbalance (FVG)',
        low: third.high,
        high: first.low,
        used: false,
      };
    }
  }
  return null;
}

function findOrderBlock(candles: Candle[], direction: 'BUY' | 'SELL'): StrategyZone | null {
  // Last opposite-colour candle before a two-candle directional displacement.
  for (let i = candles.length - 3; i >= 0; i--) {
    const candle = candles[i]!;
    const next = candles[i + 1]!;
    const after = candles[i + 2]!;
    const bullishMove = next.close > next.open && after.close > after.open;
    const bearishMove = next.close < next.open && after.close < after.open;
    if (direction === 'BUY' && candle.close < candle.open && bullishMove) {
      return {
        kind: 'ORDER_BLOCK',
        label: 'Bullish order block',
        low: candle.low,
        high: candle.high,
        used: false,
      };
    }
    if (direction === 'SELL' && candle.close > candle.open && bearishMove) {
      return {
        kind: 'ORDER_BLOCK',
        label: 'Bearish order block',
        low: candle.low,
        high: candle.high,
        used: false,
      };
    }
  }
  return null;
}

function findTrendline(candles: Candle[], direction: 'BUY' | 'SELL'): StrategyZone | null {
  const swings = candles.filter((candle, index) => {
    if (index === 0 || index === candles.length - 1) return false;
    const before = candles[index - 1]!;
    const after = candles[index + 1]!;
    return direction === 'BUY'
      ? candle.low <= before.low && candle.low <= after.low
      : candle.high >= before.high && candle.high >= after.high;
  });
  const points = swings.slice(-2);
  if (points.length !== 2) return null;
  const prices = points.map((point) => (direction === 'BUY' ? point.low : point.high));
  return {
    kind: 'TRENDLINE',
    label: direction === 'BUY' ? 'Support trendline' : 'Resistance trendline',
    low: Math.min(...prices),
    high: Math.max(...prices),
    used: false,
    points: points.map((point, index) => ({
      timestamp: point.timestamp.toISOString(),
      price: prices[index]!,
    })),
  };
}
