import { prisma } from '@/server/db/prisma';
import { generateOpaqueToken, hashToken } from './tokens';
import { signAccessToken } from './jwt';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

/**
 * Creates a new Session row + matching access/refresh token pair.
 * Called on login, and again on every refresh (refresh-token rotation —
 * the old refresh token is revoked so a stolen-but-unused token can't be replayed later).
 */
export async function createSession(params: {
  userId: string;
  email: string;
  role: string;
  status: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<IssuedTokens> {
  const { token: refreshToken, tokenHash } = generateOpaqueToken();

  const session = await prisma.session.create({
    data: {
      userId: params.userId,
      refreshTokenHash: tokenHash,
      userAgent: params.userAgent ?? undefined,
      ipAddress: params.ipAddress ?? undefined,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  const accessToken = await signAccessToken({
    sub: params.userId,
    email: params.email,
    role: params.role,
    status: params.status,
    sessionId: session.id,
  });

  return { accessToken, refreshToken, sessionId: session.id };
}

/**
 * Validates a presented refresh token against the Session table and rotates it.
 * Returns null if the token is unknown, expired, or already revoked — every one
 * of those cases should look identical to the caller (no information leakage).
 */
export async function rotateSession(refreshToken: string): Promise<IssuedTokens | null> {
  const tokenHash = hashToken(refreshToken);

  const session = await prisma.session.findUnique({
    where: { refreshTokenHash: tokenHash },
    include: { user: { include: { role: true } } },
  });

  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }

  if (session.user.status === 'BLOCKED') {
    return null;
  }

  // Revoke the used token (rotation) then issue a fresh pair.
  await prisma.session.update({
    where: { id: session.id },
    data: { revokedAt: new Date() },
  });

  return createSession({
    userId: session.user.id,
    email: session.user.email,
    role: session.user.role.name,
    status: session.user.status,
    userAgent: session.userAgent,
    ipAddress: session.ipAddress,
  });
}

export async function revokeSession(sessionId: string): Promise<void> {
  await prisma.session.update({
    where: { id: sessionId },
    data: { revokedAt: new Date() },
  });
}

/** Used by "log out everywhere" and by admin "block user". */
export async function revokeAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
