import { prisma } from '@/server/db/prisma';
import type { AccessTokenPayload } from './jwt';

/** Looks up the role's permission list and checks membership. Cached per-request by the caller if needed. */
export async function hasPermission(roleName: string, permission: string): Promise<boolean> {
  const role = await prisma.role.findUnique({ where: { name: roleName as never } });
  if (!role) return false;
  const permissions = role.permissions as string[];
  return permissions.includes(permission);
}

/** Cheap structural checks that don't need a DB round-trip — used in API routes and middleware. */
export function isAdmin(payload: AccessTokenPayload): boolean {
  return payload.role === 'ADMIN';
}

export function isModeratorOrAbove(payload: AccessTokenPayload): boolean {
  return payload.role === 'ADMIN' || payload.role === 'MODERATOR';
}

export function isActiveUser(payload: AccessTokenPayload): boolean {
  return payload.status === 'ACTIVE';
}

export class UnauthorizedError extends Error {}
export class ForbiddenError extends Error {}

/** Throws if the payload's role isn't in the allowed set — call at the top of a protected route handler. */
export function requireRole(
  payload: AccessTokenPayload | null,
  allowed: string[],
): AccessTokenPayload {
  if (!payload) throw new UnauthorizedError('Not authenticated');
  if (!allowed.includes(payload.role)) throw new ForbiddenError('Insufficient role');
  return payload;
}
