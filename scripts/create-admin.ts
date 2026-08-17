import { PrismaClient, RoleName, UserStatus } from '@prisma/client';
import { hashPassword } from '../src/server/auth/password';

const prisma = new PrismaClient();

function parseArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((arg) => arg.startsWith(prefix));
  return arg?.slice(prefix.length);
}

function usage(): never {
  console.error(`
Usage:
  npx tsx scripts/create-admin.ts --email=admin@example.com --password=YourP@ssw0rd --name="Admin User"

Options:
  --email      Admin user email (required)
  --password   Admin user password (required)
  --name       Admin user full name (optional)
`);
  process.exit(1);
}

async function main() {
  const email = parseArg('email');
  const password = parseArg('password');
  const name = parseArg('name') ?? 'Admin';

  if (!email || !password) {
    usage();
  }

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

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      passwordHash,
      emailVerified: new Date(),
      status: UserStatus.ACTIVE,
      roleId: adminRole.id,
    },
    create: {
      email,
      name,
      passwordHash,
      emailVerified: new Date(),
      status: UserStatus.ACTIVE,
      roleId: adminRole.id,
      twoFactorEnabled: false,
    },
  });

  console.log(
    `Admin user created/updated successfully:\n  email: ${user.email}\n  id: ${user.id}\n  role: ${adminRole.name}`,
  );
}

main()
  .catch((error) => {
    console.error('Failed to create admin user:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
