import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { tenantUpdateSchema } from '@/lib/validators';
import { ApiError } from '@/lib/tenant';

/** Super admin edits a store's profile and moves it between plans. */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requirePlatformAdmin();
    const body = tenantUpdateSchema.parse(await req.json());

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: { subscription: { select: { planId: true } } },
    });
    if (!tenant) throw new ApiError(404, 'NOT_FOUND', 'Store not found');

    if (body.phone && body.phone !== tenant.phone) {
      const taken = await prisma.user.findFirst({ where: { phone: body.phone, NOT: { tenantId: tenant.id } } });
      if (taken) throw new ApiError(409, 'PHONE_TAKEN', 'Another store already uses this phone number');
    }

    if (body.planId && body.planId !== tenant.subscription?.planId) {
      const plan = await prisma.plan.findUnique({ where: { id: body.planId } });
      if (!plan) throw new ApiError(422, 'PLAN_NOT_FOUND', 'Unknown plan');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const t = await tx.tenant.update({
        where: { id: tenant.id },
        data: {
          name: body.businessName,
          businessName: body.businessName,
          businessType: body.businessType || null,
          phone: body.phone || null,
          email: body.email || null,
          address: body.address || null,
        },
      });

      if (tenant.subscription) {
        const patch: Record<string, unknown> = {};
        if (body.planId && body.planId !== tenant.subscription.planId) patch.planId = body.planId;
        if (body.subStatus) patch.status = body.subStatus;
        if (Object.keys(patch).length > 0) {
          await tx.subscription.update({ where: { tenantId: tenant.id }, data: patch });
        }
      } else if (body.planId) {
        await tx.subscription.create({
          data: {
            tenantId: tenant.id, planId: body.planId, status: body.subStatus ?? 'TRIAL',
            billingCycle: 'monthly', currentPeriodEnd: new Date(Date.now() + 30 * 86400000),
          },
        });
      }
      return t;
    }, { timeout: 30000, maxWait: 10000 });

    return ok({ id: updated.id, businessName: updated.businessName });
  });
}
