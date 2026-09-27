import { PrismaClient } from '@prisma/client';

/**
 * Verify the production database connection BEFORE deploying, so a bad
 * DATABASE_URL shows up here instead of as a confusing 500 on the live site.
 *
 * Run with your real DATABASE_URL:
 *   $env:DATABASE_URL="mysql://..." ; npm run db:check
 *
 * Checks three things, in order:
 *   1. is the server reachable and the credentials accepted?
 *   2. does it answer a trivial query?
 *   3. are the app tables there? (0 tables = the migration has not been imported yet)
 */
const prisma = new PrismaClient();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set. Nothing to test.');
    process.exit(1);
  }
  if (!url.startsWith('mysql://') && !url.startsWith('mariadb://')) {
    console.error('DATABASE_URL must start with mysql:// (this project uses MySQL/MariaDB).');
    console.error('Current value does not — refusing to test.');
    process.exit(1);
  }

  // Never print the real secret — blank out the password between : and @
  const shown = url.replace(/([^:/@]+):([^@]+)@/, '$1:***@');
  console.log(`Testing connection to ${shown}`);

  const [[ping]] = (await prisma.$transaction([
    prisma.$queryRawUnsafe('SELECT 1 AS ok'),
  ])) as { ok: number }[][];
  console.log(`Auth + reachability OK (SELECT 1 => ${ping.ok})`);

  const host = (await prisma.$queryRawUnsafe('SELECT @@hostname AS h, @@version AS v')) as {
    h: string;
    v: string;
  }[];
  console.log(`Server: MariaDB/MySQL ${host[0].v} on ${host[0].h}`);

  const tables = (await prisma.$queryRawUnsafe(
    'SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE() ORDER BY t',
  )) as { t: string }[];
  if (tables.length === 0) {
    console.log('No tables yet — expected until the migration is imported.');
  } else {
    console.log(`Tables present (${tables.length}): ${tables.map((r) => r.t).join(', ')}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('\nConnection FAILED:');
    console.error(e.message?.split('\n').slice(0, 6).join('\n') ?? e);
    await prisma.$disconnect();
    process.exit(1);
  });
