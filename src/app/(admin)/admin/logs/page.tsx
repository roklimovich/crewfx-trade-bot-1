'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { formatRelativeTime } from '@/lib/format-time';
import { cn } from '@/lib/utils';

interface LogItem {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SECURITY';
  message: string;
  userEmail: string | null;
  createdAt: string;
}

interface AdminActionItem {
  id: string;
  actionType: string;
  adminEmail: string;
  targetEmail: string | null;
  notes: string | null;
  createdAt: string;
}

const LEVEL_STYLES: Record<LogItem['level'], string> = {
  INFO: 'bg-white/10 text-muted-foreground',
  WARN: 'bg-accent/15 text-accent',
  ERROR: 'bg-danger/15 text-danger',
  SECURITY: 'bg-primary/15 text-primary',
};

const LEVELS = ['ALL', 'INFO', 'WARN', 'ERROR', 'SECURITY'] as const;

export default function AdminLogsPage() {
  const [view, setView] = useState<'logs' | 'admin-actions'>('logs');
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('ALL');
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [actions, setActions] = useState<AdminActionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ view });
    if (view === 'logs' && level !== 'ALL') params.set('level', level);

    apiFetch<{ items: LogItem[] | AdminActionItem[] }>(`/api/admin/logs?${params.toString()}`)
      .then((res) => {
        if (view === 'logs') setLogs(res.items as LogItem[]);
        else setActions(res.items as AdminActionItem[]);
      })
      .finally(() => setLoading(false));
  }, [view, level]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          System events and the admin action audit trail.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['logs', 'admin-actions'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                view === v
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-white/10 text-muted-foreground hover:bg-white/5',
              )}
            >
              {v === 'logs' ? 'System logs' : 'Admin actions'}
            </button>
          ))}
        </div>

        {view === 'logs' && (
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  level === l
                    ? 'border-primary/50 bg-primary/15 text-primary'
                    : 'border-white/10 text-muted-foreground hover:bg-white/5',
                )}
              >
                {l}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel overflow-hidden p-0">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : view === 'logs' ? (
          logs.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No logs at this level yet.
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        'mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium',
                        LEVEL_STYLES[log.level],
                      )}
                    >
                      {log.level}
                    </span>
                    <div>
                      <p className="text-sm">{log.message}</p>
                      {log.userEmail && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{log.userEmail}</p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatRelativeTime(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )
        ) : actions.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No admin actions recorded yet.
          </p>
        ) : (
          <div className="divide-y divide-white/5">
            {actions.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-4 p-4">
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{a.adminEmail}</span>{' '}
                    <span className="text-muted-foreground">
                      {a.actionType.replace(/_/g, ' ').toLowerCase()}
                    </span>
                    {a.targetEmail && (
                      <>
                        {' '}
                        · <span className="text-muted-foreground">{a.targetEmail}</span>
                      </>
                    )}
                  </p>
                  {a.notes && <p className="mt-0.5 text-xs text-muted-foreground">{a.notes}</p>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(a.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
