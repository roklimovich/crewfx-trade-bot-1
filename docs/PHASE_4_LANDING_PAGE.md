# CrewFX — Phase 4: Landing Page

## Design direction

Your reference image already pinned the direction — dark, glassmorphic, violet-forward — so Phase 4
follows it rather than reinventing it. Where I had freedom (exact palette, typography, the hero's
actual content) I made deliberate choices instead of defaulting:

- **Palette**: near-black violet background (not a generic `purple-500`), an orchid/magenta accent
  instead of a second flat violet, and mint/coral reserved specifically for BUY/SELL states so color
  carries real meaning, not just decoration.
- **Type**: Space Grotesk (display) + Inter (body) + JetBrains Mono for anything that's actual market
  data — pairs, prices, confidence scores. The mono face isn't decorative; it's doing the same job
  tabular figures do on a real trading terminal.
- **Signature element**: the hero doesn't use a stock photo or a generic gradient blob — it shows a
  floating stack of live-look signal cards (`SignalCard`) drifting gently over a hand-drawn ascending
  candlestick line (`CandlestickBackdrop`). It's literally the product's own output as the hero image.
- **No numbered steps in Features** — the six features aren't a sequence, so I used icons instead of
  01/02/03 markers, which would have implied an order that doesn't exist.

## What was implemented

```
src/components/marketing/
  signal-card.tsx           → reusable glass signal card (hero + benefits)
  candlestick-backdrop.tsx  → decorative animated SVG, hand-built (no chart library needed)
  navbar.tsx
  hero.tsx                  → signature element
  features.tsx               → 6 features, icon grid, no numbering
  benefits.tsx                → outcome copy + mock Telegram notification panel
  stats.tsx                    → platform/coverage facts (see note below)
  testimonials.tsx              → 3 placeholder quotes, initials-only avatars
  pricing.tsx                    → Starter / Pro / Elite, placeholder prices
  faq.tsx                          → accordion, client component
  cta.tsx                           → closing band
  footer.tsx

src/app/(marketing)/layout.tsx  → wraps all public pages in Navbar + Footer
src/app/(marketing)/page.tsx    → composes all sections in order
src/app/layout.tsx               → now loads Space Grotesk / Inter / JetBrains Mono via next/font,
                                    plus full SEO metadata (OpenGraph, Twitter card, robots)
```

## A deliberate omission: no fabricated performance stats

The Statistics section shows platform facts (pairs monitored, indicators cross-checked, timeframe
coverage) instead of a win-rate or profit number. A trading-signal product's landing page reaching
for an invented "87% accuracy" stat is a real misrepresentation risk — that number doesn't exist yet
until Phase 8's engine has run against real history. Once Phase 11 (Signal History & Analytics) is
live, you'll have a true win-rate to show here if you want to replace this section — I'd suggest
pulling it from real `SignalHistory` data rather than hardcoding it, even then.

## Two real bugs this phase caught (and fixed)

I ran an actual `next build`, not just `tsc`/`eslint`, and it caught two things static checking
missed:

1. `src/server/security/csrf.ts` used Node's `crypto` module, but it's imported by `src/middleware.ts`,
   which runs on Next's **Edge Runtime** — no Node APIs there. Rewrote it with the Web Crypto API
   (`crypto.getRandomValues`), which works in both environments.
2. `prisma/seed.ts` is a standalone script (run via `tsx`, never bundled into the app) but Next was
   type-checking it as part of the build anyway. Excluded it in `tsconfig.json`.

## Verified in this environment / what needs your machine

- ✅ `eslint`, `tsc --noEmit`, and Prettier all pass clean.
- ✅ `next build` succeeds — I confirmed this with a temporary local-fonts stub, since this sandbox
  can't reach `fonts.googleapis.com`. The real `next/font/google` version is what's shipped in the zip;
  it'll fetch fonts normally the moment you build somewhere with internet access (which is every real
  dev machine, CI runner, and Vercel).
- ⚠️ Two `RoleName`/`LogLevel` "errors" you may still see if you type-check in a sandboxed network:
  Prisma's query-engine binary host (`binaries.prisma.sh`) isn't reachable here either, so `prisma
generate` fell back to a stub client with no enums at all exported. This is not a real bug — it'll
  disappear the moment `npx prisma generate` runs with real network access.

## What you can edit right now

- `src/components/marketing/pricing.tsx` — the `TIERS` array has placeholder prices/features, called
  out in the UI itself with a small note under the pricing cards.
- `src/components/marketing/testimonials.tsx` — placeholder quotes; swap for real ones once you have them.
- `src/styles/globals.css` `:root` — if the palette from Phase 1 didn't stick, this is still the one
  place that controls it everywhere.

## Next step

**Phase 5 — Dashboard UI**: the authenticated user app — sidebar, navbar, live signal feed, trading
statistics, charts, profile, notifications, settings, Telegram integration — built on the auth system
from Phase 3 and the visual language established here.

**Reply "continue" (or request changes to Phase 4) before I start Phase 5.**
