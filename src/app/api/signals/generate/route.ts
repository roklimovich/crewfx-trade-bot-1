import { NextRequest, NextResponse } from 'next/server';
import { generateAllSignals } from '@/server/signal-engine/generate-all';
import { requireAdmin } from '@/server/auth/admin-guard';

export const runtime = 'nodejs';
export const maxDuration = 60; // same reasoning as src/app/api/market-data/ingest/route.ts

/**
 * Re-runs the signal engine against whatever market data/indicators are already in the DB,
 * without re-fetching from the provider. Useful for testing rule changes or re-running after
 * adjusting `signal.min_confidence_score` in Settings, without burning provider API quota.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req, ['ADMIN']);
  if (!guard.ok) return guard.response;

  const results = await generateAllSignals();
  const generated = results.filter((r) => r.generated).length;

  return NextResponse.json({ results, generated, total: results.length });
}
