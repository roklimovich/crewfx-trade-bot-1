export interface OutcomeEvaluationInput {
  pair: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  closePriceAtExpiration: number;
}

export interface OutcomeEvaluationResult {
  outcome: 'WIN' | 'LOSS' | 'BREAK_EVEN';
  pnlPips: number;
}

/**
 * Methodology, stated plainly: this evaluates whether price moved in the predicted direction
 * by the time the signal expired, comparing entry price to the closing price of the candle at
 * (or nearest before) expiration. It is NOT a take-profit/stop-loss simulation — the Signal
 * model (Phase 2) never defined explicit TP/SL levels, so "did the market end up favorable by
 * expiration" is the most defensible outcome definition available from what's actually stored.
 * A more sophisticated engine with real TP/SL levels would check whether price touched those
 * levels *during* the window, not just where it ended up — a real difference, left as a known
 * simplification rather than pretending this does something it doesn't.
 */
export function evaluateOutcome(input: OutcomeEvaluationInput): OutcomeEvaluationResult {
  const priceDiff = input.closePriceAtExpiration - input.entryPrice;
  const pnlPips = calculatePnlPips(input.pair, input.direction === 'BUY' ? priceDiff : -priceDiff);

  // Anything closer than half a pip either way counts as a wash, not a coin-flip win/loss.
  const BREAK_EVEN_THRESHOLD_PIPS = 0.5;
  if (Math.abs(pnlPips) < BREAK_EVEN_THRESHOLD_PIPS) {
    return { outcome: 'BREAK_EVEN', pnlPips };
  }

  return { outcome: pnlPips > 0 ? 'WIN' : 'LOSS', pnlPips };
}

/**
 * Converts a raw price difference into pips. Standard Forex convention: JPY pairs quote to 2
 * decimal places (1 pip = 0.01), everything else to 4 (1 pip = 0.0001).
 *
 * Honesty note: "pips" isn't a standard unit for metals (XAU/USD) or most OTC instruments —
 * they're typically quoted in points or raw price. This still applies the generic 0.0001 divisor
 * to those pairs for a single consistent numeric field across all signals, but the resulting
 * number should be read as "scaled price movement," not a textbook pip count, for anything that
 * isn't a standard currency pair.
 */
function calculatePnlPips(pair: string, signedPriceDiff: number): number {
  const pipSize = pair.includes('JPY') ? 0.01 : 0.0001;
  return signedPriceDiff / pipSize;
}
