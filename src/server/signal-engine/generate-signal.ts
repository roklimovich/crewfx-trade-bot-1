import type { Timeframe } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import { logEvent } from '@/server/security/audit-log';
import { CANDLE_LOOKBACK } from '../market-data/pairs';
import { at } from '../market-data/indicators/safe-index';
import type { Candle } from '../market-data/types';
import {
  analyzeTrend,
  analyzeMomentum,
  analyzeVolatility,
  analyzeMarketStructure,
  analyzeSupportResistance,
  analyzeLiquidity,
} from './rules';
import { combineSignalRules } from './scoring';
import { buildIndicatorSnapshot } from './build-snapshot';
import { calculateExpiration } from './expiration';
import { analyzeSignal } from '../ai/analyze-signal';
import { dispatchSignalNotifications } from '../notifications/dispatch';

export const ENGINE_VERSION = 'rule-engine-v1';
const DEFAULT_MIN_CONFIDENCE = 65; // matches the seeded Setting; overridden by DB value when present

export interface GenerateSignalResult {
  pair: string;
  timeframe: Timeframe;
  generated: boolean;
  reason?: string; // why nothing was generated, when generated is false
  signalId?: string;
}

async function getMinConfidenceScore(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: 'signal.min_confidence_score' },
  });
  if (setting && typeof setting.value === 'number') return setting.value;
  return DEFAULT_MIN_CONFIDENCE;
}

/** Generates (at most) one signal for a single pair/timeframe from whatever is currently in the DB. */
export async function generateSignalForPairTimeframe(
  pair: string,
  timeframe: Timeframe,
): Promise<GenerateSignalResult> {
  // Don't stack a new signal on top of one that's still active for the same pair/timeframe.
  const existingActive = await prisma.signal.findFirst({
    where: { pair, timeframe, status: 'ACTIVE', expirationTime: { gt: new Date() } },
  });
  if (existingActive) {
    return {
      pair,
      timeframe,
      generated: false,
      reason: 'An active signal already exists for this pair/timeframe.',
    };
  }

  const candleRows = await prisma.marketData.findMany({
    where: { pair, timeframe },
    orderBy: { timestamp: 'asc' },
    take: CANDLE_LOOKBACK,
  });
  if (candleRows.length < 20) {
    return { pair, timeframe, generated: false, reason: 'Not enough candle history yet.' };
  }
  const candles: Candle[] = candleRows.map((c) => ({
    timestamp: c.timestamp,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
    volume: c.volume,
  }));
  const latestCandle = at(candles, candles.length - 1);
  const closePrice = latestCandle.close;

  const indicatorRows = await prisma.indicator.findMany({
    where: { pair, timeframe },
    distinct: ['type'],
  });
  const snapshot = buildIndicatorSnapshot(indicatorRows);

  const directionalRules = [
    analyzeTrend(closePrice, snapshot),
    analyzeMomentum(snapshot),
    analyzeMarketStructure(candles),
    analyzeSupportResistance(closePrice, snapshot),
    analyzeLiquidity(candles),
  ];
  const volatility = analyzeVolatility(closePrice, snapshot);
  const minConfidenceScore = await getMinConfidenceScore();

  const decision = combineSignalRules(directionalRules, volatility, minConfidenceScore);
  if (!decision) {
    return {
      pair,
      timeframe,
      generated: false,
      reason: 'Low confidence or ranging market — no signal fired.',
    };
  }

  const matchingIndicatorIds = indicatorRows
    .filter((row) =>
      decision.contributingRuleNames.some((name) => ruleUsesIndicatorType(name, row.type)),
    )
    .map((row) => ({ id: row.id }));

  const signal = await prisma.signal.create({
    data: {
      pair,
      direction: decision.direction,
      entryPrice: closePrice,
      confidenceScore: decision.confidenceScore,
      expirationTime: calculateExpiration(timeframe),
      technicalSummary: decision.technicalSummary,
      riskLevel: decision.riskLevel,
      timeframe,
      status: 'ACTIVE',
      engineVersion: ENGINE_VERSION,
      indicatorsUsed: { connect: matchingIndicatorIds },
      history: { create: { outcome: 'PENDING' } },
    },
  });

  await logEvent(
    'INFO',
    `Signal generated: ${pair} ${decision.direction} (${decision.confidenceScore}%)`,
    {
      context: { pair, timeframe, signalId: signal.id },
    },
  );

  // AI analysis (Phase 9) supports the signal with an explanation — it never gates the signal
  // itself, which is already committed above and fully valid without it. We still AWAIT it
  // (rather than fire-and-forget) because on serverless platforms a function can be frozen the
  // moment its response is sent, killing any detached async work still in flight. analyzeSignal()
  // catches its own errors internally and always resolves, never throws.
  await analyzeSignal(signal.id).catch(() => {});

  // Notifications (Phase 10) go out last, after the signal has its AI explanation attached —
  // so the email/Telegram/push content can prefer the AI summary when it's available. Also
  // awaited for the same serverless-freeze reason as analyzeSignal() above.
  await dispatchSignalNotifications(signal.id).catch(() => {});

  return { pair, timeframe, generated: true, signalId: signal.id };
}

/** Loose mapping from a rule name to which indicator types it draws on, for the Signal↔Indicator relation. */
function ruleUsesIndicatorType(ruleName: string, indicatorType: string): boolean {
  const map: Record<string, string[]> = {
    trend: ['EMA', 'ADX'],
    momentum: ['RSI', 'MACD', 'STOCHASTIC'],
    market_structure: [], // derived from raw candles, not a stored Indicator row
    support_resistance: ['PIVOT_POINTS'],
    liquidity: [], // derived from raw candle volume, not a stored Indicator row
  };
  return (map[ruleName] ?? []).includes(indicatorType);
}
