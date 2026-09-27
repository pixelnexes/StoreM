# Security Checklist

## Implemented
- [x] Password hashing (bcrypt, cost 12) — no plaintext passwords stored
- [x] Signed, httpOnly, sameSite session cookies (JWT via `jose`); `secure` in prod
- [x] Separate sessions for store users vs platform admins
- [x] Multi-tenant isolation enforced server-side on every query (`requireTenant`, `assertOwned`)
- [x] Role checks (`requireRole`) for privileged actions
- [x] Server-side input validation on every endpoint (zod)
- [x] Server-side plan-limit enforcement (never client-only)
- [x] Parameterized queries via Prisma (SQL-injection safe)
- [x] Financial ops in DB transactions with rollback (no partial writes)
- [x] Audit logging of sensitive actions (login, product/customer/sale changes)
- [x] Secrets in environment variables only; never shipped to the client
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- [x] Immutable inventory & ledger records (append-only, use reversals not edits)

## Before production
- [ ] Rotate all seed credentials
- [ ] Set a strong `AUTH_SECRET` (48+ random bytes)
- [ ] Enforce HTTPS at the edge/host
- [ ] Add rate limiting on `/api/v1/auth/*` and other write endpoints
- [ ] Add CSRF protection for any non-JSON/form flows
- [ ] Configure DB backups + tested restore (disaster recovery)
- [ ] Review Supabase Row Level Security if the DB is reached from other clients
- [ ] Pen-test tenant isolation and payment flows

## Data-handling rules (enforced in code / to uphold in review)
- Never compute authoritative balances or profit from client state.
- Never delete financial history; record adjustments/reversals.
- Never expose internal stack traces to users (generic `INTERNAL_ERROR`).
