'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Plan { key: string; name: string; }

export function CreateTenantForm({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setMsg('');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: fd.get('businessName'), ownerName: fd.get('ownerName'),
          phone: fd.get('phone'), email: fd.get('email') || '', password: fd.get('password'),
          planKey: fd.get('planKey'), status: fd.get('status'),
        }),
      });
      const j = await res.json();
      if (!j.success) { setMsg(j.error?.message ?? 'Failed to create store'); return; }
      setMsg(`Created ${j.data.businessName}. Owner can log in with their phone & password.`);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    } catch { setMsg('Network error'); }
    finally { setBusy(false); }
  }

  if (!open) return <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">+ Create store owner</button>;

  return (
    <form onSubmit={submit} className="card w-full">
      <h2 className="font-semibold">Create a new store owner</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><label className="label">Business name *</label><input name="businessName" required className="input" /></div>
        <div><label className="label">Owner name *</label><input name="ownerName" required className="input" /></div>
        <div><label className="label">Owner phone *</label><input name="phone" required className="input" placeholder="03001234567" /></div>
        <div><label className="label">Email (optional)</label><input name="email" type="email" className="input" /></div>
        <div><label className="label">Temporary password *</label><input name="password" required minLength={8} className="input" placeholder="min 8 characters" /></div>
        <div>
          <label className="label">Plan *</label>
          <select name="planKey" required className="input">{plans.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}</select>
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" className="input" defaultValue="ACTIVE"><option value="ACTIVE">Active</option><option value="TRIAL">Trial</option></select>
        </div>
      </div>
      {msg && <p className="mt-2 text-sm text-ok">{msg}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={busy} className="btn btn-primary btn-sm">{busy ? 'Creating…' : 'Create store'}</button>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">Close</button>
      </div>
    </form>
  );
}
