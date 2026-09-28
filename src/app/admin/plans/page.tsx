import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/platformAuth';
import { prisma } from '@/lib/prisma';
import { planModules } from '@/lib/modules';
import { PlanEditor } from '@/components/PlanEditor';

export const dynamic = 'force-dynamic';

export default async function AdminPlansPage() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const plans = await prisma.plan.findMany({
    orderBy: [{ active: 'desc' }, { priceMonthly: 'asc' }],
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Plans</h1>
        <p className="text-sm text-muted">
          Every store reads these rows live — rename a plan or change its price and it reaches every
          subscription on the next page load.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {plans.map((p) => (
          <div key={p.id} className="space-y-2">
            <PlanEditor plan={{ ...p, modules: planModules(p.features) }} />
            <p className="px-1 text-[12px] text-muted">
              {p._count.subscriptions} store{p._count.subscriptions === 1 ? '' : 's'} on this plan
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
