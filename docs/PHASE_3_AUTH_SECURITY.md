# SignalForge — Phase 3: Authentication & Security

## Schema change (heads-up)

Phase 2 shipped without a token table for email verification / password reset. Phase 3 adds:

```prisma
enum VerificationTokenType { EMAIL_VERIFICATION  PASSWORD_RESET }

model VerificationToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  tokenHash String   @unique
  type      VerificationTokenType
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}
```

Same pattern as `Session.refreshTokenHash`: we store a SHA-256 hash of the token, never the raw
value, so a database leak alone can't be used to verify emails or reset passwords.

## Auth flow

- **Access token**: short-lived (15 min) JWT, `HS256`, signed with `JWT_ACCESS_SECRET`. Carries
  `sub`, `email`, `role`, `status`, `sessionId`. Sent as an HTTP-only cookie for the browser app,
  or as a `Bearer` token for API/mobile clients (`src/server/auth/request-context.ts` accepts either).
- **Refresh token**: opaque random 32-byte token (not a JWT — nothing to decode, so it can only be
  used against our own `Session` table). Stored hashed. **Rotated on every use**: each refresh
  revokes the old token and issues a new pair, so a stolen-but-unused refresh token becomes
  useless the moment the legitimate user's client refreshes.
- **Sessions are revocable.** Password reset revokes all of a user's sessions. Admin "block user"
  (Phase 6) will call the same `revokeAllSessionsForUser`.

## Why these specific choices

| Decision                                                | Reasoning                                                                                                                                                                                             |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| JWT for access, opaque token for refresh                | Access tokens are verified on every request and should be stateless (no DB hit); refresh tokens are used rarely and benefit from being revocable server-side.                                         |
| Refresh-token rotation                                  | Without rotation, a leaked long-lived refresh token is valid until it expires. Rotation limits a leaked token's usefulness to a single use.                                                           |
| Generic errors on login/register/password-reset-request | Prevents user enumeration — an attacker can't tell "email doesn't exist" from "wrong password" from the response.                                                                                     |
| CSRF via double-submit cookie, not just SameSite        | SameSite=Lax still allows some top-level cross-site requests to carry cookies; the CSRF header can't be forged cross-origin because the attacker's page can't read our cookie to copy its value.      |
| Helmet-equivalent via `next.config.mjs` `headers()`     | Helmet is an Express middleware; Next.js's own `headers()` config produces the same CSP/X-Frame-Options/etc. headers without pulling in an Express-shaped dependency that doesn't fit the App Router. |
| Rate limiting via Redis (`rate-limiter-flexible`)       | In-memory rate limiting doesn't work across multiple serverless instances; Redis gives one shared counter. Auth endpoints get a strict 5-req/min limiter.                                             |
| Admin 2FA is TOTP (`otplib`), not SMS                   | No SMS provider dependency/cost, works with any standard authenticator app, and avoids SIM-swap risk entirely.                                                                                        |
| SQL injection                                           | Not a manual concern — every query goes through Prisma's parameterized query builder. No raw SQL is used anywhere in this codebase.                                                                   |

## Files

```
src/server/auth/
  password.ts        → bcrypt hashing + password strength policy
  tokens.ts           → opaque token generation/hashing (shared by refresh + verification tokens)
  jwt.ts               → access token sign/verify
  session.ts           → session create/rotate/revoke
  permissions.ts       → role/permission checks, requireRole()
  two-factor.ts        → TOTP secret/QR/verify for admin 2FA
  request-context.ts   → pulls + verifies the current user from cookie or Bearer header

src/server/security/
  rate-limit.ts   → Redis-backed limiters (auth: 5/min, general API: configurable)
  csrf.ts          → double-submit cookie generation/verification
  audit-log.ts     → writes to Log + AdminAction models

src/lib/
  cookies.ts          → sets/clears HTTP-only, SameSite=Lax auth + CSRF cookies
  mailer.ts            → verification + password-reset emails (nodemailer)
  telegram-auth.ts     → Telegram Login Widget HMAC signature verification
  validations/auth.ts  → zod schemas for every endpoint below

src/middleware.ts  → CSRF enforcement on mutating API calls, route protection for
                     /dashboard and /admin, role gating, forwards identity via headers

src/app/api/auth/
  register/route.ts
  login/route.ts                  (checks 2FA for admins)
  logout/route.ts
  refresh/route.ts
  verify-email/route.ts
  password-reset/request/route.ts
  password-reset/confirm/route.ts
  pocket-option/route.ts          (submit ID — admin verifies later, Phase 6)
  telegram/route.ts               (login-if-linked, else link-to-current-session)
  2fa/setup/route.ts               (admin only)
  2fa/verify/route.ts              (admin only)
```

## A judgment call worth flagging

**Telegram login** can mean two things: "log in using Telegram" or "link Telegram to my
account for notifications." I implemented `/api/auth/telegram` to do both, branching on whether
the Telegram ID is already linked to a user:

- Linked → logs the browser in as that user (this is the "Telegram Login" feature).
- Not linked → requires an existing SignalForge session and links Telegram to it (this feeds
  Phase 10's notification delivery).

If you'd rather these be two separate, more explicit endpoints, that's a quick split later.

## What you can edit right now

- `src/server/security/rate-limit.ts` — `authRateLimiter` is currently 5 attempts/min then a
  5-minute block. Tune `points`/`duration`/`blockDuration` to taste.
- `src/server/auth/password.ts` — `isPasswordStrongEnough()` is the entire password policy in
  one function; easy to adjust (e.g. require a symbol) without hunting through route handlers.
- `.env` — `JWT_ACCESS_SECRET` and the SMTP/Telegram credentials need real values before any of
  this runs. Generate secrets with `openssl rand -hex 32`.

## Next step

**Phase 4 — Landing Page**: the public marketing site (Hero, Features, Benefits, Statistics,
Testimonials, Pricing, FAQ, CTA, Footer) in the dark/glassmorphism style from your reference image,
built on the design tokens from Phase 1.

**Reply "continue" (or request changes to Phase 3) before I start Phase 4.**
