import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { MarketingComposer } from '@/components/MarketingComposer';
import { ModuleGate } from '@/components/ModuleGate';
import { planModules } from '@/lib/modules';

export const dynamic = 'force-dynamic';

export default async function MarketingPage() {
  const session = (await getSession())!;
  const [tenant, customers, sub] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { businessName: true } }),
    prisma.customer.findMany({
      where: { tenantId: session.tenantId },
      include: { ledger: { orderBy: { date: 'desc' }, take: 1, select: { balance: true } }, _count: { select: { sales: true } } },
      orderBy: { name: 'asc' },
    }),
    prisma.subscription.findUnique({
      where: { tenantId: session.tenantId },
      select: { plan: { select: { features: true } } },
    }),
  ]);

  const list = customers.map((c) => ({
    id: c.id, name: c.name, phone: c.phone,
    balance: c.ledger[0]?.balance ?? 0, purchases: c._count.sales,
  }));

  return (
    <ModuleGate allowed={planModules(sub?.plan.features)} moduleKey="marketing">
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Marketing</h1>
          <p className="text-sm text-muted">Send WhatsApp campaigns to customer segments. This is why every customer needs a phone number.</p>
        </div>
        <MarketingComposer store={tenant?.businessName ?? 'Store'} customers={list} />
      </div>
    </ModuleGate>
  );
}
