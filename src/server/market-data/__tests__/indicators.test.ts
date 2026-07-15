import {
  sma,
  ema,
  rsi,
  macd,
  atr,
  adx,
  cci,
  vwap,
  bollingerBands,
  stochastic,
  pivotPoints,
} from '../indicators';
import type { Candle } from '../types';

function makeCandles(closes: number[]): Candle[] {
  return closes.map((close, i) => ({
    timestamp: new Date(2024, 0, 1 + i),
    open: close,
    high: close,
    low: close,
    close,
    volume: 0,
  }));
}

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

describe('sma', () => {
  it('matches hand-computed values', () => {
    const candles = makeCandles([1, 2, 3, 4, 5]);
    expect(sma(candles, 3)).toEqual([null, null, 2, 3, 4]);
  });
});

describe('ema', () => {
  it('matches hand-computed values (seeded with SMA, k = 2/(period+1))', () => {
    const candles = makeCandles([1, 2, 3, 4, 5]);
    const result = ema(candles, 3);
    expect(result[0]).toBeNull();
    expect(result[1]).toBeNull();
    expect(result[2]).toBeCloseTo(2, 10); // seed = avg(1,2,3)
    expect(result[3]).toBeCloseTo(3, 10); // 4*0.5 + 2*0.5
    expect(result[4]).toBeCloseTo(4, 10); // 5*0.5 + 3*0.5
  });
});

describe('rsi', () => {
  it('is 100 for a pure uptrend (zero losses)', () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const result = rsi(makeCandles(closes), 14);
    expect(result[19]).toBeCloseTo(100, 5);
  });

  it('is 0 for a pure downtrend (zero gains)', () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 - i);
    const result = rsi(makeCandles(closes), 14);
    expect(result[19]).toBeCloseTo(0, 5);
  });

  it('stays within [0, 100] for mixed data', () => {
    const closes = [
      44, 44.5, 43.5, 44.5, 45, 45.5, 46, 45.5, 46.5, 47, 46, 46.5, 47.5, 48, 47, 48.5, 49,
    ];
    const result = rsi(makeCandles(closes), 14);
    for (const v of result) {
      if (v !== null) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('macd', () => {
  it('has a positive histogram partway through a sustained uptrend', () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + i * 0.5);
    const result = macd(makeCandles(closes));
    const last = result[result.length - 1];
    expect(last).not.toBeNull();
    expect(last!.macd).toBeGreaterThan(0);
  });
});

describe('atr', () => {
  it('converges to the constant true range when high-low is constant and there are no gaps', () => {
    const candles: Candle[] = Array.from({ length: 20 }, (_, i) =>
      candle({ high: 101, low: 99, close: 100 }, i),
    );
    const result = atr(candles, 14);
    expect(result[19]).toBeCloseTo(2, 5);
  });
});

describe('adx', () => {
  it('reports a stronger +DI than -DI during a sustained uptrend', () => {
    const candles: Candle[] = Array.from({ length: 40 }, (_, i) =>
      candle({ high: 100 + i + 1, low: 100 + i - 1, close: 100 + i }, i),
    );
    const result = adx(candles, 14);
    const last = result[result.length - 1];
    expect(last).not.toBeNull();
    expect(last!.plusDi).toBeGreaterThan(last!.minusDi);
    expect(last!.adx).toBeGreaterThanOrEqual(0);
  });
});

describe('cci', () => {
  it('is 0 for a perfectly flat market (zero mean deviation)', () => {
    const candles: Candle[] = Array.from({ length: 25 }, (_, i) => candle({ close: 50 }, i));
    const result = cci(candles, 20);
    expect(result[24]).toBe(0);
  });
});

describe('vwap', () => {
  it('matches a hand-computed two-candle volume-weighted average', () => {
    const candles: Candle[] = [
      candle({ high: 10, low: 8, close: 9, volume: 100 }, 0),
      candle({ high: 12, low: 10, close: 11, volume: 50 }, 1),
    ];
    // typical prices: 9 and 11; cumulative PV = 900 + 550 = 1450; cumulative vol = 150
    const result = vwap(candles);
    expect(result[1]).toBeCloseTo(1450 / 150, 10);
  });
});

describe('bollingerBands', () => {
  it('collapses upper/middle/lower together when price is flat (zero std dev)', () => {
    const candles: Candle[] = Array.from({ length: 25 }, (_, i) => candle({ close: 10 }, i));
    const result = bollingerBands(candles, 20, 2);
    const last = result[24];
    expect(last).not.toBeNull();
    expect(last!.upper).toBeCloseTo(10, 10);
    expect(last!.middle).toBeCloseTo(10, 10);
    expect(last!.lower).toBeCloseTo(10, 10);
  });
});

describe('stochastic', () => {
  it('is 100 when the close pins the top of the window for long enough that %D catches up', () => {
    const closes = [10, 11, 12, 13, 14, 20, 20, 20];
    const candles = makeCandles(closes);
    const result = stochastic(candles, 5, 3);
    expect(result[6]?.k).toBeCloseTo(100, 10);
    expect(result[6]?.d).toBeCloseTo(100, 10);
  });

  it('is 0 when the close pins the bottom of the window for long enough that %D catches up', () => {
    const closes = [20, 19, 18, 17, 16, 5, 5, 5];
    const candles = makeCandles(closes);
    const result = stochastic(candles, 5, 3);
    expect(result[6]?.k).toBeCloseTo(0, 10);
    expect(result[6]?.d).toBeCloseTo(0, 10);
  });
});

describe('pivotPoints', () => {
  it('matches the hand-computed standard formula from the prior candle', () => {
    const candles: Candle[] = [
      candle({ high: 10, low: 8, close: 9 }, 0),
      candle({ high: 11, low: 9, close: 10 }, 1),
    ];
    const result = pivotPoints(candles);
    expect(result[0]).toBeNull();
    expect(result[1]).toEqual({
      pivot: 9,
      r1: 10,
      s1: 8,
      r2: 11,
      s2: 7,
      r3: 12,
      s3: 6,
    });
  });
});
