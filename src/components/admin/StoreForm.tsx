'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PlanOption { id: string; name: string; priceMonthly: number; active: boolean; }

export interface StoreProfile {
  id: string;
  businessName: string;
  businessType: string;
  phone: string;
  email: string;
  address: string;
  planId?: string;
  subStatus?: string;
}

/** Super admin form: store identity, plan assignment and subscription status. */
export function StoreForm({ store, plans }: { store: StoreProfile; plans: PlanOption[] }) {
  const router = useRouter();
  const [f, setF] = useState(store);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  function set<K extends keyof StoreProfile>(k: K, v: string) { setF({ ...f, [k]: v }); }

  async function save() {
    setBusy(true); setMsg(''); setErr('');
    try {
      const res = await fetch(`/api/admin/tenants/${store.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: f.businessName,
          businessType: f.businessType ?? '',
          phone: f.phone,
          email: f.email ?? '',
          address: f.address ?? '',
          planId: f.planId,
          subStatus: f.subStatus,
        }),
      });
      const j = await res.json();
      if (!j.success) { setErr(j.error?.message ?? 'Could not save this store'); return; }
      setMsg('Saved.');
      router.refresh();
    } catch { setErr('Network error'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card p-5">
      <h2 className="font-semibold">Store details</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div><label className="label">Business name *</label>
          <input className="input" value={f.businessName} onChange={(e) => set('businessName', e.target.value)} /></div>
        <div><label className="label">Business type</label>
          <input className="input" value={f.businessType ?? ''} placeholder="General Store"
            onChange={(e) => set('businessType', e.target.value)} /></div>
        <div><label className="label">Phone</label>
          <input className="input tabular-nums" value={f.phone ?? ''} placeholder="03001234567"
            onChange={(e) => set('phone', e.target.value)} /></div>
        <div><label className="label">Email</label>
          <input className="input" type="email" value={f.email ?? ''} onChange={(e) => set('email', e.target.value)} /></div>
        <div className="sm:col-span-2"><label className="label">Address</label>
          <input className="input" value={f.address ?? ''} onChange={(e) => set('address', e.target.value)} /></div>

        <div><label className="label">Plan</label>
          <select className="input" value={f.planId ?? ''} onChange={(e) => set('planId', e.target.value)}>
            <option value="">No plan</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.active ? '' : ' (archived)'}{p.priceMonthly ? ` — Rs ${p.priceMonthly.toLocaleString('en-PK')}/mo` : ''}
              </option>
            ))}
          </select></div>

        <div><label className="label">Subscription status</label>
          <select className="input" value={f.subStatus ?? 'TRIAL'} onChange={(e) => set('subStatus', e.target.value)}>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="CANCELLED">Cancelled</option>
          </select></div>
      </div>

      {msg && <p className="mt-3 text-sm text-ok">{msg}</p>}
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary btn-sm" disabled={busy || !f.businessName.trim()} onClick={save}>
          {busy ? 'Saving…' : 'Save store'}
        </button>
      </div>
    </div>
  );
}
