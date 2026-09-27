import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';
import { AddCustomerForm } from '@/components/AddCustomerForm';

export const dynamic = 'force-dynamic';

function daysSince(d: Date) { return Math.floor((Date.now() - d.getTime()) / 86400000); }

export default async function CustomersPage() {
  const session = (await getSession())!;
  const customers = await prisma.customer.findMany({
    where: { tenantId: session.tenantId },
    include: {
      ledger: { orderBy: { date: 'desc' }, take: 1, select: { balance: true } },
      sales: { select: { total: true, outstandingAmount: true, createdAt: true } },
    },
    orderBy: { name: 'asc' },
  });

  const rows = customers.map((c) => {
    const lifetime = c.sales.reduce((s, x) => s + x.total, 0);
    const outstanding = c.ledger[0]?.balance ?? 0;
    const unpaid = c.sales.filter((s) => s.outstandingAmount > 0).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const oldestDue = unpaid[0]?.createdAt ?? null;
    return { id: c.id, name: c.name, phone: c.phone, purchases: c.sales.length, lifetime, outstanding, oldestDue };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Customers</h1>
        <AddCustomerForm />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-canvas">
            <tr>
              <th className="th">Name</th><th className="th">Phone</th>
              <th className="th text-right">Purchases</th><th className="th text-right">Lifetime spend</th>
              <th className="th text-right">Outstanding</th><th className="th">Oldest due</th><th className="th"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-line">
                <td className="td font-medium">{c.name}</td>
                <td className="td">{c.phone}</td>
                <td className="td text-right">{c.purchases}</td>
                <td className="td text-right">{formatPKR(c.lifetime)}</td>
                <td className={`td text-right font-semibold ${c.outstanding > 0 ? 'text-amber-600' : ''}`}>{formatPKR(c.outstanding)}</td>
                <td className="td">{c.oldestDue ? `${c.oldestDue.toLocaleDateString('en-PK')} · ${daysSince(c.oldestDue)}d ago` : '—'}</td>
                <td className="td text-right"><Link href={`/app/customers/${c.id}`} className="text-brand hover:underline">Detail →</Link></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="td p-6 text-center text-muted">No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
