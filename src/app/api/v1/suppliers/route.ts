import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { supplierSchema } from '@/lib/validators';
import { audit } from '@/lib/audit';

export async function GET() {
  return handle(async () => {
    const ctx = await requireTenant();
    const suppliers = await prisma.supplier.findMany({
      where: { tenantId: ctx.tenantId }, orderBy: { name: 'asc' }, take: 200,
    });
    return ok(suppliers);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const body = supplierSchema.parse(await req.json());
    const supplier = await prisma.supplier.create({
      data: { ...body, email: body.email || null, tenantId: ctx.tenantId },
    });
    await audit({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'supplier.create', entity: 'Supplier', entityId: supplier.id });
    return ok(supplier, 201);
  });
}
