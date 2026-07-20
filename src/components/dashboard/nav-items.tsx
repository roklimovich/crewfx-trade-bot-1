import { LayoutDashboard, Radar, Settings } from 'lucide-react';
import type { Messages } from '@/i18n/locales/en';

export function getDashboardNavItems(t: Messages) {
  return [
    { href: '/dashboard', label: t.dashboard.nav.overview, icon: LayoutDashboard },
    { href: '/dashboard/signals', label: t.dashboard.nav.signals, icon: Radar },
    { href: '/dashboard/settings', label: t.dashboard.nav.settings, icon: Settings },
  ];
}
