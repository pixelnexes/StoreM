'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MODULES, MODULE_KEYS } from '@/lib/modules';

export interface EditablePlan {
  id: string;
  key: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  active: boolean;
  modules: string[];
}

/** One plan card in the super admin plans editor. Saves via PATCH /api/admin/plans/[id]. */
export function PlanEditor({ plan }: { plan: EditablePlan }) {
  const router = useRouter();
  const [name, setName] = useState(plan.name);
  const [price, setPrice] = useState(String(plan.priceMonthly));
  const [active, setActive] = useState(plan.active);
  const [modules, setModules] = useState<string[]>(plan.modules);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const yearly = Math.max(0, Number.parseInt(price, 10) || 0) * 12;

  function toggle(key: string) {
    setModules((m) => (m.includes(key) ? m.filter((k) => k !== key) : [...m, key]));
  }

  async function save() {
    setBusy(true); setMsg(''); setErr('');
    try {
      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, priceMonthly: Number.parseInt(price, 10) || 0, priceYearly: yearly, active, modules }),
      });
      const j = await res.json();
      if (!j.success) { setErr(j.error?.message ?? 'Could not save this plan'); return; }
      setMsg('Saved.');
      router.refresh();
    } catch { setErr('Network error'); }
    finally { setBusy(false); }
  }

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="eyebrow">{plan.key}</span>
          <h2 className="mt-1 text-lg font-semibold">{plan.name}</h2>
        </div>
        <span className={`badge ${active ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`}>
          {active ? 'Active' : 'Hidden'}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label">Plan name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Price (PKR / month)</label>
          <input className="input tabular-nums" inputMode="numeric" value={price}
            onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} />
          <p className="mt-1 text-[12px] text-muted tabular-nums">Yearly: Rs {yearly.toLocaleString('en-PK')}</p>
        </div>
      </div>

      <fieldset className="mt-4">
        <legend className="label">Modules included ({modules.length} of {MODULE_KEYS.length})</legend>
        <div className="mt-1 grid gap-2 sm:grid-cols-2">
          {MODULES.map((m) => {
            const on = modules.includes(m.key);
            return (
              <label key={m.key}
                className={`flex cursor-pointer items-center gap-2 border px-3 py-2 text-[13px] ${on ? 'border-brand bg-brand-soft' : 'border-line bg-surface'}`}>
                <input type="checkbox" checked={on} onChange={() => toggle(m.key)} className="accent-brand" />
                {m.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-4 flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="accent-brand" />
        Offer this plan to new stores
      </label>

      {msg && <p className="mt-3 text-sm text-ok">{msg}</p>}
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}

      <div className="mt-4 flex gap-2">
        <button className="btn btn-primary btn-sm" disabled={busy || modules.length === 0} onClick={save}>
          {busy ? 'Saving…' : 'Save plan'}
        </button>
        {modules.length === 0 && <span className="self-center text-[12px] text-danger">A plan needs at least one module.</span>}
      </div>
    </div>
  );
}
