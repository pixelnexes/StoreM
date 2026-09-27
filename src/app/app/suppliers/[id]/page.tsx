import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function SupplierDetail({ params }: { params: { id: string } }) {
  const session = (await getSession())!;
  const supplier = await prisma.supplier.findFirst({
    where: { id: params.id, tenantId: session.tenantId },
    include: {
      purchases: {
        include: { items: { include: { product: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!supplier) notFound();

  const totalBought = supplier.purchases.reduce((s, p) => s + p.total, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/app/suppliers" className="text-sm text-brand hover:underline">← Suppliers</Link>
        <h1 className="text-2xl font-bold">{supplier.name}</h1>
        <p className="text-sm text-muted">{supplier.phone ?? 'No phone'}{supplier.address ? ` · ${supplier.address}` : ''}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card"><div className="text-xs uppercase tracking-wide text-muted">Total purchased</div><div className="mt-1 text-2xl font-extrabold">{formatPKR(totalBought)}</div></div>
        <div className="card"><div className="text-xs uppercase tracking-wide text-muted">Purchase orders</div><div className="mt-1 text-2xl font-extrabold">{supplier.purchases.length}</div></div>
      </div>

      <div className="card p-0">
        <h2 className="p-4 font-semibold">Stock received (purchase history)</h2>
        <div className="divide-y divide-line">
          {supplier.purchases.map((p) => (
            <div key={p.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-muted">{p.createdAt.toLocaleString('en-PK')}</span>
                <span className="text-sm">Total <b>{formatPKR(p.total)}</b> <span className="badge ml-2">{p.status}</span></span>
              </div>
              <table className="mt-2 w-full text-sm">
                <tbody>
                  {p.items.map((i) => (
                    <tr key={i.id} className="text-muted">
                      <td className="py-1">{i.product.name}</td>
                      <td className="py-1 text-right">{i.quantity} × {formatPKR(i.unitCost)}</td>
                      <td className="py-1 text-right font-medium text-ink">{formatPKR(i.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {supplier.purchases.length === 0 && <p className="p-4 text-sm text-muted">No purchases recorded from this supplier yet.</p>}
        </div>
      </div>
    </div>
  );
}
