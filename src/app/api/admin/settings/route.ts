import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { requireAdmin } from '@/server/auth/admin-guard';
import { logAdminAction } from '@/server/security/audit-log';

export async function GET(req: NextRequest) {
  const guard = await requireAdmin(req); // ADMIN or MODERATOR can view
  if (!guard.ok) return guard.response;

  const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdmin(req, ['ADMIN']); // only ADMIN can write
  if (!guard.ok) return guard.response;

  const body = await req.json().catch(() => null);
  if (!body?.key || body.value === undefined) {
    return NextResponse.json({ error: 'key and value are required.' }, { status: 400 });
  }

  const setting = await prisma.setting.upsert({
    where: { key: body.key },
    update: { value: body.value, updatedById: guard.user.sub },
    create: { key: body.key, value: body.value, updatedById: guard.user.sub },
  });

  await logAdminAction({
    adminId: guard.user.sub,
    actionType: 'UPDATE_SETTING',
    notes: `${body.key} → ${JSON.stringify(body.value)}`,
  });

  return NextResponse.json({ setting });
}
