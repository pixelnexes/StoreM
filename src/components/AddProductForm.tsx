'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const UNITS = ['piece', 'packet', 'box', 'carton', 'kg', 'gram', 'liter', 'bottle'];

export function AddProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setMsg('');
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/v1/upload', { method: 'POST', body: fd });
      const j = await res.json();
      if (!j.success) { setMsg(j.error?.message ?? 'Image upload failed'); return; }
      setImageUrl(j.data.url);
    } catch { setMsg('Image upload failed'); }
    finally { setUploading(false); }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get('name'),
      sku: fd.get('sku') || undefined,
      barcode: fd.get('barcode') || undefined,
      image: imageUrl || undefined,
      baseUnit: fd.get('baseUnit'),
      purchasePrice: Number(fd.get('purchasePrice') || 0),
      sellingPrice: Number(fd.get('sellingPrice') || 0),
      minimumStock: Number(fd.get('minimumStock') || 0),
    };
    try {
      const res = await fetch('/api/v1/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!j.success) { setMsg(j.error?.message ?? 'Failed to add product'); return; }
      setOpen(false); setImageUrl(''); router.refresh();
    } catch { setMsg('Network error'); }
    finally { setBusy(false); }
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">+ Add product</button>;

  return (
    <form onSubmit={submit} className="card w-full max-w-3xl">
      <div className="flex gap-5">
        {/* Image */}
        <div className="shrink-0">
          <label className="label">Photo</label>
          <label className="flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line bg-canvas text-center text-xs text-muted hover:border-brand">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="product" className="h-full w-full object-cover" />
            ) : (uploading ? 'Uploading…' : 'Click to upload')}
            <input type="file" accept="image/*" className="hidden" onChange={onPickImage} />
          </label>
          <p className="mt-1 w-28 text-[11px] text-muted">Helps cashiers recognise items.</p>
        </div>

        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Product name *</label><input name="name" required className="input" placeholder="e.g. Biscuits — Company X" /></div>
          <div><label className="label">Product code / SKU</label><input name="sku" className="input" placeholder="e.g. BIS-01 (your choice)" /></div>
          <div><label className="label">Barcode</label><input name="barcode" className="input" /></div>
          <div>
            <label className="label">Unit of measure</label>
            <select name="baseUnit" className="input" defaultValue="piece">
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div><label className="label">Low-stock alert at</label><input name="minimumStock" type="number" min={0} defaultValue={0} className="input" /></div>
          <div><label className="label">Purchase price (per unit)</label><input name="purchasePrice" type="number" min={0} defaultValue={0} className="input" /></div>
          <div><label className="label">Selling price (per unit)</label><input name="sellingPrice" type="number" min={0} defaultValue={0} className="input" /></div>
        </div>
      </div>
      {msg && <p className="mt-2 text-sm text-danger">{msg}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={busy || uploading} className="btn btn-primary btn-sm">{busy ? 'Saving…' : 'Save product'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
      </div>
      <p className="mt-2 text-xs text-muted">Add opening stock from <b>Purchases</b> so every unit is tracked with its cost.</p>
    </form>
  );
}
