import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db/prisma';
import { AdminShell } from '@/components/admin/admin-shell';
import type { DashboardUser } from '@/types/user';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // src/middleware.ts already restricts /admin/* to ADMIN/MODERATOR and forwards x-user-id.
  const userId = headers().get('x-user-id');
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!user || (user.role.name !== 'ADMIN' && user.role.name !== 'MODERATOR'))
    redirect('/dashboard');

  const adminUser: DashboardUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    status: user.status,
  };

  return <AdminShell user={adminUser}>{children}</AdminShell>;
}
