'use client';
import { useMemo, useState } from 'react';

interface Cust { id: string; name: string; phone: string; balance: number; purchases: number; }

export function MarketingComposer({ store, customers }: { store: string; customers: Cust[] }) {
  const [segment, setSegment] = useState<'ALL' | 'CREDIT' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [type, setType] = useState<'MARKETING' | 'CREDIT_REMINDER'>('MARKETING');
  const [message, setMessage] = useState('We have fresh stock and special offers this week. Visit us soon!');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState('');

  const filtered = useMemo(() => customers.filter((c) => {
    if (segment === 'CREDIT') return c.balance > 0;
    if (segment === 'ACTIVE') return c.purchases > 0;
    if (segment === 'INACTIVE') return c.purchases === 0;
    return true;
  }), [customers, segment]);

  const selectedList = filtered.filter((c) => selected[c.id]);
  const allSelected = filtered.length > 0 && filtered.every((c) => selected[c.id]);

  function toggleAll() {
    if (allSelected) setSelected({});
    else { const next: Record<string, boolean> = {}; filtered.forEach((c) => (next[c.id] = true)); setSelected(next); }
  }

  function composed() { return `*${store}*\n${message}`; }

  async function sendBulk() {
    const recipients = selectedList.length ? selectedList : filtered;
    if (recipients.length === 0) return;
    setStatus(`Queuing ${recipients.length} message(s)…`);
    const res = await fetch('/api/v1/messages/bulk', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, body: composed(), recipients: recipients.map((c) => ({ phone: c.phone, name: c.name })) }),
    });
    const j = await res.json();
    if (!j.success) { setStatus(j.error?.message ?? 'Failed'); return; }
    const links: string[] = j.data.results.map((r: { link?: string }) => r.link).filter(Boolean);
    setStatus(`${j.data.count} message(s) logged. Opening WhatsApp for each…`);
    // Open each chat sequentially (browser may ask to allow multiple popups the first time).
    links.forEach((link, i) => setTimeout(() => window.open(link, '_blank'), i * 600));
  }

  async function sendOne(c: Cust) {
    const res = await fetch('/api/v1/messages', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: c.phone, type, body: composed() }),
    });
    const j = await res.json();
    if (j.success && j.data.link) window.open(j.data.link, '_blank');
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label">Message type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="MARKETING">Marketing / offer</option>
              <option value="CREDIT_REMINDER">Credit reminder</option>
            </select>
          </div>
          <div>
            <label className="label">Audience segment</label>
            <select className="input" value={segment} onChange={(e) => { setSegment(e.target.value as typeof segment); setSelected({}); }}>
              <option value="ALL">All customers</option>
              <option value="ACTIVE">Active (has purchases)</option>
              <option value="INACTIVE">Inactive (no purchases)</option>
              <option value="CREDIT">Customers with credit</option>
            </select>
          </div>
          <div className="flex items-end text-sm text-muted">{filtered.length} in segment · {selectedList.length || filtered.length} will receive</div>
        </div>
        <div className="mt-3">
          <label className="label">Message</label>
          <textarea className="input min-h-[90px]" value={message} onChange={(e) => setMessage(e.target.value)} />
          <p className="mt-1 text-xs text-muted">Preview: <span className="italic">{composed()}</span></p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button onClick={sendBulk} className="btn btn-primary btn-sm">
            Send to {selectedList.length ? `${selectedList.length} selected` : `all ${filtered.length}`}
          </button>
          {status && <span className="text-sm text-muted">{status}</span>}
        </div>
      </div>

      <div className="card p-0">
        <div className="flex items-center justify-between p-4">
          <h2 className="font-semibold">Recipients</h2>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} /> Select all
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-canvas"><tr><th className="th w-8"></th><th className="th">Customer</th><th className="th">Phone</th><th className="th text-right">Outstanding</th><th className="th text-right">Send</th></tr></thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t border-line">
                  <td className="td"><input type="checkbox" checked={!!selected[c.id]} onChange={() => setSelected((s) => ({ ...s, [c.id]: !s[c.id] }))} /></td>
                  <td className="td font-medium">{c.name}</td>
                  <td className="td">{c.phone}</td>
                  <td className="td text-right">{c.balance > 0 ? 'Rs. ' + c.balance.toLocaleString('en-PK') : '—'}</td>
                  <td className="td text-right"><button onClick={() => sendOne(c)} className="btn btn-ghost btn-sm">WhatsApp</button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="td p-6 text-center text-muted">No customers in this segment.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-muted">Select All then “Send to all” logs every message and opens WhatsApp for each recipient. For fully automated one-click bulk sending to thousands, connect a WhatsApp Business API (WHATSAPP_API_URL / WHATSAPP_API_TOKEN) — the same button will then send without opening tabs.</p>
    </div>
  );
}
