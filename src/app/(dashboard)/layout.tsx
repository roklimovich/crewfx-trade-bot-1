import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/server/db/prisma';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';
import type { DashboardUser } from '@/types/user';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // src/middleware.ts already verified the JWT for anything under /dashboard and
  // forwarded the user id via this header — no need to re-verify the token here.
  const userId = headers().get('x-user-id');
  if (!userId) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user) redirect('/login');

  const dashboardUser: DashboardUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role.name,
    status: user.status,
  };

  return <DashboardShell user={dashboardUser}>{children}</DashboardShell>;
}
