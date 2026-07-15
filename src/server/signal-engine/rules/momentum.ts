import type { IndicatorSnapshot, RuleResult } from '../types';

/** Momentum: RSI position, MACD histogram sign, and Stochastic %K/%D crossover. */
export function analyzeMomentum(indicators: IndicatorSnapshot): RuleResult {
  const votes: { bias: -1 | 0 | 1; weight: number }[] = [];
  const notes: string[] = [];

  if (indicators.rsi !== undefined) {
    const rsi = indicators.rsi;
    if (rsi > 55) {
      votes.push({ bias: 1, weight: Math.min(1, (rsi - 55) / 20) });
      notes.push(`RSI(${rsi.toFixed(1)}) is bullish.`);
    } else if (rsi < 45) {
      votes.push({ bias: -1, weight: Math.min(1, (45 - rsi) / 20) });
      notes.push(`RSI(${rsi.toFixed(1)}) is bearish.`);
    } else {
      votes.push({ bias: 0, weight: 0.3 });
      notes.push(`RSI(${rsi.toFixed(1)}) is neutral.`);
    }
  }

  if (indicators.macd) {
    const { histogram } = indicators.macd;
    const bias = histogram > 0 ? 1 : histogram < 0 ? -1 : 0;
    votes.push({ bias, weight: Math.min(1, Math.abs(histogram) * 8) });
    notes.push(
      `MACD histogram is ${histogram > 0 ? 'positive' : histogram < 0 ? 'negative' : 'flat'}.`,
    );
  }

  if (indicators.stochastic) {
    const { k, d } = indicators.stochastic;
    if (k > 80) {
      votes.push({ bias: -1, weight: 0.4 }); // overbought — leans toward a pullback
      notes.push(`Stochastic(${k.toFixed(0)}) is overbought.`);
    } else if (k < 20) {
      votes.push({ bias: 1, weight: 0.4 }); // oversold — leans toward a bounce
      notes.push(`Stochastic(${k.toFixed(0)}) is oversold.`);
    } else {
      const bias = k > d ? 1 : k < d ? -1 : 0;
      votes.push({ bias, weight: 0.3 });
      notes.push(`Stochastic %K is ${k > d ? 'above' : k < d ? 'below' : 'at'} %D.`);
    }
  }

  if (votes.length === 0) {
    return {
      name: 'momentum',
      bias: 0,
      strength: 0,
      rationale: 'No momentum indicators available yet.',
      skipped: true,
    };
  }

  const weightedSum = votes.reduce((sum, v) => sum + v.bias * v.weight, 0);
  const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0) || 1;
  const net = weightedSum / totalWeight;
  const bias = net > 0.15 ? 1 : net < -0.15 ? -1 : 0;

  return {
    name: 'momentum',
    bias,
    strength: Math.min(1, Math.abs(net)),
    rationale: notes.join(' '),
  };
}
