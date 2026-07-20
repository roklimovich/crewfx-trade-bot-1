'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CandlestickChart, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDashboardNavItems } from './nav-items';
import { useTranslations } from '@/i18n/locale-provider';
import type { DashboardUser } from '@/types/user';

export function Sidebar({ user }: { user: DashboardUser }) {
  const pathname = usePathname();
  const { messages: t } = useTranslations();
  const navItems = getDashboardNavItems(t);

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/5 bg-white/[0.02] lg:flex">
      <div className="flex h-16 items-center gap-2 border-b border-white/5 px-6 font-display text-lg font-medium">
        <CandlestickChart className="h-5 w-5 text-primary" />
        SignalForge
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
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

        {(user.role === 'ADMIN' || user.role === 'MODERATOR') && (
          <Link
            href="/admin"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
          >
            <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
            {t.dashboard.nav.adminPanel}
          </Link>
        )}
      </nav>

      <div className="border-t border-white/5 p-4 text-xs text-muted-foreground">
        {t.dashboard.footerNote}
      </div>
    </aside>
  );
}
