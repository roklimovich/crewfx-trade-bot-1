import type { Candle } from '../../market-data/types';
import { at } from '../../market-data/indicators/safe-index';
import type { RuleResult } from '../types';

/**
 * Liquidity, in practice: is current volume meaningfully above/below its recent average?
 *
 * Honesty note: spot Forex generally has no centralized volume (it's an OTC market), and most
 * data providers — including Twelve Data for FX pairs — report 0 or a synthetic tick-count
 * proxy rather than real traded volume. Rather than pretend a liquidity read exists when the
 * underlying data doesn't support one, this rule checks whether the recent candles actually
 * have non-zero volume and skips itself (bias 0, skipped: true) if they don't. On symbols where
 * a data provider does supply real volume (some OTC/CFD instruments), the check runs for real.
 */
export function analyzeLiquidity(candles: Candle[]): RuleResult {
  const windowSize = 20;
  if (candles.length < windowSize) {
    return {
      name: 'liquidity',
      bias: 0,
      strength: 0,
      rationale: 'Not enough history yet.',
      skipped: true,
    };
  }

  const window = candles.slice(-windowSize);
  const hasRealVolume = window.some((c) => c.volume > 0);

  if (!hasRealVolume) {
    return {
      name: 'liquidity',
      bias: 0,
      strength: 0,
      rationale:
        'No real volume data for this instrument (typical for spot Forex) — liquidity check skipped.',
      skipped: true,
    };
  }

  const latest = at(window, window.length - 1);
  const priorAvg = window.slice(0, -1).reduce((sum, c) => sum + c.volume, 0) / (window.length - 1);
  if (priorAvg === 0) {
    return {
      name: 'liquidity',
      bias: 0,
      strength: 0,
      rationale: 'Insufficient volume history.',
      skipped: true,
    };
  }

  const ratio = latest.volume / priorAvg;
  if (ratio > 1.5) {
    return {
      name: 'liquidity',
      bias: 0,
      strength: 0.3,
      rationale: `Volume is ${ratio.toFixed(1)}x the recent average — increased participation, no directional lean on its own.`,
    };
  }

  return {
    name: 'liquidity',
    bias: 0,
    strength: 0.1,
    rationale: 'Volume is within its normal recent range.',
  };
}
