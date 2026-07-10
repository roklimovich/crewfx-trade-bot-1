import { PrismaClient, RoleName } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Default roles with baseline permission strings.
  // Permissions are checked in src/server/security (Phase 3) — this table
  // just stores them so they're editable from the admin panel later.
  await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: {
      name: RoleName.ADMIN,
      permissions: [
        'users:read',
        'users:approve',
        'users:reject',
        'users:block',
        'signals:read',
        'signals:delete',
        'logs:read',
        'settings:write',
        'admin-actions:read',
      ],
    },
  });

  await prisma.role.upsert({
    where: { name: RoleName.MODERATOR },
    update: {},
    create: {
      name: RoleName.MODERATOR,
      permissions: ['users:read', 'users:approve', 'users:reject', 'signals:read', 'logs:read'],
    },
  });

  await prisma.role.upsert({
    where: { name: RoleName.USER },
    update: {},
    create: {
      name: RoleName.USER,
      permissions: ['signals:read', 'notifications:read'],
    },
  });

  // Baseline platform settings, editable later from the admin panel (Phase 6).
  const defaultSettings: Record<string, unknown> = {
    'signal.min_confidence_score': 65,
    'signal.default_timeframes': ['M5', 'M15', 'H1'],
    'auth.require_admin_approval': true,
    'notifications.default_channels': ['EMAIL', 'TELEGRAM'],
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as never },
    });
  }

  console.log('Seed complete: roles + default settings created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
