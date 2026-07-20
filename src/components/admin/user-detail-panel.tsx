'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, Clock, Send, Loader2, Pencil } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  status: string;
  role: 'ADMIN' | 'MODERATOR' | 'USER';
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
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ name: '', email: '', role: 'USER' as UserDetail['role'] });
  const [editingPocketOptionId, setEditingPocketOptionId] = useState<string | null>(null);
  const [pocketOptionDraft, setPocketOptionDraft] = useState('');

  function load() {
    setLoading(true);
    apiFetch<UserDetail>(`/api/admin/users/${userId}`)
      .then((user) => {
        setDetail(user);
        setDraft({ name: user.name ?? '', email: user.email, role: user.role });
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load user.'))
      .finally(() => setLoading(false));
  }

  useEffect(load, [userId]);

  async function runAction(action: 'approve' | 'reject' | 'block' | 'unblock' | 'kick') {
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

  async function savePocketOptionId(pocketOptionAccountId: string) {
    setActionLoading('save-po-id');
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${userId}/pocket-option/${pocketOptionAccountId}`, {
        method: 'PATCH',
        body: { accountId: pocketOptionDraft.trim() },
      });
      setEditingPocketOptionId(null);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update Pocket Option ID.');
    } finally {
      setActionLoading(null);
    }
  }

  async function saveDetails() {
    setActionLoading('save-details');
    setError(null);
    try {
      await apiFetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        body: { name: draft.name.trim(), email: draft.email.trim(), role: draft.role },
      });
      setEditing(false);
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update user details.');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 z-0 bg-black/35 backdrop-blur-[1px]" onClick={onClose} />
      <div
        className="relative z-10 max-h-full w-full max-w-md overflow-y-auto rounded-xl border border-white/10 bg-[hsl(222_47%_8%)] p-5 shadow-2xl shadow-black/50 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="User detail"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium">User detail</h2>
          <div className="flex items-center gap-1">
            {detail && !loading && (
              <button
                onClick={() => setEditing((value) => !value)}
                className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                aria-label={editing ? 'Cancel editing' : 'Edit user details'}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-2 text-muted-foreground hover:bg-white/5"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {detail && !loading && (
          <div className="space-y-6">
            <div>
              {editing ? (
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Name
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setDraft((value) => ({ ...value, name: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none ring-primary/50 focus:ring-2"
                    />
                  </label>
                  <label className="block text-xs font-medium text-muted-foreground">
                    Email
                    <input
                      type="email"
                      value={draft.email}
                      onChange={(event) =>
                        setDraft((value) => ({ ...value, email: event.target.value }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-foreground outline-none ring-primary/50 focus:ring-2"
                    />
                  </label>
                  <label className="block text-xs font-medium text-muted-foreground">
                    Role
                    <select
                      value={draft.role}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          role: event.target.value as UserDetail['role'],
                        }))
                      }
                      className="mt-1.5 w-full rounded-lg border border-white/10 bg-[hsl(222_47%_8%)] px-3 py-2 text-sm text-foreground outline-none ring-primary/50 focus:ring-2"
                    >
                      <option value="USER">User</option>
                      <option value="MODERATOR">Moderator</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </label>
                  <button
                    onClick={saveDetails}
                    disabled={actionLoading === 'save-details'}
                    className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {actionLoading === 'save-details' && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Save details
                  </button>
                </div>
              ) : (
                <>
                  <p className="font-medium">{detail.name ?? 'Unnamed'}</p>
                  <p className="text-sm text-muted-foreground">{detail.email}</p>
                </>
              )}
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
                      <div className="min-w-0 flex-1">
                        {editingPocketOptionId === acc.id ? (
                          <input
                            autoFocus
                            value={pocketOptionDraft}
                            onChange={(event) => setPocketOptionDraft(event.target.value)}
                            className="w-full rounded-md border border-white/10 bg-white/5 px-2 py-1 font-mono text-sm outline-none ring-primary/50 focus:ring-2"
                            aria-label="Pocket Option ID"
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            {acc.verified ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Clock className="h-4 w-4 text-accent" />
                            )}
                            <span className="truncate font-mono text-sm">{acc.accountId}</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-3 flex shrink-0 items-center gap-2">
                        {editingPocketOptionId === acc.id ? (
                          <>
                            <button
                              onClick={() => savePocketOptionId(acc.id)}
                              disabled={actionLoading === 'save-po-id'}
                              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                            >
                              {actionLoading === 'save-po-id' ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => setEditingPocketOptionId(null)}
                              className="text-xs text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setPocketOptionDraft(acc.accountId);
                                setEditingPocketOptionId(acc.id);
                              }}
                              className="text-xs font-medium text-muted-foreground hover:text-foreground"
                            >
                              Edit
                            </button>
                            {!acc.verified && (
                              <button
                                onClick={() => verifyPocketOption(acc.id)}
                                disabled={actionLoading === 'verify-po'}
                                className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
                              >
                                Verify
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Editing an ID clears its verification; verify it again after saving.
              </p>
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
              {detail.status !== 'BLOCKED' && detail.status !== 'REJECTED' && (
                <ActionButton
                  label="Kick (force logout)"
                  loading={actionLoading === 'kick'}
                  onClick={() => runAction('kick')}
                  tone="danger"
                />
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Block</strong> bans the account and ends every
              session. <strong className="text-foreground">Kick</strong> only ends every current
              session (including one already in progress right now) without banning — useful for
              forcing a re-login without any account-level consequence.
            </p>
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
