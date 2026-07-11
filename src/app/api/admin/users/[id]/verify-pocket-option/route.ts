import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/admin-guard';
import { verifyPocketOptionAccount, AdminActionError } from '@/server/admin/user-actions';

/** Body: { pocketOptionAccountId: string } — a user may submit more than one ID, so we verify a specific row. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  if (!body?.pocketOptionAccountId) {
    return NextResponse.json({ error: 'pocketOptionAccountId is required.' }, { status: 400 });
  }

  try {
    const account = await verifyPocketOptionAccount(
      guard.user.sub,
      params.id,
      body.pocketOptionAccountId,
    );
    return NextResponse.json({ id: account.id, verified: account.verified });
  } catch (err) {
    if (err instanceof AdminActionError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
