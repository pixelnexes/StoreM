# MarkazOS

**Complete multi-tenant retail & store management SaaS** — inventory, POS, udhaar/khata, customers, payments, invoices, reports, marketing and a super-admin platform portal. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS and Prisma on Postgres (Supabase-ready).

Tagline: _Aapka Store. Aapka Khata. Aapka Business — Ek Jagah._

---

## What's inside

| Area | Route | Notes |
|------|-------|-------|
| Marketing landing | `/` | Simple, animated, theme-aware |
| Store-owner portal | `/app` | Dashboard, POS, Sales, Inventory, Customers, Khata, Reports, Settings |
| Super-admin portal | `/admin` | Platform stats, tenant list, **sober theme selector** |
| Auth | `/login`, `/admin/login` | Store users vs platform admins (separate sessions) |
| API | `/api/v1/*`, `/api/admin/*` | JSON envelope, validated, tenant-isolated |

- **Pure domain layer** (`src/domain`) holds all money/inventory/profit logic as testable functions. **22 passing tests** cover spec cases TC-001…TC-015.
- **Multi-tenancy** enforced server-side (`src/lib/tenant.ts`) — never trusts the client.
- **Theme** is chosen by the super admin and applied platform-wide via CSS variables (6 sober themes).

## Quick start

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#   → paste your Supabase connection strings + a random AUTH_SECRET

# 3. Create the schema on your database
npx prisma migrate deploy    # or: npx prisma migrate dev  (first time)

# 4. Seed demo data (Ubaer General Store)
npm run db:seed

# 5. Run
npm run dev                  # http://localhost:3000
```

### Demo credentials (after seeding)

| Role | Login | Password |
|------|-------|----------|
| Super Admin | `superadmin@markazos.app` | `admin1234` |
| Store Owner | `03001234567` | `owner1234` |
| Cashier | `03007654321` | `cashier1234` |

> ⚠️ Change these before any real deployment.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (runs `prisma generate`) |
| `npm test` | Run the domain test suite (Vitest) |
| `npm run test:e2e` | Playwright E2E (needs running app + DB) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run prisma:migrate` | Create/apply a migration |
| `npm run db:seed` | Seed demo data |

## Documentation

- [docs/SETUP.md](docs/SETUP.md) — Supabase setup, environment, deployment
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — layers, multi-tenancy, transactions
- [docs/API.md](docs/API.md) — endpoint reference
- [docs/SECURITY.md](docs/SECURITY.md) — security checklist

## Testing status

- ✅ Unit / domain tests (TC-001…TC-015): **22 passing**
- ✅ TypeScript: **no errors**
- 🟡 E2E: scaffolded (`e2e/`) — run against a seeded database
- 🟡 Integration (DB-backed): sale service is transaction-safe; run with a test DB

Build order and sprint plan follow the source specification in the two `*.md` spec files at the repo root.
"# StoreM-by-Zoqonyx" 
