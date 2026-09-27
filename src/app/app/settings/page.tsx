import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = (await getSession())!;
  const [tenant, setting, sub] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: session.tenantId } }),
    prisma.storeSetting.findUnique({ where: { tenantId: session.tenantId } }),
    prisma.subscription.findUnique({ where: { tenantId: session.tenantId }, include: { plan: true } }),
  ]);

  const rows: [string, string][] = [
    ['Business Name', tenant?.businessName ?? '—'],
    ['Phone', tenant?.phone ?? '—'],
    ['Currency', tenant?.currency ?? 'PKR'],
    ['Timezone', tenant?.timezone ?? '—'],
    ['Invoice Prefix', setting?.invoicePrefix ?? 'INV'],
    ['Receipt Width', setting?.receiptWidth ?? '80mm'],
    ['Plan', sub?.plan.name ?? '—'],
    ['Subscription Status', sub?.status ?? '—'],
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="card max-w-xl">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([l, v]) => (
              <tr key={l} className="border-b border-line last:border-0">
                <td className="py-3 text-muted">{l}</td>
                <td className="py-3 text-right font-medium">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">The platform theme is controlled by the super admin. Store-level branding is coming soon.</p>
    </div>
  );
}
