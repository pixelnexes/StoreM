import 'server-only';
import { prisma } from '@/lib/prisma';
import { ApiError } from '@/lib/tenant';

export interface PurchaseItemInput {
  productId: string;
  quantity: number; // base units received
  unitCost: number; // cost per base unit
}

export interface FinalizePurchaseInput {
  tenantId: string;
  branchId: string;
  supplierId?: string | null;
  reference?: string;
  items: PurchaseItemInput[];
  paidAmount?: number;
}

/**
 * Receive stock into inventory atomically:
 * creates the purchase, inbound inventory transactions, updates the stock cache,
 * and refreshes each product's latest purchase (cost) price for accurate COGS.
 */
export async function finalizePurchase(input: FinalizePurchaseInput) {
  if (input.items.length === 0) throw new ApiError(422, 'EMPTY_PURCHASE', 'No items in purchase');

  const subtotal = input.items.reduce((s, i) => s + i.quantity * i.unitCost, 0);

  return prisma.$transaction(async (tx) => {
    const ids = [...new Set(input.items.map((i) => i.productId))];
    const owned = await tx.product.findMany({
      where: { id: { in: ids }, tenantId: input.tenantId },
      select: { id: true },
    });
    if (owned.length !== ids.length) throw new ApiError(404, 'PRODUCT_NOT_FOUND', 'Product not found');

    const purchase = await tx.purchase.create({
      data: {
        tenantId: input.tenantId,
        branchId: input.branchId,
        supplierId: input.supplierId ?? null,
        reference: input.reference,
        subtotal,
        total: subtotal,
        paidAmount: input.paidAmount ?? subtotal,
        status: 'completed',
      },
    });

    for (const item of input.items) {
      await tx.purchaseItem.create({
        data: {
          purchaseId: purchase.id, productId: item.productId,
          quantity: item.quantity, unitCost: item.unitCost, total: item.quantity * item.unitCost,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          tenantId: input.tenantId, branchId: input.branchId, productId: item.productId,
          type: 'PURCHASE', quantity: Math.abs(item.quantity),
          referenceType: 'PURCHASE', referenceId: purchase.id, unitCost: item.unitCost,
        },
      });

      await tx.inventory.upsert({
        where: { branchId_productId: { branchId: input.branchId, productId: item.productId } },
        update: { quantity: { increment: item.quantity } },
        create: { tenantId: input.tenantId, branchId: input.branchId, productId: item.productId, quantity: item.quantity },
      });

      // Keep the product's cost price current for COGS/profit accuracy.
      await tx.product.update({ where: { id: item.productId }, data: { purchasePrice: item.unitCost } });
    }

    return { purchase, subtotal };
  }, { timeout: 30000, maxWait: 10000 });
}
