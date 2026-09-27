import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';
import { profitFromTotals } from '@/domain/profit';

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = (await getSession())!;
  const tenantId = session.tenantId;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);

  const [items, expenses, purchases] = await Promise.all([
    prisma.saleItem.findMany({ where: { sale: { tenantId, createdAt: { gte: monthStart } } }, select: { quantity: true, unitPrice: true, unitCost: true, discount: true } }),
    prisma.expense.aggregate({ where: { tenantId, date: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.purchase.aggregate({ where: { tenantId, createdAt: { gte: monthStart } }, _sum: { total: true } }),
  ]);

  const revenue = items.reduce((s, i) => s + i.quantity * i.unitPrice - i.discount, 0);
  const cogs = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const p = profitFromTotals(revenue, cogs, expenses._sum.amount ?? 0);

  const rows: [string, string][] = [
    ['Revenue (This Month)', formatPKR(p.revenue)],
    ['Cost of Goods Sold (COGS)', formatPKR(p.cogs)],
    ['Gross Profit', formatPKR(p.grossProfit)],
    ['Operating Expenses', formatPKR(p.expenses)],
    ['Net Profit', formatPKR(p.netProfit)],
    ['Gross Margin', `${p.margin}%`],
    ['Purchases (This Month)', formatPKR(purchases._sum.total ?? 0)],
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reports — Profit &amp; Loss</h1>
      <p className="text-sm text-muted">Accurate profit based on true cost of goods sold (not simply Sales − Purchases). From {monthStart.toLocaleDateString('en-PK')} to date.</p>
      <div className="card max-w-xl">
        <table className="w-full text-sm">
          <tbody>
            {rows.map(([l, v], i) => (
              <tr key={l} className={`${i >= 4 ? 'font-bold' : ''} border-b border-line last:border-0`}>
                <td className="py-3 text-muted">{l}</td>
                <td className="py-3 text-right">{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
