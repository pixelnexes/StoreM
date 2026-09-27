import 'server-only';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/tenant';
import { computeSaleTotals, settlePayments, type PaymentInput } from '@/domain/sales';
import { checkAvailability, computeStock } from '@/domain/inventory';
import { formatInvoiceNumber } from '@/domain/invoice';

export interface SaleItemInput {
  productId: string;
  quantity: number; // base units
  unit?: string;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}

export interface FinalizeSaleInput {
  tenantId: string;
  branchId: string;
  cashierId: string;
  customerId?: string | null;
  items: SaleItemInput[];
  payments: PaymentInput[];
}

/**
 * Finalize a sale atomically. If any step fails, the whole transaction rolls
 * back — no partial inventory movement, no orphan invoice. (Spec §42, TC-003/004/005/008)
 */
export async function finalizeSale(input: FinalizeSaleInput) {
  const { tenantId, branchId, cashierId, customerId } = input;
  if (input.items.length === 0) throw new ApiError(422, 'EMPTY_SALE', 'No items in sale');

  const totals = computeSaleTotals(
    input.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount,
      taxRate: i.taxRate,
    })),
  );

  const settlement = settlePayments(totals.total, input.payments);

  // Credit/outstanding requires an attached customer.
  if (settlement.outstanding > 0 && !customerId) {
    throw new ApiError(422, 'CREDIT_REQUIRES_CUSTOMER', 'Credit sale needs a customer');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Validate stock for every line (row-level, current tenant/branch).
    for (const item of input.items) {
      const product = await tx.product.findFirst({
        where: { id: item.productId, tenantId },
        select: { id: true, purchasePrice: true },
      });
      if (!product) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

      const txs = await tx.inventoryTransaction.findMany({
        where: { tenantId, branchId, productId: item.productId },
        select: { quantity: true, type: true },
      });
      const available = computeStock(txs as any);
      const chk = checkAvailability(available, item.quantity);
      if (!chk.ok) {
        throw new ApiError(409, 'INSUFFICIENT_STOCK',
          `Requested ${item.quantity} but only ${available} available`);
      }
    }

    // 2. Invoice number (per-tenant sequence via StoreSetting).
    const setting = await tx.storeSetting.upsert({
      where: { tenantId },
      update: { nextInvoiceNo: { increment: 1 } },
      create: { tenantId, nextInvoiceNo: 2 },
    });
    const seq = setting.nextInvoiceNo - 1;
    const invoiceNumber = formatInvoiceNumber({ prefix: setting.invoicePrefix, sequence: seq });

    // 3. Create the sale header.
    const sale = await tx.sale.create({
      data: {
        tenantId,
        branchId,
        invoiceNumber,
        customerId: customerId ?? null,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        paidAmount: settlement.paid,
        outstandingAmount: settlement.outstanding,
        status: settlement.status === 'completed' ? 'completed'
              : settlement.status === 'credit' ? 'credit' : 'partial',
        cashierId,
      },
    });

    // 4. Sale items + capture unit cost for COGS.
    for (const item of input.items) {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: item.productId },
        select: { purchasePrice: true },
      });
      const gross = item.quantity * item.unitPrice - (item.discount ?? 0);
      const lineTax = Math.round(gross * (item.taxRate ?? 0));
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.unit ?? 'piece',
          unitPrice: item.unitPrice,
          discount: item.discount ?? 0,
          tax: lineTax,
          total: gross + lineTax,
          unitCost: product.purchasePrice,
        },
      });

      // 5. Inventory transaction (SALE = negative) + upsert stock cache.
      await tx.inventoryTransaction.create({
        data: {
          tenantId, branchId, productId: item.productId,
          type: 'SALE', quantity: -Math.abs(item.quantity),
          referenceType: 'SALE', referenceId: sale.id,
          unitCost: product.purchasePrice, createdBy: cashierId,
        },
      });
      await tx.inventory.upsert({
        where: { branchId_productId: { branchId, productId: item.productId } },
        update: { quantity: { decrement: item.quantity } },
        create: { tenantId, branchId, productId: item.productId, quantity: -item.quantity },
      });
    }

    // 6. Payment records.
    for (const p of input.payments) {
      if (p.method === 'CREDIT') continue;
      await tx.payment.create({
        data: { tenantId, saleId: sale.id, method: p.method, amount: p.amount },
      });
    }

    // 7. Customer ledger for the outstanding (credit) portion.
    if (customerId && settlement.outstanding > 0) {
      const prev = await tx.customerLedger.findFirst({
        where: { tenantId, customerId },
        orderBy: { date: 'desc' },
        select: { balance: true },
      });
      const newBalance = (prev?.balance ?? 0) + totals.total - settlement.paid;
      await tx.customerLedger.create({
        data: {
          tenantId, customerId, type: 'SALE', referenceId: sale.id,
          debit: totals.total, credit: settlement.paid, balance: newBalance,
          notes: `Sale ${invoiceNumber}`,
        },
      });
    }

    return { sale, totals, settlement, invoiceNumber };
  });
}
