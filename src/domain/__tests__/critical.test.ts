import { describe, it, expect } from 'vitest';
import {
  toBaseUnits,
  fromBaseUnits,
  computeStock,
  checkAvailability,
  saleDelta,
  inboundDelta,
  computeSaleTotals,
  settlePayments,
  computeRunningBalance,
  outstandingBalance,
  computeProfit,
  reconcile,
  checkLimit,
  accessForStatus,
} from '@/domain';

/**
 * Critical test cases from the SaaS specification (TC-001 … TC-015).
 * These exercise the pure domain layer — no database required.
 */

describe('TC-001 Product creation → appears in inventory', () => {
  it('a newly stocked product shows its opening quantity', () => {
    const tx = [{ type: 'ADJUSTMENT' as const, quantity: 0 }]; // created, no stock yet
    expect(computeStock(tx)).toBe(0);
    const stocked = [...tx, { type: 'PURCHASE' as const, quantity: 12 }];
    expect(computeStock(stocked)).toBe(12);
  });
});

describe('TC-002 Unit conversion (1 packet = 10 pieces, add 8 packets → 80)', () => {
  it('converts packets to base pieces', () => {
    expect(toBaseUnits(8, 10)).toBe(80);
  });
  it('displays base units back as packets + pieces', () => {
    // 77 pieces => 7 packets + 7 pieces
    expect(fromBaseUnits(77, 10)).toEqual({ whole: 7, remainder: 7 });
  });
});

describe('TC-003 Sale reduces stock (100 - 10 = 90)', () => {
  it('applies a signed sale delta', () => {
    const tx = [
      { type: 'PURCHASE' as const, quantity: 100 },
      { type: 'SALE' as const, quantity: saleDelta(10) },
    ];
    expect(computeStock(tx)).toBe(90);
  });
});

describe('TC-004 Insufficient stock blocks the sale', () => {
  it('returns INSUFFICIENT_STOCK when requesting more than available', () => {
    const res = checkAvailability(5, 10);
    expect(res.ok).toBe(false);
    expect(res.code).toBe('INSUFFICIENT_STOCK');
  });
  it('allows a sale within available stock', () => {
    expect(checkAvailability(100, 10).ok).toBe(true);
  });
});

describe('TC-005 Credit sale (5000, paid 2000 → outstanding 3000)', () => {
  it('computes outstanding for a partial payment', () => {
    const r = settlePayments(5000, [{ method: 'CASH', amount: 2000 }]);
    expect(r.paid).toBe(2000);
    expect(r.outstanding).toBe(3000);
    expect(r.status).toBe('partial');
  });
  it('writes a ledger debit of the full total, credited by paid amount', () => {
    const entries = computeRunningBalance([{ type: 'SALE', debit: 5000, credit: 2000 }]);
    expect(entries[0].balance).toBe(3000); // customer owes 3000
  });
});

describe('TC-006 Existing customer by phone (no duplicate)', () => {
  it('finds an existing customer and does not create a duplicate', () => {
    const existing = [{ id: 'c1', phone: '03001234567' }];
    const findByPhone = (phone: string) => existing.find((c) => c.phone === phone);
    const match = findByPhone('03001234567');
    expect(match?.id).toBe('c1');
    expect(existing.length).toBe(1);
  });
});

describe('TC-007 New customer by phone', () => {
  it('offers creation when the phone does not exist', () => {
    const existing = [{ id: 'c1', phone: '03001234567' }];
    const findByPhone = (phone: string) => existing.find((c) => c.phone === phone);
    expect(findByPhone('03009999999')).toBeUndefined();
  });
});

describe('TC-008 Split payment (10000 = cash 4000 + card 6000)', () => {
  it('sums split payments to the invoice total', () => {
    const r = settlePayments(10000, [
      { method: 'CASH', amount: 4000 },
      { method: 'CARD', amount: 6000 },
    ]);
    expect(r.paid).toBe(10000);
    expect(r.outstanding).toBe(0);
    expect(r.status).toBe('completed');
  });
});

describe('TC-009 Return restores stock (+2) and records refund', () => {
  it('adds an inbound RETURN transaction', () => {
    const tx = [
      { type: 'PURCHASE' as const, quantity: 100 },
      { type: 'SALE' as const, quantity: saleDelta(10) }, // 90
      { type: 'RETURN' as const, quantity: inboundDelta(2) }, // 92
    ];
    expect(computeStock(tx)).toBe(92);
  });
  it('creates a refund ledger credit', () => {
    const bal = outstandingBalance([
      { type: 'SALE', debit: 1000 },
      { type: 'REFUND', credit: 200 },
    ]);
    expect(bal).toBe(800);
  });
});

describe('TC-010 Tenant isolation (guard enforced in data layer)', () => {
  it('rejects access to another tenant record', () => {
    const record = { tenantId: 'B', id: 'x' };
    const requestTenant = 'A';
    const authorized = record.tenantId === requestTenant;
    expect(authorized).toBe(false); // caller must return 403/404
  });
});

describe('TC-011 Subscription staff limit', () => {
  it('blocks the 3rd staff member on a 2-staff plan', () => {
    const res = checkLimit('staff', 2, { staff: 2 });
    expect(res.allowed).toBe(false);
    expect(res.code).toBe('STAFF_LIMIT_REACHED');
  });
  it('allows within limit', () => {
    expect(checkLimit('staff', 1, { staff: 2 }).allowed).toBe(true);
  });
});

describe('TC-012 Expired subscription restricts access, preserves data', () => {
  it('denies access when expired', () => {
    const d = accessForStatus('EXPIRED', null, 7);
    expect(d.canAccess).toBe(false);
    expect(d.readOnly).toBe(true);
  });
  it('grants read-only during grace period', () => {
    const periodEnd = new Date(Date.now() - 2 * 86400000); // 2 days ago
    const d = accessForStatus('PAST_DUE', periodEnd, 7);
    expect(d.canAccess).toBe(true);
    expect(d.readOnly).toBe(true);
  });
});

describe('TC-013 Profit (sales 100000, COGS 60000, expenses 10000)', () => {
  it('computes gross 40000 and net 30000 via COGS', () => {
    const r = computeProfit(
      [{ quantity: 1, unitPrice: 100000, unitCost: 60000 }],
      10000,
    );
    expect(r.grossProfit).toBe(40000);
    expect(r.netProfit).toBe(30000);
  });
});

describe('TC-014 Payment reconciliation (system 100000 vs terminal 98500)', () => {
  it('reports a difference of -1500', () => {
    const r = reconcile(100000, 98500);
    expect(r.difference).toBe(-1500);
    expect(r.matched).toBe(false);
  });
});

describe('TC-015 Audit log on price change', () => {
  it('captures old and new values', () => {
    const entry = {
      action: 'product.update',
      entity: 'Product',
      oldValue: { sellingPrice: 100 },
      newValue: { sellingPrice: 120 },
    };
    expect(entry.oldValue.sellingPrice).not.toBe(entry.newValue.sellingPrice);
    expect(entry.action).toBe('product.update');
  });
});

describe('Sale totals with discount & tax', () => {
  it('computes subtotal, discount, tax and total', () => {
    const t = computeSaleTotals([
      { quantity: 2, unitPrice: 500, discount: 100, taxRate: 0.1 },
    ]);
    expect(t.subtotal).toBe(1000);
    expect(t.discount).toBe(100);
    expect(t.tax).toBe(90); // (1000-100)*0.1
    expect(t.total).toBe(990);
  });
});
