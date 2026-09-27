# Setup & Deployment

## 1. Prerequisites
- Node.js 20+ (tested on 24)
- A Supabase project (or any Postgres 14+)

## 2. Supabase connection strings
In Supabase: **Project Settings → Database → Connection string**.

- **Pooled** (port `6543`, host contains `pooler`) → use for `DATABASE_URL` (runtime).
- **Direct** (port `5432`) → use for `DIRECT_URL` (migrations).

```env
DATABASE_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASSWORD@db.xxxxx.supabase.co:5432/postgres"
AUTH_SECRET="<openssl rand -base64 48>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 3. Migrate & seed
```bash
npx prisma migrate dev --name init   # first time (creates migration + applies)
npm run db:seed
```
For CI/production use `npx prisma migrate deploy`.

## 4. Run
```bash
npm run dev
```

## 5. Deploy (Vercel example)
1. Push repo to Git and import into Vercel.
2. Add the four env vars above (use pooled `DATABASE_URL`).
3. Build command: `npm run build` (runs `prisma generate`).
4. Run `npx prisma migrate deploy` as a deploy step / one-off.

## 6. Admin account
The seed creates a super admin. To create one manually, insert a `PlatformAdmin`
row with a bcrypt hash (see `prisma/seed.ts` for the pattern), or add a small
admin-provisioning script.

## Backups
Supabase provides automated daily backups (Pro plan) and PITR. For self-hosted
Postgres, schedule `pg_dump` with a retention policy and test restores. See
docs/SECURITY.md for the disaster-recovery checklist.
