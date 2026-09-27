import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function SalesPage() {
  const session = (await getSession())!;
  const sales = await prisma.sale.findMany({
    where: { tenantId: session.tenantId },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }, take: 100,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sales</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-canvas text-left text-muted"><tr><th className="p-3">Invoice</th><th>Date</th><th>Customer</th><th className="text-right">Total</th><th className="text-right">Paid</th><th className="text-right">Outstanding</th><th className="text-right">Status</th><th></th></tr></thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="p-3 font-medium">{s.invoiceNumber}</td>
                <td>{s.createdAt.toLocaleDateString('en-PK')}</td>
                <td>{s.customer?.name ?? 'Walk-in'}</td>
                <td className="text-right">{formatPKR(s.total)}</td>
                <td className="text-right">{formatPKR(s.paidAmount)}</td>
                <td className="text-right">{formatPKR(s.outstandingAmount)}</td>
                <td className="text-right"><span className="badge">{s.status}</span></td>
                <td className="p-3 text-right"><Link href={`/app/invoices/${s.id}`} className="text-brand hover:underline">Invoice →</Link></td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted">No sales yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
