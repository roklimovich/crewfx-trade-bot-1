import { evaluateOutcome } from '../evaluate-outcome';

describe('evaluateOutcome', () => {
  it('is a WIN for a BUY when price closed higher than entry', () => {
    const result = evaluateOutcome({
      pair: 'EUR/USD',
      direction: 'BUY',
      entryPrice: 1.0842,
      closePriceAtExpiration: 1.0862, // +20 pips
    });
    expect(result.outcome).toBe('WIN');
    expect(result.pnlPips).toBeCloseTo(20, 1);
  });

  it('is a LOSS for a BUY when price closed lower than entry', () => {
    const result = evaluateOutcome({
      pair: 'EUR/USD',
      direction: 'BUY',
      entryPrice: 1.0842,
      closePriceAtExpiration: 1.0822, // -20 pips
    });
    expect(result.outcome).toBe('LOSS');
    expect(result.pnlPips).toBeCloseTo(-20, 1);
  });

  it('is a WIN for a SELL when price closed lower than entry (direction is inverted)', () => {
    const result = evaluateOutcome({
      pair: 'EUR/USD',
      direction: 'SELL',
      entryPrice: 1.0842,
      closePriceAtExpiration: 1.0822, // price dropped 20 pips — good for a SELL
    });
    expect(result.outcome).toBe('WIN');
    expect(result.pnlPips).toBeCloseTo(20, 1);
  });

  it('is a LOSS for a SELL when price closed higher than entry', () => {
    const result = evaluateOutcome({
      pair: 'EUR/USD',
      direction: 'SELL',
      entryPrice: 1.0842,
      closePriceAtExpiration: 1.0862,
    });
    expect(result.outcome).toBe('LOSS');
    expect(result.pnlPips).toBeCloseTo(-20, 1);
  });

  it('is BREAK_EVEN when price barely moved', () => {
    const result = evaluateOutcome({
      pair: 'EUR/USD',
      direction: 'BUY',
      entryPrice: 1.0842,
      closePriceAtExpiration: 1.08421, // ~0.1 pip
    });
    expect(result.outcome).toBe('BREAK_EVEN');
  });

  it('uses the 2-decimal pip convention for JPY pairs', () => {
    const result = evaluateOutcome({
      pair: 'USD/JPY',
      direction: 'BUY',
      entryPrice: 156.2,
      closePriceAtExpiration: 156.4, // +0.20 = 20 pips at JPY's 0.01 pip size
    });
    expect(result.pnlPips).toBeCloseTo(20, 1);
  });
});
