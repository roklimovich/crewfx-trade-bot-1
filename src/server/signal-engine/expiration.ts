import type { Timeframe } from '@prisma/client';

/** How long a signal stays valid after generation, per timeframe — roughly 2x the candle duration. */
const EXPIRATION_MINUTES: Record<Timeframe, number> = {
  M1: 2,
  M5: 10,
  M15: 30,
  M30: 60,
  H1: 120,
  H4: 480,
  D1: 1440,
};

export function calculateExpiration(timeframe: Timeframe, from: Date = new Date()): Date {
  const minutes = EXPIRATION_MINUTES[timeframe] ?? 30;
  return new Date(from.getTime() + minutes * 60 * 1000);
}
