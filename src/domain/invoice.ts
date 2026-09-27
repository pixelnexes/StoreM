/** Invoice number generation — unique per tenant/branch per configuration. */

export interface InvoiceNumberParts {
  prefix: string;
  sequence: number;
  branchCode?: string;
  padTo?: number;
}

export function formatInvoiceNumber({
  prefix,
  sequence,
  branchCode,
  padTo = 5,
}: InvoiceNumberParts): string {
  const seq = String(sequence).padStart(padTo, '0');
  return branchCode ? `${prefix}-${branchCode}-${seq}` : `${prefix}-${seq}`;
}
