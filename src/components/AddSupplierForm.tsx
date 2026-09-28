'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddSupplierForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/v1/suppliers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fd.get('name'), phone: fd.get('phone') || undefined, whatsapp: fd.get('whatsapp') || undefined, address: fd.get('address') || undefined }),
      });
      const j = await res.json();
      if (!j.success) { setMsg(j.error?.message ?? 'Failed to add supplier'); return; }
      setOpen(false); router.refresh();
    } catch { setMsg('Network error'); }
    finally { setBusy(false); }
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">+ Add supplier</button>;

  return (
    <form onSubmit={submit} className="card w-full max-w-xl">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Name *</label><input name="name" required className="input" placeholder="Supplier / company name" /></div>
        <div><label className="label">Phone</label><input name="phone" className="input" placeholder="03001234567" /></div>
        <div><label className="label">WhatsApp</label><input name="whatsapp" className="input" /></div>
        <div><label className="label">Address</label><input name="address" className="input" /></div>
      </div>
      {msg && <p className="mt-2 text-sm text-danger">{msg}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={busy} className="btn btn-primary btn-sm">{busy ? 'Saving…' : 'Save supplier'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
      </div>
    </form>
  );
}
