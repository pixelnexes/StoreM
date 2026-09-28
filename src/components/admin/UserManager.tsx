'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface StoreUser { id: string; name: string; phone: string; email: string | null; role: string; status: string; }

const ROLES = ['OWNER', 'MANAGER', 'CASHIER'] as const;
const emptyForm = { name: '', phone: '', email: '', password: '', role: 'CASHIER' };

/** Super admin user management for one store: list, edit, add, remove. */
export function UserManager({ tenantId, users }: { tenantId: string; users: StoreUser[] }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: '', phone: '', email: '', password: '', role: 'CASHIER', status: 'active' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  function fail(j: any) { setErr(j?.error?.message ?? 'Request failed'); setBusy(false); }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(''); setMsg('');
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/users`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json();
      if (!j.success) return fail(j);
      setMsg(`${form.name} added as ${form.role}.`);
      setForm({ ...emptyForm });
      setAdding(false);
      router.refresh();
    } catch { setErr('Network error'); setBusy(false); }
  }

  async function saveUser(id: string) {
    setBusy(true); setErr(''); setMsg('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...edit, password: edit.password || undefined }),
      });
      const j = await res.json();
      if (!j.success) return fail(j);
      setMsg('User updated.');
      setEditingId(null);
      router.refresh();
    } catch { setErr('Network error'); setBusy(false); }
  }

  async function removeUser(u: StoreUser) {
    if (!confirm(`Remove ${u.name} (${u.phone}) from this store?`)) return;
    setBusy(true); setErr(''); setMsg('');
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
      const j = await res.json();
      if (!j.success) return fail(j);
      setMsg(`${u.name} removed.`);
      router.refresh();
    } catch { setErr('Network error'); setBusy(false); }
  }

  function startEdit(u: StoreUser) {
    setEditingId(u.id);
    setErr(''); setMsg('');
    setEdit({ name: u.name, phone: u.phone, email: u.email ?? '', password: '', role: u.role, status: u.status });
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">Users ({users.length})</h2>
        <button className="btn btn-primary btn-sm" onClick={() => { setAdding(!adding); setErr(''); }}>
          {adding ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {adding && (
        <form onSubmit={createUser} className="mt-4 border-l-2 border-brand bg-surface p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">Name *</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="label">Phone *</label>
              <input className="input tabular-nums" required value={form.phone} placeholder="03001234567"
                onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div><label className="label">Email</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div><label className="label">Temporary password *</label>
              <input className="input" required minLength={8} value={form.password} placeholder="min 8 characters"
                onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select></div>
          </div>
          <button className="btn btn-primary btn-sm mt-3" disabled={busy}>{busy ? 'Adding…' : 'Add user'}</button>
        </form>
      )}

      <ul className="mt-4 divide-y divide-line">
        {users.map((u) => (
          <li key={u.id} className="py-3">
            {editingId === u.id ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div><label className="label">Name</label>
                  <input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></div>
                <div><label className="label">Phone</label>
                  <input className="input tabular-nums" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></div>
                <div><label className="label">Email</label>
                  <input className="input" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} /></div>
                <div><label className="label">New password (optional)</label>
                  <input className="input" minLength={8} value={edit.password} placeholder="leave blank to keep"
                    onChange={(e) => setEdit({ ...edit, password: e.target.value })} /></div>
                <div><label className="label">Role</label>
                  <select className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select></div>
                <div><label className="label">Status</label>
                  <select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select></div>
                <div className="flex gap-2 sm:col-span-2">
                  <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => saveUser(u.id)}>
                    {busy ? 'Saving…' : 'Save user'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-[14px] font-medium">{u.name}</div>
                  <div className="text-[12.5px] text-muted tabular-nums">
                    {u.phone}{u.email ? ` · ${u.email}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge">{u.role}</span>
                  <span className={`badge ${u.status === 'active' ? 'bg-ok-soft text-ok' : 'bg-danger-soft text-danger'}`}>{u.status}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(u)}>Edit</button>
                  <button className="btn btn-ghost btn-sm text-danger" onClick={() => removeUser(u)}>Remove</button>
                </div>
              </div>
            )}
          </li>
        ))}
        {users.length === 0 && <li className="py-4 text-sm text-muted">No users yet.</li>}
      </ul>

      {msg && <p className="mt-3 text-sm text-ok">{msg}</p>}
      {err && <p className="mt-3 text-sm text-danger">{err}</p>}
    </div>
  );
}
