import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/platformAuth';
import { prisma } from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/platform';
import { ThemeSelector } from '@/components/ThemeSelector';
import { CreateTenantForm } from '@/components/CreateTenantForm';
import { Stat } from '@/components/Stat';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const [totalTenants, activeSubs, trialSubs, tenants, platform, plans] = await Promise.all([
    prisma.tenant.count(),
    prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    prisma.subscription.count({ where: { status: 'TRIAL' } }),
    prisma.tenant.findMany({
      include: { subscription: { include: { plan: true } }, _count: { select: { users: true } } },
      orderBy: { createdAt: 'desc' }, take: 20,
    }),
    getPlatformSettings(),
    prisma.plan.findMany({ where: { active: true }, select: { key: true, name: true }, orderBy: { priceMonthly: 'asc' } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Overview</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total Tenants" value={String(totalTenants)} />
        <Stat label="Active Subscriptions" value={String(activeSubs)} />
        <Stat label="Trials" value={String(trialSubs)} />
      </div>

      <CreateTenantForm plans={plans} />

      <ThemeSelector current={platform.themeKey} brandName={platform.brandName} />

      <div className="card p-0">
        <h2 className="p-4 font-semibold">Tenants</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line"><th className="th">Business</th><th className="th">Phone</th><th className="th">Plan</th><th className="th">Status</th><th className="th text-right">Users</th></tr></thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-line last:border-0">
                  <td className="td font-medium">{t.businessName}</td>
                  <td className="td">{t.phone ?? '—'}</td>
                  <td className="td">{t.subscription?.plan.name ?? '—'}</td>
                  <td className="td"><span className="badge">{t.subscription?.status ?? 'N/A'}</span></td>
                  <td className="td text-right tabular-nums">{t._count.users}</td>
                </tr>
              ))}
              {tenants.length === 0 && <tr><td colSpan={5} className="td p-6 text-center text-muted">No tenants yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
