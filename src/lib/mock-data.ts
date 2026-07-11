/**
 * TEMPORARY mock data for the dashboard UI (Phase 5).
 *
 * Phase 7 (Market Data Service) and Phase 8 (Signal Engine) haven't been built yet,
 * so there's no real Signal/MarketData in the database to render. Everything below
 * is shaped to match the actual Prisma models so swapping this for real queries
 * later is a find-and-replace, not a rewrite:
 *
 *   mockSignals        → prisma.signal.findMany({ orderBy: { createdAt: 'desc' }, ... })
 *   mockStats           → derived from prisma.signalHistory (Phase 11)
 *   mockPerformanceSeries → derived from prisma.signalHistory grouped by day (Phase 11)
 */

export interface MockSignal {
  id: string;
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: string;
  confidenceScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: string;
  status: 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED';
  technicalSummary: string;
  createdAt: string;
}

export const mockSignals: MockSignal[] = [
  {
    id: 'sig_1',
    pair: 'EUR/USD',
    direction: 'BUY',
    entryPrice: '1.0842',
    confidenceScore: 87,
    riskLevel: 'MEDIUM',
    timeframe: 'M15',
    status: 'ACTIVE',
    technicalSummary:
      'RSI(14) crossed above 55; MACD histogram expanding; price holding above EMA(50).',
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'sig_2',
    pair: 'XAU/USD',
    direction: 'SELL',
    entryPrice: '2,384.10',
    confidenceScore: 74,
    riskLevel: 'HIGH',
    timeframe: 'H1',
    status: 'ACTIVE',
    technicalSummary: 'Rejected at resistance; ADX confirms trend strength; volatility elevated.',
    createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: 'sig_3',
    pair: 'GBP/JPY',
    direction: 'BUY',
    entryPrice: '198.442',
    confidenceScore: 91,
    riskLevel: 'LOW',
    timeframe: 'M5',
    status: 'WON',
    technicalSummary: 'Bollinger squeeze resolved upward; stochastic crossed from oversold.',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sig_4',
    pair: 'USD/JPY',
    direction: 'SELL',
    entryPrice: '156.201',
    confidenceScore: 68,
    riskLevel: 'MEDIUM',
    timeframe: 'H1',
    status: 'LOST',
    technicalSummary: 'CCI extreme reversal signal; ATR showed contracting range post-entry.',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'sig_5',
    pair: 'AUD/USD',
    direction: 'BUY',
    entryPrice: '0.6621',
    confidenceScore: 79,
    riskLevel: 'LOW',
    timeframe: 'M30',
    status: 'EXPIRED',
    technicalSummary:
      'Pivot support held with VWAP reclaim; confirmation window closed without a fill.',
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockStats = {
  activeSignals: mockSignals.filter((s) => s.status === 'ACTIVE').length,
  winRate30d: 68.4,
  totalSignalsToday: 12,
  avgConfidence: 81,
};

export const mockPerformanceSeries = [
  { day: 'Mon', winRate: 61 },
  { day: 'Tue', winRate: 65 },
  { day: 'Wed', winRate: 58 },
  { day: 'Thu', winRate: 72 },
  { day: 'Fri', winRate: 69 },
  { day: 'Sat', winRate: 74 },
  { day: 'Sun', winRate: 68 },
];

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export const mockNotifications: MockNotification[] = [
  {
    id: 'ntf_1',
    title: 'New signal: EUR/USD BUY',
    body: '87% confidence, M15 timeframe.',
    read: false,
    createdAt: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: 'ntf_2',
    title: 'Signal closed: GBP/JPY',
    body: 'Outcome: WIN.',
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'ntf_3',
    title: 'Pocket Option ID verified',
    body: 'Your submitted account was approved by an admin.',
    read: true,
    createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
  },
];
