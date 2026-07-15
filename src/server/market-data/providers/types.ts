import type { Candle } from '../types';
import type { Timeframe } from '@prisma/client';

export interface MarketDataProvider {
  /** Human-readable name, used in logs. */
  readonly name: string;
  /** Fetches the most recent `limit` candles for a pair/timeframe, oldest first. */
  fetchCandles(pair: string, timeframe: Timeframe, limit: number): Promise<Candle[]>;
}
