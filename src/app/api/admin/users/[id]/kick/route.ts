import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/admin-guard';
import { kickUser, AdminActionError } from '@/server/admin/user-actions';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => ({}));
  try {
    await kickUser(guard.user.sub, params.id, body?.notes);
    return NextResponse.json({ message: 'User kicked.' });
  } catch (err) {
    if (err instanceof AdminActionError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
