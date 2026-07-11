import { LayoutDashboard, Radar, Settings } from 'lucide-react';

export const DASHBOARD_NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/signals', label: 'Signals', icon: Radar },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];
