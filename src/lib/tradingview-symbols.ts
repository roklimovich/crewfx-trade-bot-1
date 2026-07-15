/**
 * TradingView symbols need a market prefix and no slash. Metals/commodities use a different
 * prefix than currency pairs, so a couple of common ones are special-cased; anything else
 * defaults to the FX: prefix, which covers standard currency pairs.
 */
const SPECIAL_CASES: Record<string, string> = {
  'XAU/USD': 'OANDA:XAUUSD',
  'XAG/USD': 'OANDA:XAGUSD',
};

export function toTradingViewSymbol(pair: string): string {
  if (SPECIAL_CASES[pair]) return SPECIAL_CASES[pair];
  return `FX:${pair.replace('/', '')}`;
}

/** Our Timeframe enum → TradingView's interval strings ("15", "60", "D", etc.). */
export function toTradingViewInterval(timeframe: string): string {
  const map: Record<string, string> = {
    M1: '1',
    M5: '5',
    M15: '15',
    M30: '30',
    H1: '60',
    H4: '240',
    D1: 'D',
  };
  return map[timeframe] ?? '15';
}
