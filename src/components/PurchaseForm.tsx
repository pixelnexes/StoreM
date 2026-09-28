'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Product { id: string; name: string; purchasePrice: number; baseUnit: string; }
interface Supplier { id: string; name: string; }
interface Row { productId: string; quantity: number; unitCost: number; }

const fmt = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-PK');

export function PurchaseForm({ branchId, products, suppliers }: { branchId: string; products: Product[]; suppliers: Supplier[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const addRow = () => setRows((r) => [...r, { productId: products[0]?.id ?? '', quantity: 1, unitCost: products[0]?.purchasePrice ?? 0 }]);
  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, ...patch } : row));
  const remove = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const total = rows.reduce((s, r) => s + r.quantity * r.unitCost, 0);

  async function submit() {
    setMsg('');
    if (rows.length === 0) { setMsg('Add at least one item.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/v1/purchases', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId, supplierId: supplierId || null, items: rows }),
      });
      const j = await res.json();
      if (!j.success) { setMsg(j.error?.message ?? 'Failed to save purchase'); return; }
      setOpen(false); setRows([]); setSupplierId(''); router.refresh();
    } catch { setMsg('Network error'); }
    finally { setBusy(false); }
  }

  if (!open) return <button onClick={() => { setOpen(true); if (rows.length === 0) addRow(); }} className="btn btn-primary btn-sm">+ Receive stock</button>;

  return (
    <div className="card w-full">
      <h2 className="font-semibold">Receive stock (new purchase)</h2>
      <div className="mt-3 max-w-xs">
        <label className="label">Supplier (optional)</label>
        <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">— None —</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <div className="min-w-[180px] flex-1">
              <label className="label">Product</label>
              <select className="input" value={row.productId}
                onChange={(e) => { const p = products.find(x => x.id === e.target.value); update(i, { productId: e.target.value, unitCost: p?.purchasePrice ?? row.unitCost }); }}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.baseUnit})</option>)}
              </select>
            </div>
            <div className="w-24"><label className="label">Qty</label><input type="number" min={1} className="input" value={row.quantity} onChange={(e) => update(i, { quantity: Number(e.target.value) || 1 })} /></div>
            <div className="w-28"><label className="label">Cost/unit</label><input type="number" min={0} className="input" value={row.unitCost} onChange={(e) => update(i, { unitCost: Number(e.target.value) || 0 })} /></div>
            <div className="w-28 text-right"><label className="label">Line</label><div className="py-2.5 font-semibold">{fmt(row.quantity * row.unitCost)}</div></div>
            <button onClick={() => remove(i)} className="pb-3 text-muted hover:text-danger">×</button>
          </div>
        ))}
      </div>

      <button onClick={addRow} className="mt-2 text-sm font-medium text-brand hover:underline">+ Add another item</button>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
        <div className="text-lg font-bold">Total: {fmt(total)}</div>
        <div className="flex gap-2">
          {msg && <span className="self-center text-sm text-danger">{msg}</span>}
          <button onClick={submit} disabled={busy} className="btn btn-primary btn-sm">{busy ? 'Saving…' : 'Save & add to stock'}</button>
          <button onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted">This increases inventory for each item and updates its cost price for accurate profit.</p>
    </div>
  );
}
