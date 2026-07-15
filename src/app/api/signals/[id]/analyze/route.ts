import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { requireAdmin } from '@/server/auth/admin-guard';
import { analyzeSignal } from '@/server/ai/analyze-signal';

/**
 * POST /api/signals/[id]/analyze — generate AI analysis for a signal that doesn't have one yet
 * (e.g. it was created before ANTHROPIC_API_KEY was configured), or pass ?force=true to delete
 * an existing analysis and regenerate it (useful after changing the prompt).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req, ['ADMIN']);
  if (!guard.ok) return guard.response;

  const force = req.nextUrl.searchParams.get('force') === 'true';
  if (force) {
    await prisma.aIAnalysis.deleteMany({ where: { signalId: params.id } });
  }

  const result = await analyzeSignal(params.id);
  if (!result.analyzed) {
    return NextResponse.json(
      { error: result.reason ?? 'Analysis was not performed.' },
      { status: 422 },
    );
  }

  return NextResponse.json(result);
}
