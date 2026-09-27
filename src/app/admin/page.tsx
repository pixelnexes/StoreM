import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/platformAuth';
import { prisma } from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/platform';
import { ThemeSelector } from '@/components/ThemeSelector';
import { CreateTenantForm } from '@/components/CreateTenantForm';

export const dynamic = 'force-dynamic';

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="card"><div className="text-xs uppercase tracking-wide text-muted">{label}</div><div className="mt-1 text-2xl font-extrabold">{value}</div></div>;
}

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
            <thead className="bg-canvas text-left text-muted"><tr><th className="p-3">Business</th><th>Phone</th><th>Plan</th><th>Status</th><th className="text-right">Users</th></tr></thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-t border-line">
                  <td className="p-3 font-medium">{t.businessName}</td>
                  <td>{t.phone ?? '—'}</td>
                  <td>{t.subscription?.plan.name ?? '—'}</td>
                  <td><span className="badge">{t.subscription?.status ?? 'N/A'}</span></td>
                  <td className="text-right">{t._count.users}</td>
                </tr>
              ))}
              {tenants.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">No tenants yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
