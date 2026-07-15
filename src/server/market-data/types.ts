/** A single OHLCV candle. Matches the shape of MarketData rows (minus DB-only fields). */
export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
