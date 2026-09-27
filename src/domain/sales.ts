/**
 * Sale totals, split payments and credit/udhaar calculation.
 * All money values are integers in whole PKR (rupees).
 */

export interface SaleLine {
  quantity: number;   // base units
  unitPrice: number;  // per base unit
  discount?: number;  // absolute discount on the line
  taxRate?: number;   // e.g. 0.17 for 17%
}

export interface SaleTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

/** Compute subtotal / discount / tax / total for a set of sale lines. */
export function computeSaleTotals(lines: SaleLine[]): SaleTotals {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;
  for (const line of lines) {
    if (line.quantity <= 0) throw new Error('INVALID_QUANTITY');
    if (line.unitPrice < 0) throw new Error('INVALID_PRICE');
    const gross = line.quantity * line.unitPrice;
    const lineDiscount = line.discount ?? 0;
    const taxable = gross - lineDiscount;
    const lineTax = Math.round(taxable * (line.taxRate ?? 0));
    subtotal += gross;
    discount += lineDiscount;
    tax += lineTax;
  }
  const total = subtotal - discount + tax;
  return { subtotal, discount, tax, total };
}

export interface PaymentInput {
  method: 'CASH' | 'CARD' | 'BANK' | 'ONLINE' | 'CREDIT' | 'OTHER';
  amount: number;
}

export interface SettlementResult {
  total: number;
  paid: number;          // sum of non-credit payments
  outstanding: number;   // amount left as credit/udhaar
  status: 'completed' | 'partial' | 'credit';
  overpaid: boolean;
}

/**
 * Reconcile payments against an invoice total.
 * - Sum of paid (non-credit) payments determines settlement.
 * - Remaining balance becomes outstanding (credit) — allowed only when a
 *   customer is attached (enforced by caller).
 */
export function settlePayments(total: number, payments: PaymentInput[]): SettlementResult {
  if (total < 0) throw new Error('INVALID_TOTAL');
  const paid = payments
    .filter((p) => p.method !== 'CREDIT')
    .reduce((s, p) => s + p.amount, 0);

  if (paid < 0) throw new Error('INVALID_PAYMENT');

  const outstanding = Math.max(0, total - paid);
  const overpaid = paid > total;

  let status: SettlementResult['status'];
  if (outstanding === 0) status = 'completed';
  else if (paid === 0) status = 'credit';
  else status = 'partial';

  return { total, paid: Math.min(paid, total), outstanding, status, overpaid };
}
