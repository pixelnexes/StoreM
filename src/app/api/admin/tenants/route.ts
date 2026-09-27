import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { createTenantSchema } from '@/lib/validators';

/** Super admin creates a new store (tenant) + owner + subscription on a chosen plan. */
export async function POST(req: Request) {
  return handle(async () => {
    await requirePlatformAdmin();
    const body = createTenantSchema.parse(await req.json());

    const plan = await prisma.plan.findUnique({ where: { key: body.planKey } });
    if (!plan) return fail('PLAN_NOT_FOUND', 'Unknown plan', 422);

    const existing = await prisma.user.findFirst({ where: { phone: body.phone } });
    if (existing) return fail('PHONE_TAKEN', 'This phone number is already registered', 409);

    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.businessName, businessName: body.businessName,
          phone: body.phone, email: body.email || null,
          settings: { create: {} },
          subscription: {
            create: {
              planId: plan.id,
              status: body.status,
              billingCycle: 'monthly',
              trialEndsAt: body.status === 'TRIAL' ? new Date(Date.now() + 14 * 86400000) : null,
              currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
            },
          },
        },
      });
      await tx.branch.create({ data: { tenantId: tenant.id, name: 'Main Branch', phone: body.phone } });
      await tx.user.create({
        data: {
          tenantId: tenant.id, name: body.ownerName, phone: body.phone, email: body.email || null,
          passwordHash: await hashPassword(body.password), role: 'OWNER',
        },
      });
      return tenant;
    });

    return ok({ tenantId: result.id, businessName: result.businessName }, 201);
  });
}
