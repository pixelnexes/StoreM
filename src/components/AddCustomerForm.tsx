'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AddCustomerForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('name') || '').trim();
    const phone = String(fd.get('phone') || '').trim();
    if (!phone) { setMsg('Phone number is required for every customer.'); setBusy(false); return; }
    try {
      const res = await fetch('/api/v1/customers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, whatsappPhone: fd.get('whatsapp') || undefined, address: fd.get('address') || undefined }),
      });
      const j = await res.json();
      if (!j.success) { setMsg(j.error?.message ?? 'Failed to add customer'); return; }
      if (j.data.existing) { setMsg('A customer with this phone already exists — their profile is shown in the list.'); }
      else { setOpen(false); }
      router.refresh();
    } catch { setMsg('Network error'); }
    finally { setBusy(false); }
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">+ Add customer</button>;

  return (
    <form onSubmit={submit} className="card w-full max-w-xl">
      <div className="grid gap-3 sm:grid-cols-2">
        <div><label className="label">Name *</label><input name="name" required className="input" placeholder="Customer name" /></div>
        <div><label className="label">Phone number *</label><input name="phone" required className="input" placeholder="03001234567" /></div>
        <div><label className="label">WhatsApp (optional)</label><input name="whatsapp" className="input" placeholder="Same as phone if blank" /></div>
        <div><label className="label">Address (optional)</label><input name="address" className="input" /></div>
      </div>
      {msg && <p className="mt-2 text-sm text-amber-600">{msg}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={busy} className="btn btn-primary btn-sm">{busy ? 'Saving…' : 'Save customer'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Cancel</button>
      </div>
      <p className="mt-2 text-xs text-muted">Phone is mandatory so every customer can be reached for reminders and marketing.</p>
    </form>
  );
}
