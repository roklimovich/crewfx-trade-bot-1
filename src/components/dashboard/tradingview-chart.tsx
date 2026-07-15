'use client';

import { useEffect, useRef, useId } from 'react';
import { toTradingViewSymbol, toTradingViewInterval } from '@/lib/tradingview-symbols';

declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

/** Loads TradingView's tv.js once and reuses it for every widget instance on the page. */
function loadTradingViewScript(): Promise<void> {
  if (window.TradingView) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load TradingView script.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

interface TradingViewChartProps {
  /** Our internal pair format, e.g. "EUR/USD" — converted to TradingView's symbol format. */
  pair: string;
  /** Our Timeframe enum value, e.g. "M15". */
  timeframe: string;
  height?: number;
}

export function TradingViewChart({ pair, timeframe, height = 680 }: TradingViewChartProps) {
  const containerId = `tv-chart-${useId().replace(/:/g, '')}`;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    loadTradingViewScript().then(() => {
      if (cancelled || !window.TradingView || !containerRef.current) return;
      containerRef.current.innerHTML = ''; // clear before re-mounting on pair/timeframe change

      new window.TradingView.widget({
        autosize: true,
        symbol: toTradingViewSymbol(pair),
        interval: toTradingViewInterval(timeframe),
        timezone: 'Etc/UTC',
        theme: 'dark',
        style: '1',
        locale: 'en',
        toolbar_bg: 'rgba(0,0,0,0)',
        enable_publishing: false,
        hide_top_toolbar: false,
        save_image: false,
        studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
        backgroundColor: 'rgba(10, 8, 18, 1)',
        gridColor: 'rgba(255, 255, 255, 0.06)',
        container_id: containerId,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pair, timeframe, containerId]);

  return (
    <div className="glass-panel overflow-hidden p-2">
      <div id={containerId} ref={containerRef} style={{ height }} />
    </div>
  );
}
