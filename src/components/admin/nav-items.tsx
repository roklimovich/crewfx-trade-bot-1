import { LayoutDashboard, Users, ScrollText, Settings } from 'lucide-react';

export const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/logs', label: 'Logs', icon: ScrollText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];
