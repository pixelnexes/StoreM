import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { productSchema } from '@/lib/validators';
import { checkLimit, type PlanLimits } from '@/domain/subscription';
import { audit } from '@/lib/audit';

export async function GET(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const q = new URL(req.url).searchParams.get('q')?.trim();
    const products = await prisma.product.findMany({
      where: {
        tenantId: ctx.tenantId, // tenant isolation — always scoped
        ...(q ? { OR: [
          { name: { contains: q } },
          { sku: { contains: q } },
          { barcode: { contains: q } },
        ] } : {}),
      },
      include: { inventory: { select: { quantity: true } } },
      orderBy: { name: 'asc' },
      take: 100,
    });
    return ok(products.map((p) => ({
      ...p,
      stock: p.inventory.reduce((s, i) => s + i.quantity, 0),
    })));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const body = productSchema.parse(await req.json());

    // Server-side plan limit enforcement (never trust the client). TC-011 style.
    const sub = await prisma.subscription.findUnique({
      where: { tenantId: ctx.tenantId }, include: { plan: true },
    });
    const limits: PlanLimits = sub?.plan.features ? JSON.parse(sub.plan.features) : {};
    const count = await prisma.product.count({ where: { tenantId: ctx.tenantId } });
    const chk = checkLimit('products', count, limits);
    if (!chk.allowed) return fail(chk.code!, 'Product limit reached — upgrade your plan', 409);

    const product = await prisma.product.create({
      data: { ...body, tenantId: ctx.tenantId },
    });
    await audit({ tenantId: ctx.tenantId, userId: ctx.userId, action: 'product.create', entity: 'Product', entityId: product.id, newValue: product });
    return ok(product, 201);
  });
}
