'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api-client';
import type { SignalFeedItem } from '@/types/signal';

type Candle = { timestamp: string; open: number; high: number; low: number; close: number };

const ZONE_COLORS: Record<string, string> = {
  SUPPORT: '#4ade80',
  RESISTANCE: '#f87171',
  LIQUIDITY: '#facc15',
  ORDER_BLOCK: '#a78bfa',
  IMBALANCE: '#fb923c',
  TRENDLINE: '#38bdf8',
};

export function SignalAnalysisChart({ signals }: { signals: SignalFeedItem[] }) {
  const signal =
    signals.find((item) => item.status === 'ACTIVE' && item.analysisSnapshot) ??
    signals.find((item) => item.analysisSnapshot);
  const [candles, setCandles] = useState<Candle[]>([]);

  useEffect(() => {
    if (!signal) return;
    apiFetch<{ candles: Candle[] }>(
      `/api/market-data/candles?pair=${encodeURIComponent(signal.pair)}&timeframe=${signal.timeframe}&limit=80`,
    )
      .then((response) => setCandles(response.candles))
      .catch(() => setCandles([]));
  }, [signal?.id, signal?.pair, signal?.timeframe]);

  const series = useMemo(() => candles.slice(-70), [candles]);
  if (!signal?.analysisSnapshot || series.length < 2) return null;

  const width = 960;
  const height = 460;
  const chartBottom = 345;
  const rsiTop = 375;
  const rsiBottom = 440;
  const zones = signal.analysisSnapshot.zones;
  const prices = [
    ...series.flatMap((candle) => [candle.low, candle.high]),
    ...zones.flatMap((zone) => [zone.low, zone.high]),
    Number(signal.entryPrice),
  ];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min || 1) * 0.08;
  const low = min - padding;
  const high = max + padding;
  const x = (index: number) => 45 + (index / (series.length - 1)) * 850;
  const y = (price: number) => 25 + ((high - price) / (high - low)) * (chartBottom - 25);
  const rsi = computeRsi(series.map((candle) => candle.close));
  const ema = computeEma(
    series.map((candle) => candle.close),
    20,
  );

  return (
    <section className="glass-panel overflow-hidden p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-medium">Signal analysis chart</h2>
          <p className="text-xs text-muted-foreground">
            {signal.pair} · {signal.timeframe} · zones captured when the signal fired
          </p>
        </div>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
          {signal.direction} · {signal.confidenceScore}%
        </span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full rounded-lg bg-background/60"
        role="img"
        aria-label="Annotated signal analysis chart"
      >
        {[0, 1, 2, 3, 4].map((line) => (
          <line
            key={line}
            x1="45"
            x2="895"
            y1={25 + line * 80}
            y2={25 + line * 80}
            stroke="rgba(255,255,255,.07)"
          />
        ))}
        {zones
          .filter((zone) => zone.kind !== 'TRENDLINE')
          .map((zone) => {
            const top = y(zone.high);
            const bottom = y(zone.low);
            const color = ZONE_COLORS[zone.kind];
            return (
              <g key={`${zone.label}-${zone.low}`}>
                <rect
                  x="45"
                  y={top}
                  width="850"
                  height={Math.max(2, bottom - top)}
                  fill={color}
                  opacity=".12"
                />
                <text x="52" y={Math.max(16, top - 3)} fill={color} fontSize="10">
                  {zone.label}
                  {zone.used ? ' • used' : ''}
                </text>
              </g>
            );
          })}
        {zones
          .filter((zone) => zone.kind === 'TRENDLINE' && zone.points?.length === 2)
          .map((zone) => {
            const points = zone.points!;
            const indexes = points.map((point) =>
              Math.max(
                0,
                series.findIndex((candle) => candle.timestamp === point.timestamp),
              ),
            );
            return (
              <g key={zone.label}>
                <line
                  x1={x(indexes[0]!)}
                  y1={y(points[0]!.price)}
                  x2={x(indexes[1]!)}
                  y2={y(points[1]!.price)}
                  stroke={ZONE_COLORS.TRENDLINE}
                  strokeWidth="2"
                />
                <text
                  x={x(indexes[1]!)}
                  y={y(points[1]!.price) - 6}
                  fill={ZONE_COLORS.TRENDLINE}
                  fontSize="10"
                >
                  {zone.label}
                </text>
              </g>
            );
          })}
        <polyline
          fill="none"
          stroke="#60a5fa"
          strokeWidth="1.5"
          points={ema.map((value, index) => `${x(index)},${y(value)}`).join(' ')}
        />
        {series.map((candle, index) => {
          const up = candle.close >= candle.open;
          const color = up ? '#4ade80' : '#f87171';
          return (
            <g key={candle.timestamp}>
              <line
                x1={x(index)}
                x2={x(index)}
                y1={y(candle.high)}
                y2={y(candle.low)}
                stroke={color}
              />
              <rect
                x={x(index) - 3}
                y={y(Math.max(candle.open, candle.close))}
                width="6"
                height={Math.max(1, Math.abs(y(candle.open) - y(candle.close)))}
                fill={color}
              />
            </g>
          );
        })}
        <line
          x1="45"
          x2="895"
          y1={y(Number(signal.entryPrice))}
          y2={y(Number(signal.entryPrice))}
          stroke="#e2e8f0"
          strokeDasharray="5 4"
        />
        <text x="760" y={y(Number(signal.entryPrice)) - 5} fill="#e2e8f0" fontSize="10">
          Entry {signal.entryPrice}
        </text>
        <line x1="45" x2="895" y1={rsiTop - 8} y2={rsiTop - 8} stroke="rgba(255,255,255,.12)" />
        <text x="45" y="365" fill="#94a3b8" fontSize="10">
          RSI 14
        </text>
        {[30, 70].map((level) => (
          <line
            key={level}
            x1="45"
            x2="895"
            y1={rsiBottom - (level / 100) * (rsiBottom - rsiTop)}
            y2={rsiBottom - (level / 100) * (rsiBottom - rsiTop)}
            stroke="rgba(250,204,21,.25)"
            strokeDasharray="3 3"
          />
        ))}
        <polyline
          fill="none"
          stroke="#a3e635"
          strokeWidth="1.5"
          points={rsi
            .map(
              (value, index) => `${x(index)},${rsiBottom - (value / 100) * (rsiBottom - rsiTop)}`,
            )
            .join(' ')}
        />
      </svg>
      <p className="mt-2 text-xs text-muted-foreground">
        Blue: EMA(20). Green: bullish candles / RSI. Red: bearish candles. Colored areas are
        detected structure—not guaranteed trade targets.
      </p>
    </section>
  );
}

function computeEma(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  return values.reduce<number[]>(
    (result, value, index) => [
      ...result,
      index === 0 ? value : value * multiplier + result[index - 1]! * (1 - multiplier),
    ],
    [],
  );
}
function computeRsi(values: number[], period = 14) {
  return values.map((value, index) => {
    if (index < period) return 50;
    const changes = values
      .slice(index - period + 1, index + 1)
      .map((item, i, all) => (i === 0 ? 0 : item - all[i - 1]!));
    const gain =
      changes.filter((change) => change > 0).reduce((sum, change) => sum + change, 0) / period;
    const loss =
      -changes.filter((change) => change < 0).reduce((sum, change) => sum + change, 0) / period;
    return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  });
}
