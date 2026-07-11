'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, CandlestickChart, ShieldCheck, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserMenu } from '@/components/dashboard/user-menu';
import { ADMIN_NAV_ITEMS } from './nav-items';
import type { DashboardUser } from '@/types/user';

function AdminNav({
  pathname,
  role,
  onNavigate,
}: {
  pathname: string;
  role: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="flex-1 space-y-1 p-4">
      {ADMIN_NAV_ITEMS.map((item) => {
        if (item.href === '/admin/settings' && role !== 'ADMIN') return null; // moderators can't write settings
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
              active
                ? 'bg-primary/15 text-primary'
                : 'text-muted-foreground hover:bg-white/5 hover:text-foreground',
            )}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="mt-4 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Back to dashboard
      </Link>
    </nav>
  );
}

export function AdminShell({ user, children }: { user: DashboardUser; children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-white/[0.02] lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6 font-display text-lg font-medium">
          <CandlestickChart className="h-5 w-5 text-primary" />
          SignalForge
          <span className="ml-auto flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium text-accent">
            <ShieldCheck className="h-3 w-3" />
            {user.role}
          </span>
        </div>
        <AdminNav pathname={pathname} role={user.role} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-background p-4">
            <div className="mb-6 flex items-center justify-between">
              <span className="flex items-center gap-2 font-display text-lg font-medium">
                <CandlestickChart className="h-5 w-5 text-primary" />
                SignalForge
              </span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <AdminNav
              pathname={pathname}
              role={user.role}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-background/80 px-4 backdrop-blur-lg sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden lg:block" />
          <UserMenu user={user} />
        </header>

        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
