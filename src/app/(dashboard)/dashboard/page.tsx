import { Suspense } from 'react';
import { StatsRow, StatsRowSkeleton } from '@/components/dashboard/stats-row';
import {
  RecentSignalsSection,
  RecentSignalsSkeleton,
} from '@/components/dashboard/recent-signals-section';
import { PerformanceChart } from '@/components/dashboard/performance-chart';
import { LiveChartSection } from '@/components/dashboard/live-chart-section';
import { PairBreakdownTable } from '@/components/dashboard/pair-breakdown-table';

export const metadata = { title: 'Dashboard' };

/**
 * The page shell itself does no data fetching — StatsRow and RecentSignalsSection are each their
 * own async Server Component, wrapped in independent <Suspense> boundaries (Phase 12). This means
 * the shell (title, live chart, performance chart, pair table — the latter three already fetch
 * their own data client-side) can stream to the browser immediately, while each server-rendered
 * section fills in as soon as its own Prisma queries resolve, rather than the whole page waiting
 * on the slowest query before showing anything at all.
 */
export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-medium">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&rsquo;s what the engine is seeing right now.
        </p>
      </div>

      <Suspense fallback={<StatsRowSkeleton />}>
        <StatsRow />
      </Suspense>

      <LiveChartSection />

      <PerformanceChart />

      <PairBreakdownTable />

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">Recent signals</h2>
          <a href="/dashboard/signals" className="text-sm text-primary hover:underline">
            View all
          </a>
        </div>
        <Suspense fallback={<RecentSignalsSkeleton />}>
          <RecentSignalsSection />
        </Suspense>
      </div>
    </div>
  );
}
