import { TwelveDataProvider } from './twelve-data';
import type { MarketDataProvider } from './types';

export type { MarketDataProvider } from './types';

let cachedProvider: MarketDataProvider | null = null;

/**
 * Returns the configured market-data provider. To switch providers (e.g. to Alpha Vantage or
 * Polygon.io), implement MarketDataProvider in a new file under this directory and swap the
 * instantiation below — nothing in ingest.ts or the indicator math needs to change.
 */
export function getMarketDataProvider(): MarketDataProvider {
  if (cachedProvider) return cachedProvider;

  const apiKey = process.env.MARKET_DATA_API_KEY;
  if (!apiKey) throw new Error('MARKET_DATA_API_KEY is not set.');

  const baseUrl = process.env.MARKET_DATA_BASE_URL || undefined;
  cachedProvider = new TwelveDataProvider(apiKey, baseUrl);
  return cachedProvider;
}
