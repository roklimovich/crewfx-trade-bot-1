import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/server/auth/admin-guard';
import { unblockUser, AdminActionError } from '@/server/admin/user-actions';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  try {
    const user = await unblockUser(guard.user.sub, params.id);
    return NextResponse.json({ id: user.id, status: user.status });
  } catch (err) {
    if (err instanceof AdminActionError)
      return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }
}
