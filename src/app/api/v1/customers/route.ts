import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { customerSchema } from '@/lib/validators';
import { audit } from '@/lib/audit';

export async function GET(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const q = new URL(req.url).searchParams.get('q')?.trim();
    const customers = await prisma.customer.findMany({
      where: {
        tenantId: ctx.tenantId,
        ...(q ? { OR: [
          { name: { contains: q } },
          { phone: { contains: q } },
        ] } : {}),
      },
      orderBy: { name: 'asc' },
      take: 100,
    });
    return ok(customers);
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const body = customerSchema.parse(await req.json());

    // Phone is the practical identity — return existing rather than duplicate. (TC-006/007)
    const existing = await prisma.customer.findUnique({
      where: { tenantId_phone: { tenantId: ctx.tenantId, phone: body.phone } },
    });
    if (existing) return ok({ ...existing, existing: true });

    const customer = await prisma.customer.create({
      data: { ...body, email: body.email || null, tenantId: ctx.tenantId },
    });
    await audit({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'customer.create', entity: 'Customer', entityId: customer.id });
    return ok({ ...customer, existing: false }, 201);
  });
}
