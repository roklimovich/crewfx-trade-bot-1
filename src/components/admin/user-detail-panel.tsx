'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, Clock, Send, Loader2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  status: string;
  role: string;
  emailVerified: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  referredBy: { id: string; email: string } | null;
  telegram: { username: string | null; linkedAt: string } | null;
  pocketOptionAccounts: { id: string; accountId: string; verified: boolean; submittedAt: string }[];
  activeSessions: number;
}

export function UserDetailPanel({
  userId,
  onClose,
  onChanged,
}: {
  userId: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    apiFetch<UserDetail>(`/api/admin/users/${userId}`)
      .then(setDetail)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load user.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [userId]);

  async function runAction(action: 'approve' | 'reject' | 'block' | 'unblock') {
    setActionLoading(action);
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${userId}/${action}`, { method: 'POST' });
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  }

  async function verifyPocketOption(pocketOptionAccountId: string) {
    setActionLoading('verify-po');
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${userId}/verify-pocket-option`, {
        method: 'POST',
        body: { pocketOptionAccountId },
      });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not verify.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="glass-panel absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto rounded-none border-l border-white/10 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">User detail</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {detail && !loading && (
          <div className="space-y-6">
            <div>
              <p className="font-medium">{detail.name ?? 'Unnamed'}</p>
              <p className="text-sm text-muted-foreground">{detail.email}</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-white/10 px-2 py-0.5">{detail.role}</span>
                <span className="rounded-full bg-white/10 px-2 py-0.5">{detail.status}</span>
                {detail.emailVerified && (
                  <span className="rounded-full bg-success/15 px-2 py-0.5 text-success">
                    Email verified
                  </span>
                )}
                {detail.twoFactorEnabled && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">
                    2FA on
                  </span>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Joined {new Date(detail.createdAt).toLocaleDateString()} · {detail.activeSessions}{' '}
                active session
                {detail.activeSessions === 1 ? '' : 's'}
                {detail.referredBy && <> · referred by {detail.referredBy.email}</>}
              </p>
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Pocket Option</h3>
              {detail.pocketOptionAccounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No account submitted.</p>
              ) : (
                <div className="space-y-2">
                  {detail.pocketOptionAccounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                    >
                      <div className="flex items-center gap-2">
                        {acc.verified ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Clock className="h-4 w-4 text-accent" />
                        )}
                        <span className="font-mono text-sm">{acc.accountId}</span>
                      </div>
                      {!acc.verified && (
                        <button
                          onClick={() => verifyPocketOption(acc.id)}
                          disabled={actionLoading === 'verify-po'}
                          className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Telegram</h3>
              {detail.telegram ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Send className="h-4 w-4" />
                  {detail.telegram.username ? `@${detail.telegram.username}` : 'Linked'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not linked.</p>
              )}
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              {detail.status === 'PENDING' && (
                <>
                  <ActionButton
                    label="Approve"
                    loading={actionLoading === 'approve'}
                    onClick={() => runAction('approve')}
                    tone="success"
                  />
                  <ActionButton
                    label="Reject"
                    loading={actionLoading === 'reject'}
                    onClick={() => runAction('reject')}
                    tone="danger"
                  />
                </>
              )}
              {detail.status === 'BLOCKED' ? (
                <ActionButton
                  label="Unblock"
                  loading={actionLoading === 'unblock'}
                  onClick={() => runAction('unblock')}
                  tone="success"
                />
              ) : (
                detail.status === 'ACTIVE' && (
                  <ActionButton
                    label="Block"
                    loading={actionLoading === 'block'}
                    onClick={() => runAction('block')}
                    tone="danger"
                  />
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  loading,
  tone,
}: {
  label: string;
  onClick: () => void;
  loading: boolean;
  tone: 'success' | 'danger';
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={cn(
        'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50',
        tone === 'success' ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger',
      )}
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {label}
    </button>
  );
}
