'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Send, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { UserDetailPanel } from '@/components/admin/user-detail-panel';

interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  status: 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';
  role: 'ADMIN' | 'MODERATOR' | 'USER';
  emailVerified: boolean;
  createdAt: string;
  telegram: { username: string | null } | null;
  pocketOption: { accountId: string; verified: boolean } | null;
}

const STATUS_FILTERS = ['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'BLOCKED'] as const;

const STATUS_STYLES: Record<AdminUserRow['status'], string> = {
  PENDING: 'bg-accent/15 text-accent',
  ACTIVE: 'bg-success/15 text-success',
  REJECTED: 'bg-muted text-muted-foreground',
  BLOCKED: 'bg-danger/15 text-danger',
};

function UsersPageInner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>(
    (searchParams.get('status') as (typeof STATUS_FILTERS)[number]) || 'ALL',
  );
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    if (query) params.set('q', query);
    apiFetch<{ users: AdminUserRow[] }>(`/api/admin/users?${params.toString()}`)
      .then((res) => setUsers(res.users))
      .finally(() => setLoading(false));
  }, [status, query]);

  useEffect(() => {
    const t = setTimeout(load, 250); // light debounce on search typing
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium">Users</h1>
        <p className="mt-1 text-sm text-muted-foreground">Approve, reject, and manage accounts.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                status === f
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-white/10 text-muted-foreground hover:bg-white/5',
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or email…"
            className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm outline-none ring-primary/50 focus:ring-2"
          />
        </div>
      </div>

      <div className="glass-panel overflow-hidden p-0">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            No users match this filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-muted-foreground">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Pocket Option</th>
                  <th className="px-5 py-3 font-medium">Telegram</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    className="cursor-pointer border-b border-white/5 transition-colors last:border-0 focus-within:bg-white/[0.03] hover:bg-white/[0.03]"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium">{u.name ?? 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          STATUS_STYLES[u.status],
                        )}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{u.role}</td>
                    <td className="px-5 py-3">
                      {u.pocketOption ? (
                        <span className="flex items-center gap-1.5 font-mono text-xs">
                          {u.pocketOption.verified ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          ) : (
                            <Clock className="h-3.5 w-3.5 text-accent" />
                          )}
                          {u.pocketOption.accountId}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {u.telegram ? (
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Send className="h-3.5 w-3.5" />
                          {u.telegram.username ? `@${u.telegram.username}` : 'Linked'}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUserId && (
        <UserDetailPanel
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersPageInner />
    </Suspense>
  );
}
