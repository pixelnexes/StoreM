# API Reference

All responses use a consistent envelope:

```json
{ "success": true,  "data": { ... } }
{ "success": false, "error": { "code": "INSUFFICIENT_STOCK", "message": "…" } }
```

Protected endpoints require the session cookie set at login. Tenant isolation,
authorization and validation are enforced server-side on every request.

## Auth
| Method | Path | Body | Notes |
|--------|------|------|-------|
| POST | `/api/v1/auth/register` | `name, businessName, phone, email?, password` | Creates tenant + owner + branch + trial; sets session |
| POST | `/api/v1/auth/login` | `phone, password` | Sets session |
| POST | `/api/v1/auth/logout` | — | Clears session |
| POST | `/api/admin/login` | `email, password` | Super-admin session |
| POST | `/api/admin/logout` | — | Clears admin session |

## Products
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/products?q=` | Tenant-scoped list with computed `stock` |
| POST | `/api/v1/products` | Enforces plan product limit; audited |

## Customers
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/customers?q=` | Search by name/phone |
| POST | `/api/v1/customers` | Phone is identity — returns existing (no duplicate). `data.existing` flags it |

## Sales
| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/v1/sales` | Recent sales |
| POST | `/api/v1/sales` | Atomic finalize. Body: `branchId, customerId?, items[], payments[]` |

`POST /api/v1/sales` errors: `INSUFFICIENT_STOCK` (409), `CREDIT_REQUIRES_CUSTOMER`
(422), `PRODUCT_NOT_FOUND` (404), `VALIDATION_ERROR` (422).

## Admin
| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/admin/theme` | `themeKey, brandName?` — platform-wide theme (super admin only) |

## Error codes
`UNAUTHENTICATED` (401), `FORBIDDEN` / `NO_TENANT` (403), `NOT_FOUND` (404),
`VALIDATION_ERROR` (422), `INSUFFICIENT_STOCK` / `*_LIMIT_REACHED` (409),
`INTERNAL_ERROR` (500).
