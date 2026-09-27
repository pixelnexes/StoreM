# Architecture

## Layers

```
UI (App Router pages / components)
        │  fetch JSON
API routes  (src/app/api)  ── validate (zod) ── authz (tenant/role guard)
        │
Service layer (src/services)  ── DB transactions, orchestration
        │
Domain layer (src/domain)   ── PURE business logic (no DB, fully tested)
        │
Prisma (src/lib/prisma) → PostgreSQL / Supabase
```

- **Domain layer is pure**: unit conversion, sale totals, split-payment settlement,
  ledger running balances, COGS profit, reconciliation, plan limits, subscription
  access. No I/O → deterministic and unit-tested (TC-001…TC-015).
- **Service layer** composes domain + Prisma inside DB transactions. See
  `src/services/sales.ts` — the atomic POS finalize.
- **API routes** are thin: parse → validate → authorize → call service → envelope.

## Multi-tenancy
Every tenant-scoped model carries `tenantId`. `requireTenant()` derives the tenant
from the signed session cookie — **never** from the request body. Every query is
scoped by `tenantId`, and cross-tenant fetches are rejected by `assertOwned()`
(→ 404). See `src/lib/tenant.ts`. TC-010 verifies the isolation rule.

## Money
All monetary values are integers in **whole PKR** to avoid floating-point drift.
Formatting/parsing lives in `src/lib/money.ts`.

## Inventory
Transaction-based (`InventoryTransaction`, signed quantities). Stock is the sum of
transactions; a denormalized `Inventory.quantity` cache is updated in the same DB
transaction for fast reads. Stock is never blindly overwritten.

## Atomic sale (POS)
`finalizeSale()` runs in `prisma.$transaction`:
1. Validate stock per line (INSUFFICIENT_STOCK on failure)
2. Reserve invoice number (per-tenant sequence)
3. Create sale header
4. Create sale items (capturing `unitCost` for COGS)
5. Create inventory transactions + update stock cache
6. Create payment records
7. Write customer ledger entry for any outstanding (credit) amount

Any failure rolls back the entire transaction — no partial state.

## Theming
Six sober themes are RGB-channel CSS variables in `globals.css`. The active theme
key is stored once in `PlatformSetting` (super-admin controlled) and applied on
`<html data-theme>` in the root layout, so it reaches landing + both portals.

## Sessions
- Store users: `markazos_session` cookie (JWT via `jose`), carries `tenantId`+role.
- Platform admins: separate `markazos_admin` cookie. The two never mix.
