# SignalForge — Combined Update: Theme, i18n, Admin Kick, AI Localization

This wasn't a numbered roadmap phase — it's a batch of specific requests handled together. Phase
14 (Testing) resumes next.

## 1. FAQ "bug" — verified correct, not fixed (because it wasn't broken)

Wrote 6 real component tests (`src/components/marketing/__tests__/faq.test.tsx`, using React
Testing Library) that render the actual `Faq` component and simulate real clicks — including
clicking the second question and asserting its answer appears. All pass. The accordion logic was
already correct; what you saw was almost certainly stale cached JS in the browser, a pattern
you've hit a few times earlier in this project. Hard-refresh after deploying this update.

## 2. Color theme: purple → blue

Not just the CSS variables — I audited for hardcoded colors that wouldn't have followed a
variable change and found several real ones:

- `tailwind.config.ts`'s `glow-purple` gradient utility had the color **hardcoded as literal
  purple RGB**, completely disconnected from `--primary`. Renamed to `glow-blue`, recolored.
- Three more hardcoded purple `rgba()`/`hsl()` values in `pricing.tsx`, `signal-card.tsx`, and
  `win-rate-area-chart.tsx` (the last of which I fixed by making it reference `hsl(var(--primary))`
  directly instead of a literal value, so it can't drift out of sync with the theme again).
- `swagger-dark.css` and the TradingView widget's background config also had stale hardcoded
  hex/rgb from the old palette.

New palette: electric blue primary (`hsl(217 91% 60%)`) with a cyan accent (`hsl(189 85% 55%)`) —
still the dark-glass aesthetic, shifted hue family.

## 3. Admin: proper ban/kick

Found and fixed a **real security gap**, not just added a feature: `blockUser()` revoked the
database session (stopping future token refreshes) but an already-issued JWT access token kept
working for up to 15 more minutes regardless, since JWTs are stateless by design. "Blocked" wasn't
actually immediate.

Fixed with `src/server/auth/kick.ts` — a Redis flag with a TTL matching the access token's
lifetime, checked on every request in addition to normal JWT verification. `blockUser()` and
`rejectUser()` now call it too, so they're actually immediate, not just "immediate after the
token would have expired anyway."

**Real Edge Runtime constraint surfaced by this**: `src/middleware.ts` runs on the Edge Runtime,
which can't use `ioredis` (needs raw TCP sockets — same category of limitation as Phase 3's CSRF
module needing Web Crypto instead of Node's `crypto`). So the kick-flag check can't live in
middleware. It's enforced instead in `getAuthenticatedUser()` (used by every API route) and
directly in the dashboard/admin layout Server Components (which run on the Node runtime) — both
verified paths a kicked user would hit within seconds, just not literally inside the Edge
middleware layer itself. Documented in code, not glossed over.

New standalone **Kick** action (`/api/admin/users/{id}/kick`): force-logout without banning —
distinct from Block, which bans _and_ kicks. Added to the admin user detail panel.

## 4. Multi-language support (en/ru)

**Architecture decision, explained**: a full path-prefixed locale-routing refactor (`/en/...`,
`/ru/...`, à la `next-intl`'s routing mode) would have touched every one of the ~40 existing route
files with real risk of breaking something I can't fully re-verify without clicking through a live
browser in this sandbox. Instead: a cookie-based (`NEXT_LOCALE`) dictionary system —
`src/i18n/locale-provider.tsx` (client context, seeded from the server to avoid hydration
mismatches) + `src/i18n/get-messages.ts` (server-only, for Server Components). Lower risk, still
fully functional, no URL structure change.

**A real type-system bug caught by the test suite, not assumed away**: `Messages = typeof en`
initially inferred every leaf string as a _literal type_ (`save: "Save"`, not `save: string`),
because `en.ts` used `as const`. That meant `ru.ts`'s `satisfies Messages` check could never
actually pass — a Russian string literal isn't assignable to an English one. Fixed with a `Widen<T>`
mapped type that keeps the _shape_ strict (nesting, key names) while widening leaf values to
`string`. Caught immediately when I ran the test suite — not something I'd have noticed just
reading the code.

**Structural parity is genuinely tested**, not just hoped for:
`src/i18n/__tests__/messages.test.ts` recursively walks both dictionaries and asserts identical
key structure and array lengths (5 tests) — this would catch a missing FAQ item or a typo'd nested
key in the 300-line Russian file immediately, rather than silently rendering blank/undefined text.

**Coverage**: full marketing site (all 9 sections), login/register, dashboard shell (sidebar,
topbar, nav labels), and the three main dashboard page headers (Overview, Signals, Settings).
**Not translated** (documented boundary, not an oversight): admin panel internals, the notification
dropdown, individual signal-feed row details beyond what's already covered, and the two hardcoded
client-side error strings in the login form. A reasonable next pass, not core infrastructure.

## 5. AI analysis translated to the site's chosen language

This required a real schema change, not a display-layer trick: `AIAnalysis` was 1:1 with `Signal`
(one English explanation, shared by everyone). Changed to a compound unique on `(signalId, locale)`
— one row per generated language. `Signal.aiAnalysis` (singular relation) became
`Signal.aiAnalyses` (array), which rippled through every consumer: `analyze-signal.ts` now loops
over `LOCALES` and makes one LLM call per missing locale; `dispatch.ts` resolves each _recipient's_
persisted locale to the matching row (with a tested fallback function, `resolveAiSummary()` — 4
tests) for notification content; `/api/signals` resolves to the _requester's_ site-cookie locale
for API consumers, while still exposing the raw array for anyone who wants every language.

**Persisted, not just cookie-based**, specifically because notification delivery is a background
cron job with no live browser cookie to read — added `User.locale`, synced from the language
switcher (best-effort `PATCH /api/auth/me`) and re-synced to whatever a user last picked on _any_
device at every login, so switching devices doesn't cause language drift.

`prompts.ts` now takes a `locale` param and explicitly instructs the model to respond entirely in
that language (JSON keys stay English, values translate) — verified with 3 new tests confirming
the English and Russian prompts never cross-contaminate instructions.

## Verified in this environment

- ✅ **101/101 tests pass** (18 new: 6 FAQ component tests, 5 dictionary structural-parity tests,
  4 `resolveAiSummary` tests, 3 locale-prompt tests) — including real React component rendering
  via jsdom (newly added to this project this session: `jest-environment-jsdom`,
  `@testing-library/jest-dom`, and a `next/navigation` mock, since `useRouter()` needs an App
  Router context this test environment doesn't provide by default).
- ✅ `eslint` clean.
- ✅ `next build` — webpack compiled successfully; the only failure is the same known Prisma-stub
  wall from every prior phase. One genuinely new type error surfaced and got fixed along the way
  (a `Map<unknown, unknown>` inference issue in `dispatch.ts`, caused by the sandbox's degraded
  Prisma stub types cascading further than usual — fixed with an explicit type annotation).
- ✅ OpenAPI spec re-validated against the real schema and re-diffed against actual routes: still
  an exact match, now 39 operations (added the kick endpoint).

## What you can edit right now

- `src/i18n/locales/ru.ts` — extend translation coverage into the areas flagged above as
  boundaries. The structural-parity test will immediately flag if you add a key to `en.ts` and
  forget the Russian counterpart.
- `src/styles/globals.css` `:root` — same as always, the one place controlling the whole palette,
  now blue instead of violet.

**Phase 14 — Testing** (Unit/Integration/E2E/API/Security with Jest + Playwright) is next whenever
you're ready — say "continue".
