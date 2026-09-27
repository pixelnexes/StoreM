import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Create or update a platform (super) admin.
 *
 * Why this exists: `prisma/seed.ts` hardcodes the password `admin1234` and uses
 * `update: {}`, so re-running the seed will NEVER change an existing admin's
 * password. On a public deployment you must set your own credentials with this
 * script instead of relying on the seed.
 *
 * Usage:
 *   npm run admin:create -- you@example.com 'your-strong-password' "Your Name"
 */
async function main() {
  const [email, password, name] = process.argv.slice(2);

  if (!email || !password) {
    console.error("Usage: npm run admin:create -- <email> <password> [name]");
    process.exit(1);
  }
  if (password.length < 12) {
    console.error('Refusing: password must be at least 12 characters.');
    process.exit(1);
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    console.error(`Refusing: "${email}" is not a valid email address.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    update: { passwordHash, name: name ?? 'Platform Super Admin' },
    create: { email, name: name ?? 'Platform Super Admin', passwordHash },
  });

  console.log(`Super admin ready: ${admin.email}`);
  console.log('Now sign in at /admin/login');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
