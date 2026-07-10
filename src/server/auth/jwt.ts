import { SignJWT, jwtVerify } from 'jose';

const ACCESS_TOKEN_TTL = '15m';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: string; // RoleName
  status: string; // UserStatus
  sessionId: string;
}

function getAccessSecret(): Uint8Array {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not set');
  return new TextEncoder().encode(secret);
}

/** Short-lived, stateless access token. Sent as an HTTP-only cookie AND usable as a Bearer token for API clients. */
export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(getAccessSecret());
}

/** Returns null on any verification failure (expired, tampered, wrong secret) — callers treat null as "unauthenticated". */
export async function verifyAccessToken(token: string): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    return payload as unknown as AccessTokenPayload;
  } catch {
    return null;
  }
}
