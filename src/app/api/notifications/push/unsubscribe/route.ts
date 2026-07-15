import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = unsubscribeSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload.' }, { status: 400 });

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: parsed.data.endpoint, userId: user.sub },
  });

  return NextResponse.json({ message: 'Unsubscribed.' });
}
