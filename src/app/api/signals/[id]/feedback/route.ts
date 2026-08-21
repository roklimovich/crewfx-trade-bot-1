import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';

const feedbackSchema = z.object({
  verdict: z.enum(['BAD_SIGNAL', 'LOST']),
  note: z.string().trim().max(500).optional(),
});

/** Stores a trader-labelled example for later, reviewed strategy/model evaluation. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  if (user.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Your account is not active.' }, { status: 403 });
  }

  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid feedback.' }, { status: 400 });

  const signal = await prisma.signal.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!signal) return NextResponse.json({ error: 'Signal not found.' }, { status: 404 });

  const feedback = await prisma.signalFeedback.upsert({
    where: { signalId_userId: { signalId: signal.id, userId: user.sub } },
    update: parsed.data,
    create: { signalId: signal.id, userId: user.sub, ...parsed.data },
  });

  return NextResponse.json({
    feedback: { verdict: feedback.verdict, updatedAt: feedback.updatedAt },
  });
}
