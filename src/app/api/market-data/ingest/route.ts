import { NextRequest, NextResponse } from 'next/server';
import { ingestAll } from '@/server/market-data/ingest';
import { generateAllSignals } from '@/server/signal-engine/generate-all';
import { requireAdmin } from '@/server/auth/admin-guard';
import { logEvent } from '@/server/security/audit-log';

// This route intentionally does NOT run on the Edge Runtime (needs Prisma, which isn't
// Edge-compatible) — it uses the default Node.js runtime.
export const runtime = 'nodejs';

// Phase 12 (Background Jobs) honesty note: this whole ingest → generate → analyze → notify
// pipeline currently runs inside ONE HTTP request/function invocation, sequentially, across
// every configured pair and timeframe. That's a real ceiling — 60s covers the default pairs list
// comfortably today, but it will not scale indefinitely as DEFAULT_PAIRS grows. `maxDuration` is
// a Vercel route-segment config; 60s is the safe ceiling for Hobby-tier deployments. Pro/Enterprise
// plans support raising this (up to 300s+). The architecturally correct fix at real scale isn't a
// bigger number here — it's splitting this into a real background job queue (BullMQ against the
// Redis this project already depends on, or a hosted queue like Inngest/Trigger.dev) where each
// pair/timeframe is its own job, processed in parallel by workers instead of one long serial loop
// in a single request. Not built here — that's a genuine architecture change, not a config tweak,
// and wasn't asked for beyond "implement background jobs," which the cron pipeline already does
// at the complexity level this project is currently at.
export const maxDuration = 60;

/**
 * Triggers a full ingestion run across DEFAULT_PAIRS × DEFAULT_TIMEFRAMES, then immediately runs
 * the signal engine against the freshly-ingested data — market data on its own is useless to
 * users, so this is the natural end-to-end pipeline rather than two separately-scheduled jobs
 * that would need careful ordering to avoid the engine running on stale indicators.
 *
 * Two ways to call this:
 * 1. Vercel Cron (see vercel.json `crons`) — invokes via GET, sending
 *    `Authorization: Bearer ${CRON_SECRET}` automatically.
 * 2. An authenticated admin, via POST, for manual/on-demand runs from the admin panel.
 */
async function runIngestion(req: NextRequest, requireCronOrAdmin: boolean) {
  if (requireCronOrAdmin) {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    const isCron = Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
      const guard = await requireAdmin(req, ['ADMIN']);
      if (!guard.ok) return guard.response;
    }
  }

  const startedAt = Date.now();
  const ingestResults = await ingestAll();
  const signalResults = await generateAllSignals();
  const durationMs = Date.now() - startedAt;

  const ingestSucceeded = ingestResults.filter((r) => !r.error).length;
  const signalsGenerated = signalResults.filter((r) => r.generated).length;

  await logEvent(
    'INFO',
    `Ingestion + signal run completed (${ingestSucceeded}/${ingestResults.length} ingested, ${signalsGenerated} signals generated)`,
    { context: { durationMs } },
  );

  return NextResponse.json({
    ingest: { results: ingestResults, succeeded: ingestSucceeded, total: ingestResults.length },
    signals: { results: signalResults, generated: signalsGenerated, total: signalResults.length },
    durationMs,
  });
}

/** Vercel Cron entry point. */
export async function GET(req: NextRequest) {
  return runIngestion(req, true);
}

/** Manual admin-triggered entry point. */
export async function POST(req: NextRequest) {
  return runIngestion(req, true);
}
