export type SignalFeedStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'WON' | 'LOST' | 'CANCELLED';

export interface SignalFeedItem {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number | string;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  status: SignalFeedStatus;
  technicalSummary: string;
  createdAt: string;
  expirationTime?: string;
  analysisSnapshot?: {
    version: 'zones-v1';
    entryPrice: number;
    zones: Array<{
      kind: 'SUPPORT' | 'RESISTANCE' | 'LIQUIDITY' | 'ORDER_BLOCK' | 'IMBALANCE' | 'TRENDLINE';
      label: string;
      low: number;
      high: number;
      used: boolean;
      points?: Array<{ timestamp: string; price: number }>;
    }>;
    reasons: string[];
    indicators: { ema?: number; rsi?: number; atr?: number };
  } | null;
  history?: {
    outcome: 'PENDING' | 'WIN' | 'LOSS' | 'BREAK_EVEN';
    closePrice: number | null;
    pnlPips: number | null;
  } | null;
  reportedLoss?: boolean;
}

export interface PerformancePoint {
  label: string;
  winRate: number | null;
}
