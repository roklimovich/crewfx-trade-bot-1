# CrewFX — Phase 9: AI Analysis Module

## The core design constraint: support, never replace

Your original spec was explicit — "The AI should support the rule-based engine, not replace it."
This isn't just a prompt instruction here; it's structural:

- `analyzeSignal()` runs **after** `generateSignalForPairTimeframe()` has already committed the
  `Signal` row — direction, entry price, confidence score, and risk level are already final and
  in the database before the AI ever sees them.
- The AI's output is stored on a **separate table** (`AIAnalysis`), never written back onto
  `Signal`. There is no code path where the AI's opinion can change what was already decided.
- `AIAnalysis.confidenceEstimate` is the AI's own qualitative read — explicitly documented (in
  the schema comment, the prompt, and here) as commentary, not a competing score. The number that
  decided whether the signal was worth publishing at all was `Signal.confidenceScore`, computed
  entirely by Phase 8's rule engine.
- The system prompt directly instructs the model: don't suggest a different direction/price/score,
  don't present your own analysis as the source of the signal, don't give position-sizing advice,
  don't guarantee outcomes. Verified by a test (`prompts.test.ts`) that actually checks those
  instructions are present in the compiled prompt, not just that I intended to write them.

## What was implemented

```
src/server/ai/
  client.ts             → Anthropic SDK singleton, isAiAnalysisEnabled() for graceful skipping
  prompts.ts              → buildAnalysisPrompt() — pure function, the "don't override" rules
                             live in the system prompt string itself
  schema.ts                 → zod validation for the model's JSON response; parseAiAnalysisResponse()
                               returns null (never throws) on anything malformed
  analyze-signal.ts           → orchestrator: fetch Signal → call model → validate → store
                                 AIAnalysis. Entire body is one try/catch — a failure here is
                                 always non-fatal to the signal, which stays fully valid without one.

  __tests__/
    schema.test.ts    → 6 tests: valid parse, markdown-fence stripping, malformed JSON, missing
                         fields, out-of-range confidence, fields too short to be meaningful
    prompts.test.ts     → 4 tests: confirms the "don't override" and "no investment advice"
                           instructions are actually in the prompt, and that real signal values
                           (not placeholders) get embedded

src/app/api/signals/[id]/analyze/route.ts   → admin-only manual trigger, with ?force=true to
                                                regenerate an existing analysis (e.g. after a
                                                prompt change)

src/server/signal-engine/generate-signal.ts   → now awaits analyzeSignal() right after creating
                                                  each signal (see serverless note below)
```

## Why `await`, not fire-and-forget

The natural instinct is to kick off the AI call and not make the user (or the cron job) wait for
it. I didn't do that: on serverless platforms (Vercel, where this is meant to deploy), a function
can be **frozen the instant its response is sent** — any detached `async` work still in flight at
that moment may simply never finish. So `generateSignalForPairTimeframe()` awaits
`analyzeSignal()` before returning. This makes each signal-generation cycle slightly slower (one
LLM call per newly-created signal, sequentially), which is an acceptable tradeoff here since this
whole pipeline already runs from a cron job, not an interactive user request — nobody's staring at
a loading spinner waiting for it.

## Verified in this environment

- ✅ **45/45 tests pass** (35 from Phases 7–8, plus 10 new this phase) — all pure functions, zero
  network dependency. I could not test an actual live call to the Anthropic API from this sandbox
  (no network access to `api.anthropic.com` here), but everything _around_ that call — prompt
  construction, response validation, graceful-skip behavior when unconfigured — is genuinely
  tested, not just written.
- ✅ `eslint` clean, `next build` webpack-compiles successfully (same known Prisma-stub wall on
  the type-check pass as every prior phase).

## What you can edit right now

- `.env` → `ANTHROPIC_MODEL` (defaults to `claude-sonnet-5`) — swap to a faster/cheaper or more
  capable model without touching code.
- `src/server/ai/prompts.ts` → the `SYSTEM_PROMPT` constant is the entire behavioral contract for
  the AI layer. If you want a different tone (more technical, more casual) or additional
  constraints, this is the one place to change it — and `prompts.test.ts` will tell you
  immediately if an edit accidentally removes one of the "don't override the engine" guardrails.

## Next step

**Phase 10 — Notifications**: Telegram bot delivery, email notifications, push/browser
notifications, and real-time updates via WebSockets or Server-Sent Events — this is what turns a
generated `Signal` (now with its `AIAnalysis` explanation attached) into something a user actually
sees the moment it fires, rather than something they'd have to go check the dashboard for.

**Reply "continue" (or request changes to Phase 9) before I start Phase 10.**
