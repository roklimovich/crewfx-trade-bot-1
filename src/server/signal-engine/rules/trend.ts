import type { IndicatorSnapshot, RuleResult } from '../types';

/**
 * Trend: is price above/below its EMA(50), and does ADX confirm a real trend is underway
 * (vs. a directionless chop where +DI/-DI are tangled together)?
 */
export function analyzeTrend(closePrice: number, indicators: IndicatorSnapshot): RuleResult {
  if (indicators.ema === undefined) {
    return {
      name: 'trend',
      bias: 0,
      strength: 0,
      rationale: 'EMA(50) not yet available.',
      skipped: true,
    };
  }

  const priceVsEma = closePrice > indicators.ema ? 1 : closePrice < indicators.ema ? -1 : 0;
  const emaDistancePct = Math.abs((closePrice - indicators.ema) / indicators.ema) * 100;

  let strength = Math.min(1, emaDistancePct / 0.5); // saturates at a 0.5% distance from EMA
  let adxNote = '';

  if (indicators.adx) {
    const { adx, plusDi, minusDi } = indicators.adx;
    const adxDirection = plusDi > minusDi ? 1 : plusDi < minusDi ? -1 : 0;
    const trendIsStrong = adx > 25;

    if (trendIsStrong && adxDirection === priceVsEma) {
      strength = Math.min(1, strength + 0.3); // ADX confirms — boost confidence
      adxNote = ` ADX(${adx.toFixed(1)}) confirms trend strength.`;
    } else if (adx < 20) {
      strength *= 0.4; // ADX says this is a ranging market — heavily discount the EMA reading
      adxNote = ` ADX(${adx.toFixed(1)}) suggests a ranging market.`;
    } else if (trendIsStrong && adxDirection !== priceVsEma) {
      strength *= 0.5; // ADX is strong but pointing the other way — conflicting signal
      adxNote = ` ADX direction conflicts with price/EMA position.`;
    }
  }

  const direction = priceVsEma === 1 ? 'above' : priceVsEma === -1 ? 'below' : 'at';
  return {
    name: 'trend',
    bias: priceVsEma,
    strength,
    rationale: `Price is ${direction} EMA(50).${adxNote}`,
  };
}
