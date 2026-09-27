import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTenant, assertOwned } from '@/lib/tenant';
import { purchaseSchema } from '@/lib/validators';
import { finalizePurchase } from '@/services/purchases';
import { audit } from '@/lib/audit';

export async function GET() {
  return handle(async () => {
    const ctx = await requireTenant();
    const purchases = await prisma.purchase.findMany({
      where: { tenantId: ctx.tenantId },
      include: { supplier: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' }, take: 100,
    });
    return ok(purchases);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const body = purchaseSchema.parse(await req.json());
    const branch = await prisma.branch.findUnique({ where: { id: body.branchId } });
    assertOwned(branch, ctx.tenantId);

    const result = await finalizePurchase({
      tenantId: ctx.tenantId, branchId: body.branchId, supplierId: body.supplierId ?? null,
      reference: body.reference, items: body.items, paidAmount: body.paidAmount,
    });
    await audit({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'purchase.create', entity: 'Purchase', entityId: result.purchase.id, newValue: { total: result.subtotal } });
    return ok(result, 201);
  });
}
