import { analyzeTrend } from '../rules/trend';
import { analyzeMomentum } from '../rules/momentum';
import { analyzeMarketStructure } from '../rules/market-structure';
import { analyzeSupportResistance } from '../rules/support-resistance';
import { analyzeLiquidity } from '../rules/liquidity';
import type { IndicatorSnapshot } from '../types';
import type { Candle } from '../../market-data/types';

function candle(partial: Partial<Candle> & { close: number }, dayOffset: number): Candle {
  return {
    timestamp: new Date(2024, 0, 1 + dayOffset),
    open: partial.open ?? partial.close,
    high: partial.high ?? partial.close,
    low: partial.low ?? partial.close,
    close: partial.close,
    volume: partial.volume ?? 0,
  };
}

describe('analyzeTrend', () => {
  it('is bullish when price is above EMA and ADX confirms', () => {
    const indicators: IndicatorSnapshot = { ema: 100, adx: { adx: 30, plusDi: 25, minusDi: 10 } };
    const result = analyzeTrend(102, indicators);
    expect(result.bias).toBe(1);
    expect(result.skipped).toBeFalsy();
  });

  it('is bearish when price is below EMA and ADX confirms', () => {
    const indicators: IndicatorSnapshot = { ema: 100, adx: { adx: 30, plusDi: 10, minusDi: 25 } };
    const result = analyzeTrend(98, indicators);
    expect(result.bias).toBe(-1);
  });

  it('skips when EMA is not available', () => {
    const result = analyzeTrend(100, {});
    expect(result.skipped).toBe(true);
  });
});

describe('analyzeMomentum', () => {
  it('is bullish when RSI, MACD, and Stochastic all agree', () => {
    const indicators: IndicatorSnapshot = {
      rsi: 65,
      macd: { macd: 0.002, signal: 0.001, histogram: 0.15 },
      stochastic: { k: 60, d: 50 },
    };
    const result = analyzeMomentum(indicators);
    expect(result.bias).toBe(1);
  });

  it('is bearish when RSI, MACD, and Stochastic all agree bearish', () => {
    const indicators: IndicatorSnapshot = {
      rsi: 35,
      macd: { macd: -0.002, signal: -0.001, histogram: -0.15 },
      stochastic: { k: 40, d: 50 },
    };
    const result = analyzeMomentum(indicators);
    expect(result.bias).toBe(-1);
  });

  it('skips when no momentum indicators are available', () => {
    const result = analyzeMomentum({});
    expect(result.skipped).toBe(true);
  });
});

describe('analyzeMarketStructure', () => {
  it('detects an uptrend structure (higher highs, higher lows)', () => {
    const candles: Candle[] = [
      ...Array.from({ length: 10 }, (_, i) => candle({ high: 105, low: 95, close: 100 }, i)),
      ...Array.from({ length: 10 }, (_, i) => candle({ high: 115, low: 105, close: 110 }, i + 10)),
    ];
    const result = analyzeMarketStructure(candles);
    expect(result.bias).toBe(1);
  });

  it('detects a downtrend structure (lower highs, lower lows)', () => {
    const candles: Candle[] = [
      ...Array.from({ length: 10 }, (_, i) => candle({ high: 115, low: 105, close: 110 }, i)),
      ...Array.from({ length: 10 }, (_, i) => candle({ high: 105, low: 95, close: 100 }, i + 10)),
    ];
    const result = analyzeMarketStructure(candles);
    expect(result.bias).toBe(-1);
  });

  it('skips when there are too few candles', () => {
    const candles = [candle({ close: 100 }, 0)];
    const result = analyzeMarketStructure(candles);
    expect(result.skipped).toBe(true);
  });
});

describe('analyzeSupportResistance', () => {
  it('is bullish when price sits on S1 support', () => {
    const indicators: IndicatorSnapshot = {
      pivotPoints: { pivot: 100, r1: 105, r2: 110, r3: 115, s1: 95, s2: 90, s3: 85 },
    };
    const result = analyzeSupportResistance(95.05, indicators);
    expect(result.bias).toBe(1);
  });

  it('is bearish when price sits on R1 resistance', () => {
    const indicators: IndicatorSnapshot = {
      pivotPoints: { pivot: 100, r1: 105, r2: 110, r3: 115, s1: 95, s2: 90, s3: 85 },
    };
    const result = analyzeSupportResistance(104.95, indicators);
    expect(result.bias).toBe(-1);
  });

  it('skips when pivot points are not available', () => {
    const result = analyzeSupportResistance(100, {});
    expect(result.skipped).toBe(true);
  });
});

describe('analyzeLiquidity', () => {
  it('skips when there is no real volume data (typical spot Forex case)', () => {
    const candles = Array.from({ length: 25 }, (_, i) => candle({ close: 100, volume: 0 }, i));
    const result = analyzeLiquidity(candles);
    expect(result.skipped).toBe(true);
  });

  it('does not skip when real volume data is present', () => {
    const candles = Array.from({ length: 25 }, (_, i) =>
      candle({ close: 100, volume: 1000 + i }, i),
    );
    const result = analyzeLiquidity(candles);
    expect(result.skipped).toBeFalsy();
  });
});
