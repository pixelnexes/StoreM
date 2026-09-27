import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';
import { ReminderButton } from '@/components/ReminderButton';
import { creditReminderMessage } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

function daysSince(d: Date) { return Math.floor((Date.now() - d.getTime()) / 86400000); }

function Stat({ label, value, hint, warn }: { label: string; value: string; hint?: string; warn?: boolean }) {
  return (
    <div className="card">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${warn ? 'text-amber-600' : ''}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export default async function CustomerDetail({ params }: { params: { id: string } }) {
  const session = (await getSession())!;
  const tenantId = session.tenantId;

  const customer = await prisma.customer.findFirst({
    where: { id: params.id, tenantId },
    include: {
      sales: {
        include: { items: { include: { product: { select: { name: true } } } }, payments: true },
        orderBy: { createdAt: 'desc' },
      },
      ledger: { orderBy: { date: 'desc' } },
    },
  });
  if (!customer) notFound();
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessName: true } });

  const lifetime = customer.sales.reduce((s, x) => s + x.total, 0);
  const outstanding = customer.ledger[0]?.balance ?? 0;
  const unpaid = customer.sales.filter((s) => s.outstandingAmount > 0).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const oldestDue = unpaid[0]?.createdAt ?? null;
  const allPayments = customer.sales.flatMap((s) => s.payments.map((p) => ({ ...p, invoice: s.invoiceNumber })));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/app/customers" className="text-sm text-brand hover:underline">← Customers</Link>
          <h1 className="text-2xl font-bold">{customer.name}</h1>
          <p className="text-sm text-muted">{customer.phone}{customer.address ? ` · ${customer.address}` : ''} · since {customer.createdAt.toLocaleDateString('en-PK')}</p>
        </div>
        {outstanding > 0 && (
          <ReminderButton to={customer.phone} message={creditReminderMessage(tenant?.businessName ?? 'Store', customer.name, outstanding, oldestDue ? oldestDue.toLocaleDateString('en-PK') : undefined)} />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Lifetime spend" value={formatPKR(lifetime)} hint={`${customer.sales.length} purchases`} />
        <Stat label="Outstanding" value={formatPKR(outstanding)} warn={outstanding > 0} />
        <Stat label="Oldest due" value={oldestDue ? `${daysSince(oldestDue)} days` : '—'} hint={oldestDue ? oldestDue.toLocaleDateString('en-PK') : 'No dues'} warn={!!oldestDue} />
        <Stat label="Unpaid bills" value={String(unpaid.length)} />
      </div>

      {/* Purchase history */}
      <div className="card p-0">
        <h2 className="p-4 font-semibold">Purchase history</h2>
        <div className="divide-y divide-line">
          {customer.sales.map((s) => (
            <div key={s.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">
                  <Link href={`/app/invoices/${s.id}`} className="text-brand hover:underline">{s.invoiceNumber}</Link>
                  <span className="ml-2 text-sm text-muted">{s.createdAt.toLocaleString('en-PK')}</span>
                </div>
                <div className="text-sm">
                  Total <b>{formatPKR(s.total)}</b> · Paid {formatPKR(s.paidAmount)}
                  {s.outstandingAmount > 0 && <span className="text-amber-600"> · Due {formatPKR(s.outstandingAmount)}</span>}
                  <span className="badge ml-2">{s.status}</span>
                </div>
              </div>
              <div className="mt-2 text-sm text-muted">
                {s.items.map((i) => `${i.product.name} ×${i.quantity}`).join(', ')}
              </div>
            </div>
          ))}
          {customer.sales.length === 0 && <p className="p-4 text-sm text-muted">No purchases yet.</p>}
        </div>
      </div>

      {/* Payment history */}
      <div className="card p-0">
        <h2 className="p-4 font-semibold">Payment history</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas"><tr><th className="th">Date</th><th className="th">Invoice</th><th className="th">Method</th><th className="th text-right">Amount</th></tr></thead>
            <tbody>
              {allPayments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="td">{p.createdAt.toLocaleDateString('en-PK')}</td>
                  <td className="td">{p.invoice}</td>
                  <td className="td"><span className="badge">{p.method}</span></td>
                  <td className="td text-right">{formatPKR(p.amount)}</td>
                </tr>
              ))}
              {allPayments.length === 0 && <tr><td colSpan={4} className="td p-6 text-center text-muted">No payments recorded.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
