import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AddSupplierForm } from '@/components/AddSupplierForm';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const session = (await getSession())!;
  const suppliers = await prisma.supplier.findMany({
    where: { tenantId: session.tenantId },
    include: { _count: { select: { purchases: true } } },
    orderBy: { name: 'asc' },
  });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <AddSupplierForm />
      </div>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="bg-canvas"><tr><th className="th">Name</th><th className="th">Phone</th><th className="th">WhatsApp</th><th className="th text-right">Purchases</th><th className="th"></th></tr></thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id} className="border-t border-line">
                <td className="td font-medium">{s.name}</td>
                <td className="td">{s.phone ?? '—'}</td>
                <td className="td">{s.whatsapp ?? '—'}</td>
                <td className="td text-right">{s._count.purchases}</td>
                <td className="td text-right"><Link href={`/app/suppliers/${s.id}`} className="text-brand hover:underline">Detail →</Link></td>
              </tr>
            ))}
            {suppliers.length === 0 && <tr><td colSpan={5} className="td p-6 text-center text-muted">No suppliers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
