import type { RiskLevel, Timeframe } from '@prisma/client';

/**
 * Short-expiry trade ideas are deliberately kept separate from the source-chart timeframe.
 * A high-volatility setup receives the shorter validity window; a low/medium-risk setup gets
 * time to develop. This produces practical 3-, 5-, and 10-minute signals without pretending
 * that a provider's M1 candle is an independently sourced M3/M10 candle.
 */
const EXPIRATION_MINUTES: Record<Timeframe, Record<RiskLevel, number>> = {
  M1: { LOW: 3, MEDIUM: 3, HIGH: 3 },
  M5: { LOW: 10, MEDIUM: 5, HIGH: 5 },
  M15: { LOW: 15, MEDIUM: 10, HIGH: 10 },
  M30: { LOW: 30, MEDIUM: 15, HIGH: 15 },
  H1: { LOW: 60, MEDIUM: 30, HIGH: 30 },
  H4: { LOW: 240, MEDIUM: 120, HIGH: 120 },
  D1: { LOW: 1440, MEDIUM: 720, HIGH: 720 },
};

export function calculateExpiration(
  timeframe: Timeframe,
  riskLevel: RiskLevel = 'MEDIUM',
  from: Date = new Date(),
): Date {
  const minutes = EXPIRATION_MINUTES[timeframe]?.[riskLevel] ?? 10;
  return new Date(from.getTime() + minutes * 60 * 1000);
}
