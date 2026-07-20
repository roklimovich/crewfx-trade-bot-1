import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db/prisma';
import { isUserKicked } from '@/server/auth/kick';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { DashboardUser } from '@/types/user';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // src/middleware.ts verified the JWT signature/expiry for anything under /dashboard and
  // forwarded the user id via this header. That's necessary but not sufficient: middleware
  // runs on the Edge Runtime, which can't use ioredis (needs raw TCP sockets — same category of
  // constraint as Phase 3's CSRF module needing Web Crypto instead of Node's crypto module), so
  // it can't check the kick flag. This layout runs on the Node runtime, so it's the right place
  // to enforce both "was this user blocked since their token was issued" and "were they kicked"
  // — a still-cryptographically-valid JWT isn't enough on its own for either case.
  const userId = headers().get('x-user-id');
  if (!userId) redirect('/login');

  const [user, kicked] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { role: true } }),
    isUserKicked(userId),
  ]);

  if (!user || user.status === 'BLOCKED' || kicked) redirect('/login');

  const dashboardUser: DashboardUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    status: user.status,
  };

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}
