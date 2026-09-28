import { notFound } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPKR } from '@/lib/money';
import { InvoiceActions } from '@/components/InvoiceActions';
import { invoiceMessage } from '@/lib/messaging';

export const dynamic = 'force-dynamic';

export default async function InvoicePage({
  params, searchParams,
}: { params: { id: string }; searchParams: { print?: string } }) {
  const session = (await getSession())!;
  const sale = await prisma.sale.findFirst({
    where: { id: params.id, tenantId: session.tenantId }, // tenant-scoped
    include: {
      items: { include: { product: { select: { name: true } } } },
      customer: true,
      payments: true,
      branch: true,
    },
  });
  if (!sale) notFound();

  const tenant = await prisma.tenant.findUnique({ where: { id: session.tenantId } });

  const waMessage = invoiceMessage({
    store: tenant?.businessName ?? 'Store',
    invoiceNumber: sale.invoiceNumber,
    total: sale.total, paid: sale.paidAmount, outstanding: sale.outstandingAmount,
    items: sale.items.map((i) => ({ name: i.product.name, quantity: i.quantity, unitPrice: i.unitPrice })),
  });

  const methodLabel = sale.payments.map((p) => p.method).join(', ') || (sale.outstandingAmount > 0 ? 'Credit' : '—');

  return (
    <div className="mx-auto max-w-2xl">
      <InvoiceActions autoPrint={searchParams.print === '1'} customerPhone={sale.customer?.phone} message={waMessage} />

      <div className="print-area card">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div>
            <h1 className="text-xl font-semibold">{tenant?.businessName}</h1>
            {tenant?.address && <p className="text-sm text-muted">{tenant.address}</p>}
            {tenant?.phone && <p className="text-sm text-muted">Phone: {tenant.phone}</p>}
            <p className="text-sm text-muted">{sale.branch.name}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">INVOICE</div>
            <div className="text-sm">{sale.invoiceNumber}</div>
            <div className="text-sm text-muted">{sale.createdAt.toLocaleString('en-PK')}</div>
          </div>
        </div>

        {/* Customer */}
        <div className="border-b border-line py-3 text-sm">
          <span className="text-muted">Billed to: </span>
          <b>{sale.customer?.name ?? 'Walk-in customer'}</b>
          {sale.customer?.phone ? ` · ${sale.customer.phone}` : ''}
        </div>

        {/* Items */}
        <table className="my-4 w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-muted">
              <th className="py-2">Item</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Price</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.map((i) => (
              <tr key={i.id} className="border-b border-line">
                <td className="py-2">{i.product.name}</td>
                <td className="py-2 text-right">{i.quantity} {i.unit}</td>
                <td className="py-2 text-right">{formatPKR(i.unitPrice)}</td>
                <td className="py-2 text-right">{formatPKR(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="ml-auto max-w-xs space-y-1 text-sm">
          <Row label="Subtotal" value={formatPKR(sale.subtotal)} />
          {sale.discount > 0 && <Row label="Discount" value={`- ${formatPKR(sale.discount)}`} />}
          {sale.tax > 0 && <Row label="Tax" value={formatPKR(sale.tax)} />}
          <div className="flex justify-between border-t border-line pt-1 text-base font-bold">
            <span>Total</span><span>{formatPKR(sale.total)}</span>
          </div>
          <Row label="Paid" value={formatPKR(sale.paidAmount)} />
          {sale.outstandingAmount > 0 && (
            <div className="flex justify-between font-semibold text-warn">
              <span>Balance due</span><span>{formatPKR(sale.outstandingAmount)}</span>
            </div>
          )}
          <Row label="Payment" value={methodLabel} />
        </div>

        <p className="mt-6 border-t border-line pt-3 text-center text-xs text-muted">Thank you for your business!</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between"><span className="text-muted">{label}</span><span>{value}</span></div>;
}
