import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/admin-guard';
import { blockUser, AdminActionError } from '@/server/admin/user-actions';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  try {
    const user = await blockUser(guard.user.sub, params.id, body?.notes);
    return NextResponse.json({ id: user.id, status: user.status });
  } catch (err) {
    if (err instanceof AdminActionError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
