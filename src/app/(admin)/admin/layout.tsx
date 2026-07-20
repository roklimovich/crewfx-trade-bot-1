import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db/prisma';
import { isUserKicked } from '@/server/auth/kick';
import { AdminShell } from '@/components/admin/admin-shell';
import type { DashboardUser } from '@/types/user';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // src/middleware.ts restricts /admin/* to ADMIN/MODERATOR by JWT role claim, but (same reason
  // as the dashboard layout) can't check the kick flag or a since-token-issued status change —
  // that's Edge Runtime's ioredis limitation. This layout runs on the Node runtime, so it does
  // both checks here.
  const userId = headers().get('x-user-id');
  if (!userId) redirect('/login');

  const [user, kicked] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, include: { role: true } }),
    isUserKicked(userId),
  ]);

  if (!user || user.status === 'BLOCKED' || kicked) redirect('/login');
  if (user.role.name !== 'ADMIN' && user.role.name !== 'MODERATOR') redirect('/dashboard');

  const adminUser: DashboardUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    status: user.status,
  };

  return <AdminShell user={adminUser}>{children}</AdminShell>;
}
