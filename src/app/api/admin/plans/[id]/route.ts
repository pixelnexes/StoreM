import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { planUpdateSchema } from '@/lib/validators';
import { ApiError } from '@/lib/tenant';
import { MODULE_KEYS } from '@/lib/modules';

/**
 * Super admin edits a plan in place: name, prices and the set of modules it
 * unlocks. Prices are `priceYearly = 12 * monthly` unless a yearly figure is
 * sent. Existing subscriptions keep pointing at the same row, so a rename
 * reaches every store immediately.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requirePlatformAdmin();
    const body = planUpdateSchema.parse(await req.json());

    const modules = body.modules.filter((k) => MODULE_KEYS.includes(k));
    if (modules.length === 0) {
      throw new ApiError(422, 'NO_MODULES', 'A plan must unlock at least one module');
    }

    const plan = await prisma.plan.findUnique({ where: { id: params.id } });
    if (!plan) throw new ApiError(404, 'PLAN_NOT_FOUND', 'Plan not found');

    // Keep any non-module feature flags (staff limits, api access …) intact.
    let extras: Record<string, unknown> = {};
    try {
      const parsed = JSON.parse(plan.features) as Record<string, unknown>;
      for (const [k, v] of Object.entries(parsed)) if (!MODULE_KEYS.includes(k) && k !== 'modules') extras[k] = v;
    } catch { /* plan had malformed JSON — start clean */ }

    const updated = await prisma.plan.update({
      where: { id: params.id },
      data: {
        name: body.name,
        priceMonthly: body.priceMonthly,
        priceYearly: body.priceYearly ?? body.priceMonthly * 12,
        active: body.active ?? plan.active,
        features: JSON.stringify({ ...extras, modules }),
      },
    });

    return ok({ ...updated, modules });
  });
}
