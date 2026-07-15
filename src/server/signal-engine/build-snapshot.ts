import type { Indicator as IndicatorRow } from '@prisma/client';
import type { IndicatorSnapshot } from './types';

/** Maps each Indicator row's JSON `value` into the typed field the rules expect. */
export function buildIndicatorSnapshot(rows: IndicatorRow[]): IndicatorSnapshot {
  const snapshot: IndicatorSnapshot = {};

  for (const row of rows) {
    const value = row.value as unknown;
    switch (row.type) {
      case 'SMA':
        snapshot.sma = value as number;
        break;
      case 'EMA':
        snapshot.ema = value as number;
        break;
      case 'RSI':
        snapshot.rsi = value as number;
        break;
      case 'MACD':
        snapshot.macd = value as IndicatorSnapshot['macd'];
        break;
      case 'ATR':
        snapshot.atr = value as number;
        break;
      case 'ADX':
        snapshot.adx = value as IndicatorSnapshot['adx'];
        break;
      case 'CCI':
        snapshot.cci = value as number;
        break;
      case 'VWAP':
        snapshot.vwap = value as number;
        break;
      case 'BOLLINGER_BANDS':
        snapshot.bollinger = value as IndicatorSnapshot['bollinger'];
        break;
      case 'STOCHASTIC':
        snapshot.stochastic = value as IndicatorSnapshot['stochastic'];
        break;
      case 'PIVOT_POINTS':
        snapshot.pivotPoints = value as IndicatorSnapshot['pivotPoints'];
        break;
    }
  }

  return snapshot;
}
