/**
 * Transaction-based inventory. Stock is NEVER overwritten directly — it is the
 * sum of signed inventory transactions. This module computes stock and validates
 * availability before a sale.
 */

export type InvTxType = 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'DAMAGE' | 'TRANSFER';

export interface InvTx {
  type: InvTxType;
  quantity: number; // signed base units: +in / -out
}

/** Current stock = sum of all signed transaction quantities. */
export function computeStock(transactions: InvTx[]): number {
  return transactions.reduce((sum, t) => sum + t.quantity, 0);
}

export interface StockCheck {
  ok: boolean;
  available: number;
  requested: number;
  code?: 'INSUFFICIENT_STOCK';
}

/** Validate that `requested` base units can be sold from `available`. */
export function checkAvailability(available: number, requested: number): StockCheck {
  if (requested <= 0) {
    return { ok: false, available, requested, code: 'INSUFFICIENT_STOCK' };
  }
  if (requested > available) {
    return { ok: false, available, requested, code: 'INSUFFICIENT_STOCK' };
  }
  return { ok: true, available, requested };
}

/** Produce the signed delta for a sale (negative). */
export function saleDelta(baseQty: number): number {
  return -Math.abs(baseQty);
}

/** Produce the signed delta for a return/purchase (positive). */
export function inboundDelta(baseQty: number): number {
  return Math.abs(baseQty);
}
