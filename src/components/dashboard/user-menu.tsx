'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api-client';
import type { DashboardUser } from '@/types/user';

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }
  return email.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: { user: DashboardUser }) {
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
      router.refresh();
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent font-display text-xs font-medium text-white">
          {getInitials(user.name, user.email)}
        </span>
        <ChevronDown className="hidden h-4 w-4 text-muted-foreground sm:block" />
      </button>

      {open && (
        <div
          className="overlay-panel absolute right-0 top-12 z-[60] w-56 overflow-hidden p-0"
          role="dialog"
          aria-label="Account menu"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-medium">{user.name ?? 'Trader'}</p>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
          <div className="p-1">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-white/5 hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
