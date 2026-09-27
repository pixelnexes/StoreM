# MARKAZOS
## COMPLETE SAAS SOFTWARE ENGINEERING SPECIFICATION

## 1. OBJECTIVE

Build a production-ready multi-tenant SaaS platform named **MarkazOS**.

The platform must allow independent retail businesses to manage:

- Products
- Inventory
- Purchases
- Sales
- POS
- Customers
- Customer credit/udhaar
- Customer payments
- Suppliers
- Supplier balances
- Expenses
- Invoices
- Receipts
- Cash payments
- Card payments
- Online payments
- Payment terminals
- Reports
- Profit/Loss
- Marketing campaigns
- WhatsApp integrations
- Notifications
- Users
- Roles
- Branches
- Subscriptions
- Billing
- Audit logs

The system must be designed as a **multi-tenant SaaS application** from day one.

---

# 2. CORE ARCHITECTURE

Recommended stack:

### Frontend

Next.js

TypeScript

React

Tailwind CSS

Reusable UI component library.

### Backend

Node.js

TypeScript

REST API or modular API architecture.

### Database

PostgreSQL

ORM:

Prisma or equivalent strongly typed ORM.

### Authentication

Secure session/JWT-based authentication.

Password hashing:

Argon2 or bcrypt.

### Storage

Object storage for:

- Product images
- Store logos
- Invoice PDFs
- Documents

### Background Jobs

Use a queue system for:

- WhatsApp messages
- SMS
- Email
- Scheduled reminders
- Reports
- Campaign processing
- Notifications

---

# 3. MULTI-TENANCY

Every business must have a unique:

`tenant_id`

All tenant-specific records must be associated with a tenant.

No user belonging to Tenant A may access Tenant B's data.

Every backend query involving tenant data must enforce tenant isolation.

Never rely only on frontend restrictions.

---

# 4. USER ROLES

## SUPER ADMIN

Permissions:

- Manage tenants
- Manage plans
- Manage subscriptions
- View platform analytics
- Suspend tenants
- Manage system settings
- View audit logs
- Manage integrations

## STORE OWNER

Permissions:

- Full store management
- Products
- Inventory
- Sales
- Purchases
- Customers
- Suppliers
- Expenses
- Reports
- Marketing
- Staff
- Branches according to plan

## MANAGER

Configurable permissions.

## CASHIER

Default:

- Create sales
- Search products
- Search customers
- Receive payments
- Print invoices

No access to sensitive financial configuration unless explicitly allowed.

---

# 5. DATABASE ENTITIES

Create relational models for:

### Tenant
- id
- name
- business_name
- logo
- phone
- email
- address
- currency
- timezone
- created_at
- updated_at

### User
- id
- tenant_id
- name
- email
- phone
- password_hash
- role_id
- status
- last_login
- created_at

### Role
- id
- tenant_id
- name

### Permission
- id
- name

### RolePermission
- role_id
- permission_id

### Branch
- id
- tenant_id
- name
- address
- phone
- status

### Product
- id
- tenant_id
- category_id
- brand_id
- sku
- barcode
- name
- description
- image
- base_unit
- purchase_price
- selling_price
- wholesale_price
- minimum_stock
- tax_rate
- status

### ProductUnit
- id
- product_id
- unit_name
- conversion_to_base
- selling_price

Example:

1 packet = 10 pieces.

### Inventory
- id
- tenant_id
- branch_id
- product_id
- quantity
- reserved_quantity
- updated_at

### InventoryTransaction
- id
- tenant_id
- branch_id
- product_id
- transaction_type
- quantity
- reference_type
- reference_id
- unit_cost
- created_by
- created_at

Transaction types:

- PURCHASE
- SALE
- RETURN
- ADJUSTMENT
- DAMAGE
- TRANSFER

---

# 6. CUSTOMERS

Customer fields:

- id
- tenant_id
- name
- phone
- whatsapp_phone
- email
- address
- notes
- status
- created_at
- updated_at

Phone should be the primary practical customer identifier.

If phone exists:

Return existing customer.

If phone does not exist:

Allow creation of new customer.

---

# 7. CUSTOMER LEDGER

Customer ledger must record every financial movement.

Types:

- SALE
- PAYMENT
- REFUND
- ADJUSTMENT

Fields:

- customer_id
- reference_id
- debit
- credit
- balance
- date
- notes

Never calculate historical balances only from frontend state.

Ledger must be authoritative.

---

# 8. CREDIT / UDHAAR

A sale can be:

- Fully paid
- Partially paid
- Fully credit

Example:

Sale:

Rs. 5,000

Paid:

Rs. 2,000

Outstanding:

Rs. 3,000

System automatically creates:

Debit = 5,000

Credit = 2,000

Outstanding = 3,000

---

# 9. DUE DATES

Credit sale may contain:

- due_date

System generates reminders.

Reminder schedule configurable:

- Before due date
- On due date
- After due date

Example:

Due date = 10 October

Reminder:

8 October

10 October

12 October

---

# 10. POS

POS must support:

- Product search
- Barcode scanning
- Product quantity
- Unit selection
- Discount
- Tax
- Customer selection
- Credit sale
- Split payment
- Cash
- Card
- Bank
- Online
- Other

POS must update inventory atomically when sale is finalized.

---

# 11. SPLIT PAYMENTS

Example:

Invoice:

Rs. 10,000

Cash:

Rs. 4,000

Card:

Rs. 6,000

The system must save both payment entries.

Total payments must equal invoice amount unless balance is intentionally recorded as credit.

---

# 12. PAYMENT METHODS

Support:

- Cash
- Card
- Bank Transfer
- Online Payment
- Credit
- Other

Payment method must be configurable per tenant.

---

# 13. PAYMENT TERMINALS / CARD MACHINES

Create:

`PaymentTerminal`

Fields:

- id
- tenant_id
- branch_id
- name
- provider
- terminal_identifier
- status

Each card payment can optionally reference a terminal.

Example:

Card Machine 1

Provider:

XYZ Bank

Transaction:

Rs. 8,500

Terminal:

Card Machine 1

---

# 14. PAYMENT RECONCILIATION

Owner must be able to compare:

System card sales

vs

Terminal settlement/report.

Create reconciliation module.

Fields:

- terminal
- date
- expected_amount
- actual_amount
- difference
- notes
- reconciled_by
- reconciled_at

---

# 15. PURCHASES

Purchase flow:

Create purchase.

Select supplier.

Add products.

Add quantities.

Add purchase prices.

Apply discounts/taxes.

Select payment.

Finalize purchase.

Inventory increases.

Supplier ledger updates.

---

# 16. SUPPLIERS

Fields:

- name
- phone
- WhatsApp
- email
- address
- notes

Supplier ledger:

- purchase
- payment
- return
- adjustment

---

# 17. EXPENSES

Expense fields:

- category
- amount
- date
- branch
- payment method
- description
- attachment
- created_by

Categories:

- Rent
- Electricity
- Salary
- Transport
- Marketing
- Internet
- Maintenance
- Other

---

# 18. SALES

Sale entity:

- id
- tenant_id
- branch_id
- invoice_number
- customer_id
- subtotal
- discount
- tax
- total
- paid_amount
- outstanding_amount
- status
- cashier_id
- created_at

Sale items:

- product_id
- quantity
- unit
- unit_price
- discount
- tax
- total

---

# 19. INVOICE

Every finalized sale must generate an invoice.

Invoice number must be unique per tenant/branch according to configuration.

Invoice must contain:

- Store logo
- Store name
- Store address
- Phone
- Invoice number
- Date
- Customer
- Product list
- Quantity
- Price
- Discount
- Tax
- Total
- Paid
- Balance
- Payment method

Invoice actions:

- Print
- Download PDF
- Share
- Send through supported messaging integration

---

# 20. RECEIPTS

Provide thermal receipt layout.

Support standard receipt widths such as:

- 58mm
- 80mm

Receipt should be printer-friendly.

---

# 21. RETURNS

Return flow:

Search original invoice.

Select product.

Enter return quantity.

Calculate refund.

Restore stock where applicable.

Create financial ledger entry.

Keep original sale immutable.

Create separate return transaction.

---

# 22. INVENTORY RULES

Inventory must use transaction-based accounting.

Never simply overwrite stock without recording an inventory transaction.

Example:

Opening:

100

Purchase:

+50

Sale:

-20

Return:

+5

Adjustment:

-2

Current:

133

Every movement must be traceable.

---

# 23. PRODUCT UNITS

Support:

- Piece
- Packet
- Box
- Carton
- Kg
- Gram
- Liter
- Bottle
- Custom unit

Example:

1 Packet = 10 Pieces

If inventory is stored in base unit:

Packet purchase:

8 packets

System converts:

80 pieces.

Sale:

3 pieces

Remaining:

77 pieces.

UI may still display:

7 packets + 7 pieces

if configured.

---

# 24. STOCK TRANSFERS

For multiple branches:

Branch A:

100 units

Transfer:

20

Branch A:

80

Branch B:

+20

Create transfer record.

---

# 25. MARKETING

Campaign entity:

- name
- message
- target_segment
- channel
- scheduled_at
- status
- created_by

Segments:

- All customers
- Active customers
- Inactive customers
- Credit customers
- VIP customers
- High-value customers
- Custom segment

---

# 26. CUSTOMER SEGMENTATION

Allow filters:

- Last purchase date
- Total spending
- Outstanding balance
- Number of purchases
- Customer creation date

Example:

Customers who have not purchased for 60 days.

---

# 27. WHATSAPP

Implement WhatsApp as an integration layer.

Do not hard-code messaging provider logic into sales/business logic.

Create abstraction:

`MessagingProvider`

Possible channels:

- WhatsApp
- SMS
- Email

WhatsApp should be optional.

If unavailable, core system must continue working.

Message types:

- Invoice
- Payment receipt
- Credit reminder
- Marketing campaign
- Promotional offer

Track:

- queued
- sent
- delivered where provider supports it
- failed

---

# 28. NOTIFICATION SYSTEM

Notification entity:

- recipient
- channel
- type
- status
- message
- scheduled_at
- sent_at
- failure_reason

Use background workers for scheduled notifications.

---

# 29. REPORTS

Dashboard reports:

### Sales
- Today
- This week
- This month
- Custom date

### Purchases

### Expenses

### Profit

### Credit

### Payments

### Inventory

### Customers

---

# 30. PROFIT CALCULATION

At minimum:

Revenue

minus Cost of Goods Sold

equals Gross Profit.

Gross Profit

minus Operating Expenses

equals Net Profit.

Do not calculate profit simply as:

Sales - Purchases

because inventory purchased in one period may be sold in another period.

Use proper COGS logic.

---

# 31. DASHBOARD

Owner dashboard:

- Today's sales
- Today's purchases
- Today's expenses
- Gross profit
- Outstanding customer credit
- Supplier payable
- Low stock
- Recent sales
- Recent payments

Charts:

- Sales over time
- Expenses over time
- Profit over time
- Payment method breakdown

---

# 32. SEARCH

Global search must support:

- Product
- SKU
- Barcode
- Customer
- Phone
- Invoice
- Supplier

Search must be fast and indexed.

---

# 33. AUDIT LOG

Record important actions:

- Login
- Logout
- Product creation
- Product edit
- Stock adjustment
- Sale
- Return
- Payment
- Customer creation
- Expense creation
- User creation
- Permission change
- Subscription change

Record:

- user
- tenant
- action
- entity
- entity_id
- old_value where appropriate
- new_value where appropriate
- timestamp
- IP/device metadata where legally appropriate

---

# 34. SUBSCRIPTION SYSTEM

Entities:

Plan

Subscription

SubscriptionInvoice

SubscriptionPayment

Plan features should be configurable.

Example feature flags:

- inventory
- pos
- credit
- reports
- marketing
- whatsapp
- branches
- advanced_reports
- staff_limit
- product_limit
- customer_limit

---

# 35. PLAN ENFORCEMENT

Backend must enforce limits.

Example:

Starter:

Staff limit = 2

If owner attempts third staff:

Return:

`STAFF_LIMIT_REACHED`

Frontend displays upgrade option.

Never enforce subscription limits only in frontend.

---

# 36. SUBSCRIPTION STATES

- TRIAL
- ACTIVE
- PAST_DUE
- EXPIRED
- CANCELLED
- SUSPENDED

Grace period configurable.

---

# 37. SUPER ADMIN PORTAL

Admin dashboard:

- Total tenants
- Active tenants
- Trial tenants
- Expired tenants
- Monthly recurring revenue
- New registrations
- Subscription renewals
- Most used features
- Message usage
- System health

Tenant management:

Search tenant.

Open tenant.

View subscription.

Suspend.

Reactivate.

Change plan.

---

# 38. STORE OWNER PORTAL

Main navigation:

Dashboard

POS

Sales

Purchases

Inventory

Customers

Suppliers

Khata

Expenses

Invoices

Payments

Marketing

Reports

Staff

Branches

Settings

Subscription

---

# 39. SETTINGS

Store settings:

- Business name
- Logo
- Address
- Phone
- Invoice settings
- Tax settings
- Currency
- Timezone
- Receipt settings
- Payment methods
- Notification settings

---

# 40. API DESIGN

Use versioned API:

`/api/v1/...`

Examples:

`POST /api/v1/auth/login`

`POST /api/v1/products`

`GET /api/v1/products`

`POST /api/v1/sales`

`GET /api/v1/sales/:id`

`POST /api/v1/customers`

`GET /api/v1/customers/:id/ledger`

`POST /api/v1/payments`

`POST /api/v1/invoices`

`POST /api/v1/campaigns`

All protected endpoints must enforce:

Authentication

Authorization

Tenant isolation

Validation

Rate limits where required.

---

# 41. VALIDATION

Use server-side validation for every API input.

Validate:

- Phone numbers
- Amounts
- Quantities
- Dates
- IDs
- Permissions
- Subscription limits

Never trust client input.

---

# 42. TRANSACTIONS

Critical financial operations must use database transactions.

Sale finalization must atomically:

1. Validate stock.
2. Create sale.
3. Create sale items.
4. Create payment records.
5. Update inventory.
6. Create inventory transactions.
7. Update customer ledger if credit.
8. Generate invoice record.

If any critical step fails:

Rollback the complete transaction.

---

# 43. CONCURRENCY

Prevent overselling when two cashiers sell the same product simultaneously.

Use:

- Database transactions
- Row-level locking where appropriate
- Atomic stock updates

---

# 44. FILE STORAGE

Store:

- Product images
- Logos
- Invoice PDFs
- Expense attachments

Use object storage.

Database should store metadata and file URL/key, not large binary files.

---

# 45. BACKUPS

Automated database backups.

Define:

- Backup schedule
- Retention policy
- Restore procedure

Production deployment must include documented disaster recovery.

---

# 46. SECURITY REQUIREMENTS

Implement:

- Password hashing
- Secure sessions
- HTTPS
- Input validation
- SQL injection protection
- XSS protection
- CSRF protection where applicable
- Rate limiting
- Role-based access control
- Tenant isolation
- Audit logs
- Secure secrets management

Never store plaintext passwords.

---

# 47. UI/UX REQUIREMENTS

The UI should be:

- Clean
- Fast
- Responsive
- Mobile-friendly
- Keyboard-friendly for POS
- Accessible
- Consistent

POS should prioritize speed.

Cashier should be able to complete a basic sale in minimal clicks.

---

# 48. MOBILE

Application should be responsive first.

On mobile:

- Dashboard
- Sales
- Customers
- Khata
- Inventory
- Reports

must remain usable.

---

# 49. ERROR HANDLING

Every API must return predictable errors.

Example:

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_STOCK",
    "message": "Requested quantity is greater than available stock."
  }
}
```

Do not expose internal stack traces to users.

---

# 50. TESTING STRATEGY

Implement:

### Unit Tests

Test:

- Price calculations
- Discount calculations
- Tax
- Stock conversion
- Credit balance
- Payment split
- Profit calculations

### Integration Tests

Test:

- Sale + inventory
- Sale + credit ledger
- Purchase + inventory
- Return + inventory
- Payment + ledger
- Subscription enforcement

### E2E Tests

Test:

1. Registration
2. Store creation
3. Product creation
4. Customer creation
5. Purchase
6. Sale
7. Partial payment
8. Credit sale
9. Invoice generation
10. Return
11. Expense
12. Reports
13. Subscription upgrade

---

# 51. CRITICAL TEST CASES

## TC-001 Product Creation

Given valid product data.

When owner creates product.

Then product appears in inventory.

---

## TC-002 Unit Conversion

Given:

1 packet = 10 pieces.

Add:

8 packets.

Expected:

80 base units.

---

## TC-003 Sale

Stock:

100

Sale:

10

Expected:

90

---

## TC-004 Insufficient Stock

Stock:

5

Sale:

10

Expected:

Sale blocked.

Error:

INSUFFICIENT_STOCK

---

## TC-005 Credit Sale

Sale:

5,000

Payment:

2,000

Expected:

Outstanding:

3,000

---

## TC-006 Customer Existing

Input existing phone.

Expected:

Existing customer selected.

No duplicate customer created.

---

## TC-007 New Customer

Input new phone.

Expected:

System offers/create new customer.

---

## TC-008 Split Payment

Invoice:

10,000

Cash:

4,000

Card:

6,000

Expected:

Total payment:

10,000

---

## TC-009 Return

Sale:

10 units

Return:

2

Expected stock:

+2

Financial return entry created.

---

## TC-010 Tenant Isolation

Tenant A attempts to access Tenant B product.

Expected:

403/404.

No data leakage.

---

## TC-011 Subscription Limit

Plan limit:

2 staff.

Existing:

2 staff.

Attempt:

third staff.

Expected:

Blocked.

---

## TC-012 Expired Subscription

Subscription expired.

Expected:

Restricted application access according to defined grace-period policy.

Data remains preserved.

---

## TC-013 Profit

Sales:

100,000

COGS:

60,000

Expenses:

10,000

Expected:

Gross Profit:

40,000

Net Profit:

30,000

---

## TC-014 Payment Reconciliation

System:

100,000

Terminal:

98,500

Expected:

Difference:

-1,500

---

## TC-015 Audit Log

User changes product price.

Expected:

Audit entry created.

---

# 52. ACCEPTANCE CRITERIA

Software is considered ready only when:

- All core modules work.
- No cross-tenant data leakage.
- Financial calculations are correct.
- Inventory calculations are correct.
- POS works reliably.
- Invoices generate correctly.
- Reports reconcile with underlying transactions.
- Subscription limits work server-side.
- Permissions work.
- Audit logs work.
- Backup strategy exists.
- Automated tests pass.
- Production build succeeds.
- No critical security vulnerabilities remain.

---

# 53. DEVELOPMENT ORDER

AI/development team MUST NOT attempt to build everything randomly.

Build in this order:

### Sprint 1
Project setup

Authentication

Tenant architecture

Database

Roles

Permissions

### Sprint 2
Products

Categories

Units

Inventory

### Sprint 3
Customers

Suppliers

Customer ledger

Supplier ledger

### Sprint 4
POS

Sales

Payments

Invoices

### Sprint 5
Purchases

Returns

Expenses

### Sprint 6
Reports

Dashboard

Profit/Loss

### Sprint 7
Marketing

Notifications

WhatsApp integration layer

### Sprint 8
Subscriptions

Billing

Plan limits

### Sprint 9
Admin portal

### Sprint 10
Testing

Security

Performance

Production deployment

---

# 54. DEVELOPMENT RULE FOR AI

AI developer must follow these rules:

1. Do not create fake functionality.
2. Do not hard-code financial calculations in frontend.
3. Do not trust frontend validation.
4. Do not mix tenant data.
5. Do not create duplicate business logic.
6. Keep business logic in service/domain layer.
7. Use reusable components.
8. Write tests alongside critical features.
9. Use migrations for database changes.
10. Never silently modify financial records.
11. Use immutable transaction records where appropriate.
12. Maintain audit history.
13. Use environment variables for secrets.
14. Document every external integration.
15. Never expose private API keys.
16. Do not delete financial history when editing transactions; use adjustments/reversals where appropriate.

---

# 55. REQUIRED DELIVERABLES

Development must deliver:

1. Source code
2. Database schema
3. Database migrations
4. API documentation
5. Environment variable documentation
6. Setup instructions
7. Deployment instructions
8. Test suite
9. Seed data
10. Admin account creation procedure
11. User documentation
12. Architecture documentation
13. Security checklist
14. Backup/restore documentation

---

# 56. DEMO DATA

Create seed data:

Store:

Ubaer General Store

Products:

- Lollipop
- Biscuits
- Chips
- Cold Drink
- Chocolate

Customers:

- Junaid Bhai
- Ahmed
- Ali
- Usman

Payment methods:

- Cash
- Card
- Bank Transfer
- Credit

Payment terminal:

Card Machine 1

Use realistic demo transactions.

---

# 57. FINAL PRODUCT FLOW

New owner:

Register

↓

Create Store

↓

Choose Plan

↓

Dashboard

↓

Add Products

↓

Add Customers

↓

Add Suppliers

↓

Start Purchase

↓

Inventory increases

↓

Customer buys

↓

POS sale

↓

Payment selected

↓

Invoice generated

↓

Inventory decreases

↓

If credit:

Customer ledger updated

↓

Due date reminder

↓

Payment received

↓

Ledger updated

↓

Month-end:

Sales

Purchases

Expenses

COGS

Profit

Outstanding Credit

Reports

---

# 58. FINAL REQUIREMENT

Build MarkazOS as a production-grade SaaS product, not as a static demo.

Every important feature must have:

- UI
- Backend logic
- Database model
- API
- Validation
- Permissions
- Error handling
- Auditability
- Automated tests

The architecture must allow the system to scale from:

1 store

to

100 stores

to

1,000+ stores

without rewriting the core product architecture.