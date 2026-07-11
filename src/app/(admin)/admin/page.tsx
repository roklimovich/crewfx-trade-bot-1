import { Users, UserCheck, ShieldAlert, Radar, Clock, ShieldX } from 'lucide-react';
import { prisma } from '@/server/db/prisma';
import { StatCard } from '@/components/dashboard/stat-card';

export const metadata = { title: 'Admin Overview' };

export default async function AdminOverviewPage() {
  const [
    totalUsers,
    pendingUsers,
    activeUsers,
    blockedUsers,
    unverifiedPocketOptions,
    totalSignals,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'BLOCKED' } }),
    prisma.pocketOptionAccount.count({ where: { verified: false } }),
    prisma.signal.count(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-medium">Admin overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live counts from the database.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total users" value={String(totalUsers)} icon={Users} />
        <StatCard
          label="Pending approval"
          value={String(pendingUsers)}
          icon={Clock}
          tone="accent"
        />
        <StatCard
          label="Active users"
          value={String(activeUsers)}
          icon={UserCheck}
          tone="success"
        />
        <StatCard label="Blocked users" value={String(blockedUsers)} icon={ShieldX} />
        <StatCard
          label="Unverified Pocket Option IDs"
          value={String(unverifiedPocketOptions)}
          icon={ShieldAlert}
          tone="accent"
        />
        <StatCard label="Total signals" value={String(totalSignals)} icon={Radar} />
      </div>

      {pendingUsers > 0 && (
        <div className="glass-panel flex items-center justify-between p-5">
          <div>
            <p className="text-sm font-medium">
              {pendingUsers} account{pendingUsers === 1 ? '' : 's'} waiting on approval
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Review them before they can see the signal feed.
            </p>
          </div>
          <a
            href="/admin/users?status=PENDING"
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Review now
          </a>
        </div>
      )}

      {totalSignals === 0 && (
        <p className="text-xs text-muted-foreground">
          Signal count is 0 because Phase 7 (Market Data) and Phase 8 (Signal Engine) haven&rsquo;t
          been built yet — this number reflects real database state, not a mock.
        </p>
      )}
    </div>
  );
}
