import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';
import { PurchaseForm } from '@/components/PurchaseForm';

export const dynamic = 'force-dynamic';

export default async function PurchasesPage() {
  const session = (await getSession())!;
  const tenantId = session.tenantId;
  const [branch, products, suppliers, purchases] = await Promise.all([
    prisma.branch.findFirst({ where: { tenantId, status: 'active' }, orderBy: { createdAt: 'asc' } }),
    prisma.product.findMany({ where: { tenantId }, select: { id: true, name: true, purchasePrice: true, baseUnit: true }, orderBy: { name: 'asc' } }),
    prisma.supplier.findMany({ where: { tenantId }, select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.purchase.findMany({ where: { tenantId }, include: { supplier: { select: { name: true } }, _count: { select: { items: true } } }, orderBy: { createdAt: 'desc' }, take: 50 }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Purchases — Receive Stock</h1>

      {products.length === 0 ? (
        <div className="card text-sm text-muted">Add products first (Inventory → Add product), then receive stock here.</div>
      ) : (
        <PurchaseForm branchId={branch?.id ?? ''} products={products} suppliers={suppliers} />
      )}

      <div className="card p-0">
        <h2 className="p-4 font-semibold">Purchase history</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas"><tr><th className="th">Date</th><th className="th">Supplier</th><th className="th text-right">Items</th><th className="th text-right">Total</th><th className="th text-right">Status</th></tr></thead>
            <tbody>
              {purchases.map((p) => (
                <tr key={p.id} className="border-t border-line">
                  <td className="td">{p.createdAt.toLocaleDateString('en-PK')}</td>
                  <td className="td">{p.supplier?.name ?? '—'}</td>
                  <td className="td text-right">{p._count.items}</td>
                  <td className="td text-right">{formatPKR(p.total)}</td>
                  <td className="td text-right"><span className="badge">{p.status}</span></td>
                </tr>
              ))}
              {purchases.length === 0 && <tr><td colSpan={5} className="td p-6 text-center text-muted">No purchases yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
