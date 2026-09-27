'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { THEMES } from '@/lib/theme';

export function ThemeSelector({ current, brandName }: { current: string; brandName: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState(current);
  const [name, setName] = useState(brandName);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    setSaving(true); setMsg('');
    try {
      const res = await fetch('/api/admin/theme', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ themeKey: selected, brandName: name }),
      });
      const j = await res.json();
      if (!j.success) { setMsg(j.error?.message ?? 'Failed'); return; }
      setMsg('Saved. The theme has been applied across the whole platform.');
      router.refresh(); // re-renders root layout with new data-theme
    } catch { setMsg('Network error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="card">
      <h2 className="font-semibold">Platform Theme</h2>
      <p className="mt-1 text-sm text-muted">Choose a sober theme — it applies across the whole platform (landing page and all portals).</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {THEMES.map((t) => (
          <button key={t.key} onClick={() => setSelected(t.key)}
            className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected === t.key ? 'border-brand ring-2 ring-brand/30' : 'border-line hover:border-brand'}`}>
            <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: t.swatch }} />
            <span>
              <span className="block text-sm font-semibold">{t.name}</span>
              <span className="block text-xs text-muted">{t.description}</span>
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4 max-w-xs">
        <label className="label">Brand name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {msg && <p className="mt-3 text-sm text-green-600">{msg}</p>}
      <button onClick={save} disabled={saving} className="btn btn-primary mt-4">{saving ? 'Saving…' : 'Save theme'}</button>
    </div>
  );
}
