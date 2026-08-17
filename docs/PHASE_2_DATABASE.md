# CrewFX — Phase 2: Database Design

## Design principles

- **Signals are immutable predictions.** `Signal` stores what the engine predicted at the time
  it ran. `SignalHistory` stores what actually happened. Keeping these separate means the
  win-rate analytics in Phase 11 can never accidentally "correct" a past prediction.
- **Indicators are snapshotted, not recomputed.** Every `Indicator` row is a timestamped fact
  ("RSI(14) on EUR/USD M15 at 14:32 was 71.2"). A `Signal` links to the exact indicator rows
  that justified it via `SignalIndicators`, so every signal is auditable and backtestable later.
- **Roles are a table, not a hardcoded enum of permissions.** `RoleName` (ADMIN/MODERATOR/USER)
  is an enum because the three tiers are structural, but each `Role` carries a `permissions`
  JSON array so you can adjust access without a migration.
- **Sensitive integrations are separate tables, not columns on User.** `PocketOptionAccount` and
  `TelegramAccount` are their own models so they can each have their own verification lifecycle,
  and so `User` doesn't accumulate nullable integration-specific columns.
- **Everything administrative is logged.** `Log` (system/security events) and `AdminAction`
  (specifically actions an admin took on a user/setting) are separate: `Log` is high-volume and
  operational, `AdminAction` is low-volume and audit-focused.

## Key relationships

- `User` 1—1 `Role` (many users share a role)
- `User` 1—N `Session` (multiple devices, individually revocable)
- `User` 1—N `PocketOptionAccount`, 1—1 `TelegramAccount`
- `User` 1—N `Notification`, 1—N `Log`
- `User` 1—N `AdminAction` (as actor, via `AdminActor`) and 1—N `AdminAction` (as target, via `AdminTarget`)
- `Signal` 1—1 `SignalHistory`, 1—1 `AIAnalysis`, 1—N `Notification`
- `Signal` N—N `Indicator` (via implicit join table `SignalIndicators`) — a signal typically cites
  several indicators (e.g. RSI + MACD + Bollinger) as confirmation
- `MarketData` has no FK to `Signal`/`Indicator` — it's raw ingested data, queried by
  `(pair, timeframe, timestamp)`, not joined directly

## Indexing strategy

| Table           | Index                                                      | Why                                                                                   |
| --------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `market_data`   | unique `(pair, timeframe, timestamp)`                      | prevents duplicate candle ingestion; also the primary lookup pattern                  |
| `indicators`    | unique `(pair, timeframe, type, timestamp)` + lookup index | one value per indicator per candle; fast "give me RSI for EUR/USD M15 right now"      |
| `signals`       | `(pair, createdAt)`, `(status)`                            | feed queries ("latest EUR/USD signals") and dashboard filters ("show ACTIVE signals") |
| `sessions`      | `(userId)`, `(expiresAt)`                                  | session lookups and a cron job to purge expired sessions                              |
| `notifications` | `(userId, status)`                                         | "unread notifications for this user" is the dashboard's hottest query                 |
| `logs`          | `(level, createdAt)`                                       | admin log viewer filters by severity + time range                                     |
| `admin_actions` | `(adminId, createdAt)`, `(targetUserId)`                   | audit trail lookups both "what did this admin do" and "what happened to this user"    |

## Constraints worth calling out

- `PocketOptionAccount` has a compound unique on `(userId, accountId)` — a user can submit more
  than one Pocket Option ID, but not the same one twice.
- `TelegramAccount.telegramId` and `.chatId` are both globally unique — one Telegram account can't
  be linked to two CrewFX users.
- Destructive cascades are scoped deliberately: deleting a `User` cascades their `Session`s,
  `PocketOptionAccount`s, and `TelegramAccount` (things that only make sense tied to that user),
  but `SetNull`s on `Log`, `Notification`, and `AdminAction.targetUser` — you don't want to lose
  the audit trail just because an account was deleted.

## Migrations

No migration has been generated yet — that requires a live Postgres connection
(`npm run db:migrate`), which only makes sense once you've filled in `DATABASE_URL` in `.env`.
Running `npm run db:migrate` locally will create `prisma/migrations/0001_init/` from this schema.

## What you can edit right now

- `prisma/schema.prisma` — e.g. add more `IndicatorType` values, or add a `pips` field to
  `SignalHistory` if you want tighter P/L tracking than `pnlPips` alone.
- `prisma/seed.ts` — the `defaultSettings` object controls initial platform config
  (minimum confidence score to publish a signal, default timeframes, etc.) — tune these now,
  they'll be editable from the admin panel in Phase 6 either way.

## Next step

**Phase 3 — Authentication & Security**: registration/login/logout, JWT + refresh token flow
(built on the `Session` model above), password reset, email verification, Telegram login,
referral registration, Pocket Option ID submission, plus bcrypt, CSRF/XSS protection, rate
limiting, HTTP-only+SameSite cookies, Helmet, audit logging, and admin 2FA.

**Reply "continue" (or request schema changes) before I start Phase 3.**
