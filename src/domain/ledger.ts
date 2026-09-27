/**
 * Customer ledger — authoritative record of every financial movement.
 * Balance convention: positive balance = customer owes the store (receivable).
 *   SALE (credit)  => debit  (increases what customer owes)
 *   PAYMENT        => credit (reduces what customer owes)
 *   REFUND         => credit
 *   ADJUSTMENT     => debit or credit
 */

export type LedgerType = 'SALE' | 'PAYMENT' | 'REFUND' | 'ADJUSTMENT';

export interface LedgerEntryInput {
  type: LedgerType;
  debit?: number;
  credit?: number;
  notes?: string;
}

export interface LedgerEntry extends LedgerEntryInput {
  balance: number;
}

/** Fold entries into running balances. Never derive balances from UI state. */
export function computeRunningBalance(
  entries: LedgerEntryInput[],
  openingBalance = 0,
): LedgerEntry[] {
  let balance = openingBalance;
  return entries.map((e) => {
    balance += (e.debit ?? 0) - (e.credit ?? 0);
    return { ...e, balance };
  });
}

/** Final outstanding balance for a customer. */
export function outstandingBalance(entries: LedgerEntryInput[], openingBalance = 0): number {
  return entries.reduce(
    (bal, e) => bal + (e.debit ?? 0) - (e.credit ?? 0),
    openingBalance,
  );
}

/** Build the ledger entry created when a credit sale is finalized. */
export function saleLedgerEntry(total: number, paid: number): LedgerEntryInput {
  return { type: 'SALE', debit: total, credit: paid, notes: 'Sale' };
}
