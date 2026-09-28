import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';
import { profitFromTotals } from '@/domain/profit';
import { Stat } from '@/components/Stat';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const session = (await getSession())!;
  const tenantId = session.tenantId;
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

  const [todaySales, todayItems, expensesAgg, outstandingAgg, lowStock, recent] = await Promise.all([
    prisma.sale.aggregate({ where: { tenantId, createdAt: { gte: startOfDay } }, _sum: { total: true }, _count: true }),
    prisma.saleItem.findMany({ where: { sale: { tenantId, createdAt: { gte: startOfDay } } }, select: { quantity: true, unitPrice: true, unitCost: true, discount: true } }),
    prisma.expense.aggregate({ where: { tenantId, date: { gte: startOfDay } }, _sum: { amount: true } }),
    prisma.customerLedger.aggregate({ where: { tenantId }, _sum: { debit: true, credit: true } }),
    prisma.inventory.findMany({ where: { tenantId, product: { minimumStock: { gt: 0 } } }, include: { product: true } }),
    prisma.sale.findMany({ where: { tenantId }, include: { customer: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 6 }),
  ]);

  const revenue = todayItems.reduce((s, i) => s + i.quantity * i.unitPrice - i.discount, 0);
  const cogs = todayItems.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const p = profitFromTotals(revenue, cogs, expensesAgg._sum.amount ?? 0);
  const outstanding = (outstandingAgg._sum.debit ?? 0) - (outstandingAgg._sum.credit ?? 0);
  const low = lowStock.filter((i) => i.quantity <= i.product.minimumStock);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted">Today&apos;s overview — {new Date().toLocaleDateString('en-PK')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today's Sales" value={formatPKR(todaySales._sum.total ?? 0)} hint={`${todaySales._count} invoices`} />
        <Stat label="Gross Profit" value={formatPKR(p.grossProfit)} hint={`${p.margin}% margin`} />
        <Stat label="Net Profit (today)" value={formatPKR(p.netProfit)} hint={`COGS ${formatPKR(p.cogs)}`} />
        <Stat label="Outstanding Udhaar" value={formatPKR(outstanding)} hint="Receivable from customers" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Recent Sales</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted">No sales yet. Make your first sale from the POS.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-line"><th className="th">Invoice</th><th className="th">Customer</th><th className="th text-right">Total</th><th className="th text-right">Status</th></tr></thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.id} className="border-b border-line last:border-0">
                    <td className="py-2.5 font-medium">{s.invoiceNumber}</td>
                    <td className="py-2.5">{s.customer?.name ?? 'Walk-in'}</td>
                    <td className="py-2.5 text-right tabular-nums">{formatPKR(s.total)}</td>
                    <td className="py-2.5 text-right"><span className="badge">{s.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Low stock</h2>
          {low.length === 0 ? (
            <p className="text-sm text-muted">All stock levels are healthy.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {low.map((i) => (
                <li key={i.id} className="flex justify-between border-t border-line py-2">
                  <span>{i.product.name}</span>
                  <span className="font-semibold text-warn">{i.quantity} left (min {i.product.minimumStock})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
