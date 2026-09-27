/** Money is stored as integers in whole PKR (rupees). Helpers for display. */

export function formatPKR(amount: number, currency = 'PKR'): string {
  const sign = amount < 0 ? '-' : '';
  const n = Math.abs(Math.round(amount)).toLocaleString('en-PK');
  return `${sign}${currency === 'PKR' ? 'Rs. ' : ''}${n}`;
}

export function parseAmount(input: string): number {
  const n = Number(String(input).replace(/[^0-9.-]/g, ''));
  if (!Number.isFinite(n)) throw new Error('INVALID_AMOUNT');
  return Math.round(n);
}
