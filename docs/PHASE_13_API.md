# CrewFX — Phase 13: API

## What this phase actually is

Phases 3–12 already built ~34 REST route files covering Authentication, Users, Signals, AI, Admin,
Notifications, Analytics, and Market Data. This phase's job wasn't writing new business logic —
it was **formalizing what already exists** into a real, machine-readable specification and
browsable documentation, exactly as your original spec asked for (OpenAPI Specification + Swagger
Documentation).

## What was implemented

```
public/openapi.yaml          → complete OpenAPI 3.0.3 specification, 38 operations across
                                 8 tags (Authentication, Users, Signals, AI, Admin,
                                 Notifications, Analytics, Market Data)

src/components/
  api-docs-viewer.tsx    → the actual SwaggerUI component (client-only)
  api-docs-lazy.tsx        → dynamic-import boundary (see "a real Next.js constraint" below)

src/app/api-docs/page.tsx      → the docs page itself, at /api-docs
src/styles/swagger-dark.css      → dark-theme override so it matches the rest of the app

src/components/marketing/footer.tsx   → added an "API Docs" link so it's actually discoverable
```

## The spec is verified, not just written

I didn't just hand-write YAML and assume it was correct. Three real checks, run against the
actual file:

1. **Parses as valid YAML** and **every `$ref` resolves** — checked with a script that walks the
   entire document.
2. **Validates against the real OpenAPI 3.0 JSON Schema** (via the `openapi-spec-validator`
   Python package). This caught a genuine bug on the first pass: several response `description`
   strings inside YAML flow-mappings (`{ description: ... }`) contained unescaped commas, which
   YAML parsed as _additional mapping keys_ rather than part of the string — e.g. `{ description:
Logged out, cookies cleared }` silently became two keys, `description` and `cookies cleared`,
   instead of one string. Fixed by quoting every affected description; re-validated clean.
3. **Cross-checked against the actual route files on disk** — a script that walks every
   `route.ts`, extracts its real exported HTTP methods and URL path (converting `[id]` to
   `{id}`), and diffs that set against every operation in the spec. Result: **exact 1:1 match,
   zero routes undocumented, zero documented operations that don't exist** — 38 operations on
   both sides.

## A real Next.js App Router constraint, not a style choice

`next/dynamic` with `{ ssr: false }` **cannot be called directly inside a Server Component file**
— Next.js rejects this at build time. `swagger-ui-react` needs `ssr: false` (it reads
`window`/`document`), but the docs page itself is a Server Component (no reason for it not to be).
The fix is `api-docs-lazy.tsx`: a tiny dedicated Client Component whose only job is being the
boundary where `dynamic(..., { ssr: false })` is legal, imported normally by the server-rendered
page. I confirmed this actually works with a real `next build`, not just by reasoning about it —
this is exactly the kind of constraint that only shows up at build time, not in `tsc`.

## The dark theme is a pragmatic hack, not a bespoke Swagger theme

`swagger-dark.css` uses a CSS `filter: invert()` trick to flip Swagger UI's default light theme
dark, rather than a fully custom Swagger UI theme (which would mean overriding dozens of
individual class rules). It's a known, common technique — visually decent, not pixel-perfect. If
you want a fully bespoke dark theme matching CrewFX's exact palette, that's real additional
CSS work beyond what a documentation-formalization phase justified.

## API design conventions, documented once instead of scattered

Rather than repeat "how auth works" and "how CSRF works" in every single endpoint's description,
`public/openapi.yaml`'s top-level `info.description` documents the conventions that apply
platform-wide once: cookie vs. Bearer auth, the CSRF header requirement (and which four endpoints
are exempt, and why), the standard `{ error: string }` error shape, rate limiting, and pagination
shape. Individual endpoints only document what's actually specific to them.

## Verified in this environment

- ✅ OpenAPI spec: valid YAML, all `$ref`s resolve, validates against the real OpenAPI 3.0 schema,
  exact 1:1 match against real route files (all four checks run and passed, not assumed).
- ✅ **83/83 tests still pass** — no regressions from this phase (no application logic changed,
  only documentation + the docs page itself).
- ✅ `eslint` clean, `next build` — webpack compiled successfully, confirming the `ssr: false`
  boundary fix actually works; the only failure is the same known Prisma-stub wall from every
  prior phase.

## What you can edit right now

- `public/openapi.yaml` — this is the single source of truth for `/api-docs`. Any future route
  you add should get a corresponding entry here; nothing regenerates it automatically (that would
  mean adopting a schema-first or code-first generation toolchain, a bigger workflow change than
  this phase's scope).
- Visit `/api-docs` once you're running locally — it's a real interactive Swagger UI, including
  "Try it out" for any endpoint (cookie auth will work automatically if you're logged in via the
  browser in the same tab).

## Next step

**Phase 14 — Testing**: Unit, Integration, End-to-End, API, and Security tests using Jest and
Playwright. This project already has 83 passing Jest unit tests built incrementally since Phase
7 — Phase 14 is where integration tests (hitting real route handlers against a test database) and
Playwright E2E tests (actually driving the browser through login → dashboard → signals) get added
on top.

**Reply "continue" (or request changes to Phase 13) before I start Phase 14.**
