import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { planModules } from '@/lib/modules';

/** Super admin: every plan (active and archived) for the plans editor. */
export async function GET() {
  return handle(async () => {
    await requirePlatformAdmin();
    const plans = await prisma.plan.findMany({ orderBy: { priceMonthly: 'asc' } });
    return ok(plans.map((p) => ({ ...p, modules: planModules(p.features) })));
  });
}
