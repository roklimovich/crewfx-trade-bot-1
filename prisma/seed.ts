import { PrismaClient, RoleName } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Default roles with baseline permission strings.
  // Permissions are checked in src/server/security (Phase 3) — this table
  // just stores them so they're editable from the admin panel later.
  const adminRole = await prisma.role.upsert({
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

  // --- Bootstrap admin ---
  // Every new registration defaults to role USER, status PENDING, which needs an admin to
  // approve it. Without at least one pre-existing admin, nobody can ever approve the first
  // account. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env to create one here.
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existing) {
      console.log(`Bootstrap admin already exists: ${adminEmail} (left unchanged).`);
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          name: 'Admin',
          roleId: adminRole.id,
          status: 'ACTIVE',
          emailVerified: new Date(),
        },
      });
      console.log(`Bootstrap admin created: ${adminEmail}. Log in, then change this password.`);
    }
  } else {
    console.log(
      'No SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD set — skipping bootstrap admin. ' +
        'Without one, no one can approve the first PENDING user. See docs/PHASE_7 troubleshooting notes.',
    );
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
