import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db/prisma';
import { requireAdmin } from '@/server/auth/admin-guard';
import { logAdminAction, logEvent } from '@/server/security/audit-log';
import { z } from 'zod';

const updateUserSchema = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().email().optional(),
    role: z.enum(['ADMIN', 'MODERATOR', 'USER']).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update.',
  });

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      role: true,
      telegramAccount: true,
      pocketOptionAccounts: { orderBy: { submittedAt: 'desc' } },
      sessions: { where: { revokedAt: null }, orderBy: { createdAt: 'desc' } },
      referredBy: { select: { id: true, email: true } },
    },
  });

  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    role: user.role.name,
    emailVerified: Boolean(user.emailVerified),
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
    referredBy: user.referredBy,
    telegram: user.telegramAccount,
    pocketOptionAccounts: user.pocketOptionAccounts,
    activeSessions: user.sessions.length,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin(req);
  if (!guard.ok) return guard.response;

  const parsed = updateUserSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    include: { role: true },
  });
  if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

  const { name, email, role } = parsed.data;
  if (role && guard.user.sub === target.id) {
    return NextResponse.json({ error: 'You cannot change your own role.' }, { status: 400 });
  }
  if (role && role !== target.role.name && guard.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admins can change user roles.' }, { status: 403 });
  }

  const nextRole = role ? await prisma.role.findUnique({ where: { name: role } }) : null;
  if (role && !nextRole) {
    return NextResponse.json({ error: 'Role configuration is missing.' }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: target.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(nextRole ? { roleId: nextRole.id } : {}),
      },
      include: { role: true },
    });

    const changedFields = [
      ...(name !== undefined && name !== target.name ? ['name'] : []),
      ...(email !== undefined && email !== target.email ? ['email'] : []),
      ...(role !== undefined && role !== target.role.name ? ['role'] : []),
    ];

    if (role !== undefined && role !== target.role.name) {
      await logAdminAction({
        adminId: guard.user.sub,
        actionType: 'CHANGE_ROLE',
        targetUserId: target.id,
        notes: `${target.role.name} to ${role}`,
      });
    }
    if (changedFields.length > 0) {
      await logEvent('INFO', 'Admin updated user details', {
        userId: target.id,
        context: { adminId: guard.user.sub, changedFields },
      });
    }

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role.name,
    });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ error: 'That email address is already in use.' }, { status: 409 });
    }
    throw error;
  }
}
