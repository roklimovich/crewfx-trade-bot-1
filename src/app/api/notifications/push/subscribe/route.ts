import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';

const subscribeSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({ p256dh: z.string().min(1), auth: z.string().min(1) }),
});

export async function POST(req: NextRequest) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: 'Invalid subscription payload.' }, { status: 400 });

  await prisma.pushSubscription.upsert({
    where: { endpoint: parsed.data.endpoint },
    update: { userId: user.sub, p256dh: parsed.data.keys.p256dh, auth: parsed.data.keys.auth },
    create: {
      userId: user.sub,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.keys.p256dh,
      auth: parsed.data.keys.auth,
    },
  });

  return NextResponse.json({ message: 'Subscribed to push notifications.' });
}
