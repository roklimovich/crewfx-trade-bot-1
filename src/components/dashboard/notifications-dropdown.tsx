'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/format-time';
import { useNotificationStream } from '@/hooks/use-notification-stream';
import { cn } from '@/lib/utils';

interface NotificationRow {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const { liveNotifications } = useNotificationStream();

  const load = useCallback(() => {
    apiFetch<{ notifications: NotificationRow[]; unreadCount: number }>('/api/notifications').then(
      (res) => {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount);
      },
    );
  }, []);

  useEffect(load, [load]);

  // A live SSE event means something new landed — refetch so counts/list stay accurate
  // rather than trying to merge the ephemeral realtime shape into the DB-backed list by hand.
  useEffect(() => {
    if (liveNotifications.length > 0) load();
  }, [liveNotifications, load]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleOpen() {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) load();
  }

  async function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' }).catch(() => {});
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
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
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.readAt && markAsRead(n.id)}
                  className={cn(
                    'block w-full border-b border-white/5 px-4 py-3 text-left last:border-0 hover:bg-white/5',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.readAt && (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    {formatRelativeTime(n.createdAt)}
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
