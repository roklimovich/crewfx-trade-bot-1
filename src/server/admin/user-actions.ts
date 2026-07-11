import { prisma } from '@/server/db/prisma';
import { revokeAllSessionsForUser } from '@/server/auth/session';
import { logAdminAction, logEvent } from '@/server/security/audit-log';

export class AdminActionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function getTargetOrThrow(targetUserId: string) {
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new AdminActionError('User not found.', 404);
  return target;
}

export async function approveUser(adminId: string, targetUserId: string) {
  if (adminId === targetUserId)
    throw new AdminActionError('You cannot approve your own account.', 400);
  await getTargetOrThrow(targetUserId);

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: 'ACTIVE' },
  });
  await logAdminAction({ adminId, actionType: 'APPROVE_USER', targetUserId });
  await logEvent('INFO', 'User approved', {
    userId: targetUserId,
    context: { approvedBy: adminId },
  });
  return user;
}

export async function rejectUser(adminId: string, targetUserId: string, notes?: string) {
  if (adminId === targetUserId)
    throw new AdminActionError('You cannot reject your own account.', 400);
  await getTargetOrThrow(targetUserId);

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: 'REJECTED' },
  });
  await revokeAllSessionsForUser(targetUserId);
  await logAdminAction({ adminId, actionType: 'REJECT_USER', targetUserId, notes });
  await logEvent('SECURITY', 'User rejected', {
    userId: targetUserId,
    context: { rejectedBy: adminId },
  });
  return user;
}

export async function blockUser(adminId: string, targetUserId: string, notes?: string) {
  if (adminId === targetUserId)
    throw new AdminActionError('You cannot block your own account.', 400);
  const target = await getTargetOrThrow(targetUserId);

  if (target.status === 'BLOCKED') throw new AdminActionError('User is already blocked.', 400);

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: 'BLOCKED' },
  });
  await revokeAllSessionsForUser(targetUserId); // kick them out immediately, everywhere
  await logAdminAction({ adminId, actionType: 'BLOCK_USER', targetUserId, notes });
  await logEvent('SECURITY', 'User blocked', {
    userId: targetUserId,
    context: { blockedBy: adminId },
  });
  return user;
}

export async function unblockUser(adminId: string, targetUserId: string) {
  const target = await getTargetOrThrow(targetUserId);
  if (target.status !== 'BLOCKED')
    throw new AdminActionError('User is not currently blocked.', 400);

  const user = await prisma.user.update({
    where: { id: targetUserId },
    data: { status: 'ACTIVE' },
  });
  await logAdminAction({ adminId, actionType: 'UNBLOCK_USER', targetUserId });
  await logEvent('INFO', 'User unblocked', {
    userId: targetUserId,
    context: { unblockedBy: adminId },
  });
  return user;
}

export async function verifyPocketOptionAccount(
  adminId: string,
  userId: string,
  pocketOptionAccountId: string,
) {
  const account = await prisma.pocketOptionAccount.findUnique({
    where: { id: pocketOptionAccountId },
  });
  if (!account) throw new AdminActionError('Pocket Option account not found.', 404);
  if (account.userId !== userId)
    throw new AdminActionError('This account does not belong to that user.', 400);

  const updated = await prisma.pocketOptionAccount.update({
    where: { id: pocketOptionAccountId },
    data: { verified: true, verifiedAt: new Date() },
  });
  await logAdminAction({
    adminId,
    actionType: 'VERIFY_POCKET_OPTION',
    targetUserId: account.userId,
    notes: `Verified Pocket Option account ${account.accountId}`,
  });
  return updated;
}
