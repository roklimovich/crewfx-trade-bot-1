import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { getAuthenticatedUser } from '@/server/auth/request-context';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAuthenticatedUser(req);
  if (!user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const notification = await prisma.notification.findUnique({ where: { id: params.id } });
  if (!notification || notification.userId !== user.sub) {
    return NextResponse.json({ error: 'Notification not found.' }, { status: 404 });
  }

  await prisma.notification.update({
    where: { id: params.id },
    data: { readAt: new Date(), status: 'READ' },
  });

  return NextResponse.json({ message: 'Marked as read.' });
}
