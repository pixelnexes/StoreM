import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';
import { AddProductForm } from '@/components/AddProductForm';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const session = (await getSession())!;
  const products = await prisma.product.findMany({
    where: { tenantId: session.tenantId },
    include: { inventory: { select: { quantity: true } } },
    orderBy: { name: 'asc' },
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <AddProductForm />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-canvas">
            <tr>
              <th className="th">Photo</th><th className="th">Product</th><th className="th">Code</th><th className="th">Unit</th>
              <th className="th text-right">Purchase</th><th className="th text-right">Selling</th>
              <th className="th text-right">In stock</th><th className="th text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stock = p.inventory.reduce((s, i) => s + i.quantity, 0);
              const low = p.minimumStock > 0 && stock <= p.minimumStock;
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="td">
                    <div className="h-10 w-10 overflow-hidden rounded-md bg-canvas">
                      {p.image
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        : <span className="flex h-full w-full items-center justify-center text-[11px] font-medium uppercase text-muted">{p.name.charAt(0)}</span>}
                    </div>
                  </td>
                  <td className="td font-medium">{p.name}</td>
                  <td className="td">{p.sku ?? '—'}</td>
                  <td className="td">{p.baseUnit}</td>
                  <td className="td text-right">{formatPKR(p.purchasePrice)}</td>
                  <td className="td text-right">{formatPKR(p.sellingPrice)}</td>
                  <td className="td text-right font-semibold">{stock}</td>
                  <td className="td text-right">{low ? <span className="text-warn">Low</span> : <span className="text-ok">OK</span>}</td>
                </tr>
              );
            })}
            {products.length === 0 && <tr><td colSpan={8} className="td p-6 text-center text-muted">No products yet. Add a product, then receive stock via Purchases.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
