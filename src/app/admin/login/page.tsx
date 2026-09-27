'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(''); setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
      });
      const j = await res.json();
      if (!j.success) { setError(j.error?.message ?? 'Login failed'); return; }
      router.push('/admin'); router.refresh();
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-soft to-canvas px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-xl font-extrabold">MarkazOS · Super Admin</div>
        <form onSubmit={submit} className="card space-y-3">
          <div><label className="label">Email</label><input name="email" type="email" required className="input" defaultValue="superadmin@markazos.app" /></div>
          <div><label className="label">Password</label><input name="password" type="password" required className="input" defaultValue="admin1234" /></div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="btn btn-primary w-full py-3">{loading ? 'Please wait…' : 'Login'}</button>
        </form>
        <p className="mt-4 text-center text-sm"><Link href="/login" className="text-brand hover:underline">← Store owner login</Link></p>
      </div>
    </main>
  );
}
