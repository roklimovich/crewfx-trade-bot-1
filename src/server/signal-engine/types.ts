/**
 * A single rule's verdict. `bias` is the directional vote: +1 bullish, -1 bearish, 0 neutral
 * (either the rule found no edge, or didn't have enough data to say anything — see `skipped`).
 * `strength` scales how much this rule's vote counts in the aggregate score (0–1).
 */
export interface RuleResult {
  name: string;
  bias: -1 | 0 | 1;
  strength: number; // 0–1, how confident/strong this individual rule's reading is
  rationale: string; // one sentence, plain language — feeds the signal's technicalSummary
  skipped?: boolean; // true when the rule couldn't run (e.g. no volume data) — excluded from scoring
}

export interface RiskContribution {
  level: 'LOW' | 'MEDIUM' | 'HIGH';
  rationale: string;
}

/**
 * The latest value of each indicator for a pair/timeframe, as read back from the `Indicator`
 * table (see Phase 7). Mirrors the JSON shapes calculate-indicators.ts actually stores.
 * Any field can be missing — a fresh pair/timeframe combination may not have every indicator
 * calculated yet, and rules must degrade gracefully (skip, don't crash) when that happens.
 */
export interface IndicatorSnapshot {
  sma?: number;
  ema?: number;
  rsi?: number;
  macd?: { macd: number; signal: number; histogram: number };
  atr?: number;
  adx?: { adx: number; plusDi: number; minusDi: number };
  cci?: number;
  vwap?: number;
  bollinger?: { upper: number; middle: number; lower: number };
  stochastic?: { k: number; d: number };
  pivotPoints?: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
}
