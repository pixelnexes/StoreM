import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTenant, assertOwned } from '@/lib/tenant';
import { saleSchema } from '@/lib/validators';
import { finalizeSale } from '@/services/sales';
import { audit } from '@/lib/audit';

export async function GET() {
  return handle(async () => {
    const ctx = await requireTenant();
    const sales = await prisma.sale.findMany({
      where: { tenantId: ctx.tenantId },
      include: { customer: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return ok(sales);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const body = saleSchema.parse(await req.json());

    // Verify the branch belongs to this tenant (isolation).
    const branch = await prisma.branch.findUnique({ where: { id: body.branchId } });
    assertOwned(branch, ctx.tenantId);

    const result = await finalizeSale({
      tenantId: ctx.tenantId,
      branchId: body.branchId,
      cashierId: ctx.userId,
      customerId: body.customerId,
      items: body.items,
      payments: body.payments,
    });

    await audit({
      tenantId: ctx.tenantId, userId: ctx.userId, action: 'sale.create',
      entity: 'Sale', entityId: result.sale.id,
      newValue: { invoiceNumber: result.invoiceNumber, total: result.totals.total },
    });
    return ok(result, 201);
  });
}
