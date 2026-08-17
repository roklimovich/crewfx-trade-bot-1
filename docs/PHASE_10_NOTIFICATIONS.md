# CrewFX — Phase 10: Notifications

## Schema change (heads-up)

Added `PushSubscription` — Web Push needs somewhere to store each browser's subscription
(endpoint + encryption keys), and nothing in Phase 2 covered that. Same hashed-nothing-sensitive
pattern as the rest of the schema: the endpoint/keys aren't secrets in the same way a password is,
but they're still only ever used server-side to push to that specific browser.

```prisma
model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}
```

## What was implemented

```
src/server/notifications/
  templates.ts             → pure content-building functions, one per channel's format needs
  dispatch.ts                → orchestrator: for every ACTIVE user, create Notification rows +
                                attempt delivery across whichever channels are available to them
  realtime.ts                  → Redis pub/sub publishing (see "why Redis, not memory" below)

  channels/
    telegram.ts    → direct Bot API fetch calls (see "why not node-telegram-bot-api" below)
    email.ts         → reuses the Phase 3 mail transport, now extracted to src/lib/mail-transport.ts
    push.ts             → real Web Push via VAPID + the `web-push` library; auto-deletes a
                          PushSubscription on a 404/410 (browser unsubscribed or subscription died)

  __tests__/templates.test.ts   → 11 tests: BUY/SELL formatting, AI-summary preference, Telegram
                                    HTML formatting, email risk-disclosure line, push payload
                                    truncation — all pure, no network needed

src/app/api/notifications/
  route.ts                    → GET, real notification list (replaces Phase 5's mock data)
  [id]/read/route.ts            → POST, mark one notification read
  stream/route.ts                 → GET, Server-Sent Events — the "real-time updates" requirement
  push/subscribe/route.ts           → POST, register a PushSubscription
  push/unsubscribe/route.ts           → POST, remove one

public/sw.js                    → service worker: push event → browser notification, click → focus/open tab

src/hooks/use-notification-stream.ts    → EventSource client hook: sound + browser Notification +
                                            live list, on every SSE event
src/lib/notification-sound.ts             → synthesized two-tone chime via Web Audio API — no
                                              audio file to ship (see below)

src/components/dashboard/
  notifications-dropdown.tsx        → rewritten to use real /api/notifications + the SSE hook
  settings/push-notifications-section.tsx   → subscribe/unsubscribe UI, in Settings now

src/server/signal-engine/generate-signal.ts   → now awaits dispatchSignalNotifications() right
                                                  after AI analysis, same serverless-freeze
                                                  reasoning as Phase 9's analyzeSignal() await
```

## Design decisions worth explaining

**Telegram via direct `fetch`, not `node-telegram-bot-api`.** That package (a Phase 1 dependency)
is built around long-polling or webhooks for _receiving_ messages — real infrastructure for a
different job. Sending is just an HTTPS POST to `api.telegram.org/bot<token>/sendMessage`, so a
direct fetch call is simpler and has no persistent-connection requirements, which fits a
serverless route far better. The dependency stays in `package.json` for a future interactive bot
(slash commands, replies) — that would genuinely need it.

**Real-time via Redis pub/sub, not an in-memory connection map.** The obvious naive approach —
keep a `Map<userId, Set<connection>>` in memory — silently breaks the moment this app runs as more
than one serverless instance, because a publish only reaches connections held by whichever
instance happens to handle that request. Redis pub/sub (this project already depends on Redis
since Phase 1) broadcasts to every instance's subscribers correctly regardless of which one
originally created the signal.

**SSE, not WebSockets**, for the same reason called out in `stream/route.ts`: this is a purely
one-directional server→client feed (new notification arrived), and SSE is a plain HTTP response
Next.js API routes already support — no separate WebSocket server or upgrade handshake to run
alongside the Next.js app.

**Synthesized sound, not an audio file.** `notification-sound.ts` builds a two-tone chime with the
Web Audio API directly (two sine-wave oscillators). No binary asset to ship, version, or have go
missing — and this environment couldn't generate a real audio file anyway.

## An honest limitation: no per-user notification preferences yet

Every `ACTIVE` user gets notified of every signal, on every channel available to them (Telegram if
linked, push if subscribed, email always). There's no "I only care about EUR/USD" or "only
HIGH-confidence signals" preference table in the schema. At real scale this gets noisy fast — it's
a natural next addition (a watchlist/preference model), but building it wasn't asked for in this
phase's spec and would have meaningfully expanded scope beyond "implement the four channels."
Flagged here rather than silently shipping something that looks more sophisticated than it is.

## A deployment-architecture honesty note

`stream/route.ts` says this directly, but it's worth repeating: on serverless platforms with hard
execution-time limits (Vercel's default plans included), a long-lived SSE connection will
eventually get cut by the _platform_, not by a bug in this code. `EventSource`'s built-in
auto-reconnect means that's a brief gap, not a broken feature — but if you need guaranteed
always-on real-time at real scale, a dedicated long-running service or a hosted realtime provider
(Pusher, Ably, Vercel's own realtime primitives) is the more correct production architecture than
raw SSE from a serverless function. This project uses SSE because it's the right complexity level
for what's been asked so far, not because it's the only valid choice.

## Verified in this environment

- ✅ **56/56 tests pass** (11 new this phase, templates only — dispatch/channels/realtime all
  require a real DB/Redis/external API and can't be unit-tested without network access, consistent
  with every prior phase's external-dependency limitation).
- ✅ `eslint` clean. One real bug caught by `tsc`, not the sandbox artifact: `Record<string, T>`
  indexing is unsafe under this project's `noUncheckedIndexedAccess` setting even for a
  seemingly-fixed set of keys — fixed by replacing the loose `Record` with a proper `ChannelTally`
  interface with the four known channel names as real fields.
- ✅ `next build` — webpack compiled successfully; the only failure is the same known Prisma-stub
  wall from every prior phase.
- ⚠️ **Not verified**: actual delivery through Telegram's Bot API, a real SMTP server, or a real
  Web Push endpoint — none reachable from this sandbox. The request-building code follows each
  provider's documented API exactly, but test all three against real credentials before relying on
  them.

## What you can edit right now

- `.env` → `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (generate with `npx web-push generate-vapid-keys`)
  and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same public key, client-visible) to turn on push.
- `src/server/notifications/templates.ts` — every channel's exact wording/formatting lives here in
  one file; `templates.test.ts` will catch it immediately if an edit breaks the risk-disclosure
  line or the AI-summary preference.

## Next step

**Phase 11 — Signal History & Analytics**: win rate, accuracy, daily/weekly/monthly performance,
charts, filters, search, and export — this is also where the honest gaps from Phases 8 and 9 (no
outcome evaluation for expired signals yet, dashboard still on Phase 5's mock data) get resolved
with real data.

**Reply "continue" (or request changes to Phase 10) before I start Phase 11.**
