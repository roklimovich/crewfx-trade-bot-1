'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { mockNotifications } from '@/lib/mock-data';
import { formatRelativeTime } from '@/lib/format-time';

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-accent" />
        )}
      </button>

      {open && (
        <div className="glass-panel absolute right-0 top-12 w-80 overflow-hidden p-0">
          <div className="border-b border-white/10 px-4 py-3 text-sm font-medium">
            Notifications
          </div>
          <div className="max-h-80 overflow-y-auto">
            {mockNotifications.map((n) => (
              <div key={n.id} className="border-b border-white/5 px-4 py-3 last:border-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium">{n.title}</p>
                  {!n.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[11px] text-muted-foreground/70">
                  {formatRelativeTime(n.createdAt)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
