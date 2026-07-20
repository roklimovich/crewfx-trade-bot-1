import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db/prisma';
import { requireAdmin } from '@/server/auth/admin-guard';
import { logEvent } from '@/server/security/audit-log';

const updatePocketOptionSchema = z.object({
  accountId: z.string().trim().min(3).max(64),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; accountId: string } },
) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const parsed = updatePocketOptionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Pocket Option ID must be 3–64 characters.' },
      { status: 400 },
    );
  }

  const account = await prisma.pocketOptionAccount.findUnique({ where: { id: params.accountId } });
  if (!account || account.userId !== params.id) {
    return NextResponse.json({ error: 'Pocket Option account not found.' }, { status: 404 });
  }

  try {
    const updated = await prisma.pocketOptionAccount.update({
      where: { id: account.id },
      data: {
        accountId: parsed.data.accountId,
        verified: false,
        verifiedAt: null,
      },
    });
    await logEvent('SECURITY', 'Admin changed Pocket Option ID', {
      userId: account.userId,
      context: {
        adminId: guard.user.sub,
        previousAccountId: account.accountId,
        accountId: updated.accountId,
      },
    });

    return NextResponse.json({
      id: updated.id,
      accountId: updated.accountId,
      verified: updated.verified,
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This Pocket Option ID is already assigned to this user.' },
        { status: 409 },
      );
    }
    throw error;
  }
}
