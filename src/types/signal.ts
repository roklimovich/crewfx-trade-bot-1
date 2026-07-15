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
}

export interface PerformancePoint {
  label: string;
  winRate: number | null;
}
