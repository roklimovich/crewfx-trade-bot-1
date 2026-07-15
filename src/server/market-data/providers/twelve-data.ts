import type { Timeframe } from '@prisma/client';
import type { Candle } from '../types';
import type { MarketDataProvider } from './types';

const TIMEFRAME_TO_INTERVAL: Record<Timeframe, string> = {
  M1: '1min',
  M5: '5min',
  M15: '15min',
  M30: '30min',
  H1: '1h',
  H4: '4h',
  D1: '1day',
};

interface TwelveDataCandle {
  datetime: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume?: string;
}

interface TwelveDataResponse {
  status: 'ok' | 'error';
  message?: string;
  values?: TwelveDataCandle[];
}

/**
 * Twelve Data (https://twelvedata.com) — chosen as the default provider for its free-tier
 * coverage of both Forex and common OTC-traded instruments. Swappable: implement
 * MarketDataProvider for any other licensed API and swap the export in ./index.ts.
 */
export class TwelveDataProvider implements MarketDataProvider {
  readonly name = 'twelve-data';

  constructor(
    private readonly apiKey: string,
    private readonly baseUrl: string = 'https://api.twelvedata.com',
  ) {}

  async fetchCandles(pair: string, timeframe: Timeframe, limit: number): Promise<Candle[]> {
    const interval = TIMEFRAME_TO_INTERVAL[timeframe] ?? '15min';
    const url = new URL('/time_series', this.baseUrl);
    url.searchParams.set('symbol', pair);
    url.searchParams.set('interval', interval);
    url.searchParams.set('outputsize', String(limit));
    url.searchParams.set('apikey', this.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new Error(`Twelve Data request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as TwelveDataResponse;
    if (data.status === 'error') {
      throw new Error(
        `Twelve Data error for ${pair} ${interval}: ${data.message ?? 'unknown error'}`,
      );
    }
    if (!data.values) return [];

    // Twelve Data returns newest-first; MarketData/indicator math expects oldest-first.
    return data.values
      .map(
        (v): Candle => ({
          timestamp: new Date(v.datetime),
          open: Number(v.open),
          high: Number(v.high),
          low: Number(v.low),
          close: Number(v.close),
          volume: Number(v.volume ?? 0),
        }),
      )
      .reverse();
  }
}
