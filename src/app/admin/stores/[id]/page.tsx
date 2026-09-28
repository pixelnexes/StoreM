import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAdminSession } from '@/lib/platformAuth';
import { prisma } from '@/lib/prisma';
import { StoreForm } from '@/components/admin/StoreForm';
import { UserManager } from '@/components/admin/UserManager';

export const dynamic = 'force-dynamic';

export default async function AdminStorePage({ params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');

  const [tenant, plans] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        subscription: { select: { planId: true, status: true } },
        users: { orderBy: [{ role: 'asc' }, { name: 'asc' }] },
      },
    }),
    prisma.plan.findMany({ orderBy: [{ active: 'desc' }, { priceMonthly: 'asc' }] }),
  ]);
  if (!tenant) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-[13px] text-muted hover:text-ink">← Platform overview</Link>
          <h1 className="mt-1 text-2xl font-bold">{tenant.businessName}</h1>
          <p className="text-sm text-muted">
            Created {tenant.createdAt.toLocaleDateString('en-PK')} · {tenant.subscription ? `on plan since subscription` : 'no subscription yet'}
          </p>
        </div>
        <span className="badge">{tenant.subscription?.status ?? 'NO PLAN'}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StoreForm
          store={{
            id: tenant.id,
            businessName: tenant.businessName,
            businessType: tenant.businessType ?? '',
            phone: tenant.phone ?? '',
            email: tenant.email ?? '',
            address: tenant.address ?? '',
            planId: tenant.subscription?.planId,
            subStatus: tenant.subscription?.status,
          }}
          plans={plans}
        />
        <UserManager
          tenantId={tenant.id}
          users={tenant.users.map((u) => ({
            id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role, status: u.status,
          }))}
        />
      </div>
    </div>
  );
}
