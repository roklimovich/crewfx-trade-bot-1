import { Radar, Trophy, Activity, Gauge } from 'lucide-react';
import { StatCard } from '@/components/dashboard/stat-card';
import { SignalFeed } from '@/components/dashboard/signal-feed';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { mockSignals, mockStats, mockPerformanceSeries } from '@/lib/mock-data';

export const metadata = { title: 'Dashboard' };

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-medium">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&rsquo;s what the engine is seeing right now.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Active signals" value={String(mockStats.activeSignals)} icon={Radar} />
        <StatCard
          label="Win rate (30d)"
          value={`${mockStats.winRate30d}%`}
          icon={Trophy}
          tone="success"
        />
        <StatCard
          label="Signals today"
          value={String(mockStats.totalSignalsToday)}
          icon={Activity}
        />
        <StatCard
          label="Avg. confidence"
          value={`${mockStats.avgConfidence}%`}
          icon={Gauge}
          tone="accent"
        />
      </div>

      <PerformanceChart data={mockPerformanceSeries} />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">Recent signals</h2>
          <a href="/dashboard/signals" className="text-sm text-primary hover:underline">
            View all
          </a>
        </div>
        <SignalFeed signals={mockSignals} limit={4} />
      </div>
    </div>
  );
}
