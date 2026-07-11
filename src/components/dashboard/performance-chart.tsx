'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { mockPerformanceSeries } from '@/lib/mock-data';

export function PerformanceChart({ data }: { data: typeof mockPerformanceSeries }) {
  return (
    <div className="glass-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-medium">Win rate, last 7 days</h3>
        <span className="text-xs text-muted-foreground">
          Mock data — Phase 11 wires this to real outcomes
        </span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="winRateFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(248 100% 71%)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="hsl(248 100% 71%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="rgba(255,255,255,0.4)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="rgba(255,255,255,0.4)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            domain={[40, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              background: 'hsl(260 35% 9%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number) => [`${value}%`, 'Win rate']}
          />
          <Area
            type="monotone"
            dataKey="winRate"
            stroke="hsl(248 100% 71%)"
            strokeWidth={2}
            fill="url(#winRateFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
