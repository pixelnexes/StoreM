import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getPlatformSettings } from '@/lib/platform';
import { Sidebar } from '@/components/Sidebar';
import { LogoutButton } from '@/components/LogoutButton';
import { accessForStatus, type SubStatus } from '@/domain/subscription';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const [tenant, sub, platform] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.subscription.findUnique({ where: { tenantId: session.tenantId } }),
    getPlatformSettings(),
  ]);
  if (!tenant) redirect('/login');

  const access = sub
    ? accessForStatus(sub.status as SubStatus, sub.currentPeriodEnd, sub.gracePeriodDays)
    : { canAccess: true, readOnly: false, reason: undefined as string | undefined };

  return (
    <div className="flex min-h-screen">
      <Sidebar brand={platform.brandName} store={tenant.businessName} />
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6">
          <div className="text-sm text-muted">
            Signed in as <b className="text-ink">{session.name}</b> · <span className="badge">{session.role}</span>
          </div>
          <div className="flex items-center gap-3">
            {sub && <span className="text-xs text-muted">Plan: <b className="text-ink">{sub.status}</b></span>}
            <LogoutButton />
          </div>
        </header>
        {!access.canAccess && (
          <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm text-amber-800">
            Subscription {access.reason}. Access is restricted — your data is preserved. Please renew.
          </div>
        )}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
