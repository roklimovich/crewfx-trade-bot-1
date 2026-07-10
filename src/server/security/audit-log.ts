import { prisma } from '@/server/db/prisma';
import type { LogLevel } from '@prisma/client';

interface LogContext {
  route?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: unknown;
}

/**
 * Writes a structured log row. Use level SECURITY for anything auth/permission
 * related (failed logins, blocked-user login attempts, 2FA failures, CSRF
 * rejections) so the admin log viewer (Phase 6) can filter to just those.
 */
export async function logEvent(
  level: LogLevel,
  message: string,
  options?: { userId?: string; context?: LogContext },
): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        level,
        message,
        userId: options?.userId,
        context: options?.context as never,
      },
    });
  } catch (err) {
    // Logging must never crash the request it's observing.
    // eslint-disable-next-line no-console
    console.error('Failed to write audit log:', err);
  }
}

/** Records an admin's action against a user/setting for the audit trail (Phase 6 admin panel reads this). */
export async function logAdminAction(params: {
  adminId: string;
  actionType:
    | 'APPROVE_USER'
    | 'REJECT_USER'
    | 'BLOCK_USER'
    | 'UNBLOCK_USER'
    | 'CHANGE_ROLE'
    | 'UPDATE_SETTING'
    | 'DELETE_SIGNAL'
    | 'IMPERSONATE';
  targetUserId?: string;
  notes?: string;
}): Promise<void> {
  await prisma.adminAction.create({
    data: {
      adminId: params.adminId,
      actionType: params.actionType,
      targetUserId: params.targetUserId,
      notes: params.notes,
    },
  });
}
