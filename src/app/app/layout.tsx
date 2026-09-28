import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/platform';
import { AppShell } from '@/components/AppShell';
import { accessForStatus, type SubStatus } from '@/domain/subscription';
import { planModules } from '@/lib/modules';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const [tenant, sub, platform] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.subscription.findUnique({
      where: { tenantId: session.tenantId },
      include: { plan: { select: { name: true, features: true } } },
    }),
    getPlatformSettings(),
  ]);
  if (!tenant) redirect('/login');

  const access = sub
    ? accessForStatus(sub.status as SubStatus, sub.currentPeriodEnd, sub.gracePeriodDays)
    : { canAccess: true, readOnly: false, reason: undefined as string | undefined };

  const notice = access.canAccess
    ? undefined
    : `Subscription ${access.reason}. Access is restricted — your data is preserved. Please renew.`;

  return (
    <AppShell
      brand={platform.brandName}
      store={tenant.businessName}
      name={session.name}
      role={session.role}
      plan={sub?.plan.name}
      planStatus={sub?.status}
      modules={planModules(sub?.plan.features)}
      notice={notice}
    >
      {children}
    </AppShell>
  );
}
