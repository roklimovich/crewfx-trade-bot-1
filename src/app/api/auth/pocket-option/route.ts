import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';
import { submitPocketOptionSchema } from '@/lib/validations/auth';
import { logEvent } from '@/server/security/audit-log';

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = submitPocketOptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Pocket Option ID.' }, { status: 400 });
  }

  // Not auto-approved: an admin verifies the submitted ID (Phase 6 admin panel).
  const account = await prisma.pocketOptionAccount.create({
    data: { userId: user.sub, accountId: parsed.data.accountId },
  });

  await logEvent('INFO', 'Pocket Option ID submitted', {
    userId: user.sub,
    context: { accountId: parsed.data.accountId },
  });

  return NextResponse.json(
    { message: 'Submitted for verification.', id: account.id },
    { status: 201 },
  );
}
