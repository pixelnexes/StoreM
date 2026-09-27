import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';
import { ReminderButton } from '@/components/ReminderButton';
import { creditReminderMessage } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

export default async function KhataPage() {
  const session = (await getSession())!;
  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { businessName: true } });

  const [entries, customers] = await Promise.all([
    prisma.customerLedger.findMany({
      where: { tenantId: session.tenantId },
      include: { customer: { select: { name: true, phone: true } } },
      orderBy: { date: 'desc' }, take: 100,
    }),
    prisma.customer.findMany({
      where: { tenantId: session.tenantId },
      include: { ledger: { orderBy: { date: 'desc' }, take: 1, select: { balance: true } } },
    }),
  ]);

  const debtors = customers
    .map((c) => ({ ...c, balance: c.ledger[0]?.balance ?? 0 }))
    .filter((c) => c.balance > 0)
    .sort((a, b) => b.balance - a.balance);
  const totalOutstanding = debtors.reduce((s, c) => s + c.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Ledger &amp; Credit</h1>
        <div className="card px-4 py-2 text-sm">Total outstanding: <b>{formatPKR(totalOutstanding)}</b></div>
      </div>

      <div className="card p-0">
        <h2 className="p-4 font-semibold">Customers with outstanding balance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas"><tr><th className="th">Customer</th><th className="th">Phone</th><th className="th text-right">Outstanding</th><th className="th text-right">Reminder</th></tr></thead>
            <tbody>
              {debtors.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="td font-medium">{c.name}</td>
                  <td className="td">{c.phone}</td>
                  <td className="td text-right font-semibold text-amber-600">{formatPKR(c.balance)}</td>
                  <td className="td text-right">
                    <ReminderButton to={c.phone} message={creditReminderMessage(tenant?.businessName ?? 'Store', c.name, c.balance)} />
                  </td>
                </tr>
              ))}
              {debtors.length === 0 && <tr><td colSpan={4} className="td p-6 text-center text-muted">No outstanding credit. 🎉</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-0">
        <h2 className="p-4 font-semibold">Ledger entries</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas"><tr><th className="th">Date</th><th className="th">Customer</th><th className="th">Type</th><th className="th text-right">Debit</th><th className="th text-right">Credit</th><th className="th text-right">Balance</th></tr></thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-t border-line">
                  <td className="td">{e.date.toLocaleDateString('en-PK')}</td>
                  <td className="td">{e.customer.name}</td>
                  <td className="td"><span className="badge">{e.type}</span></td>
                  <td className="td text-right">{e.debit ? formatPKR(e.debit) : '—'}</td>
                  <td className="td text-right">{e.credit ? formatPKR(e.credit) : '—'}</td>
                  <td className="td text-right font-semibold">{formatPKR(e.balance)}</td>
                </tr>
              ))}
              {entries.length === 0 && <tr><td colSpan={6} className="td p-6 text-center text-muted">No ledger entries yet. Credit sales will appear here.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
