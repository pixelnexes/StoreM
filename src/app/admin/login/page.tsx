'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';
import { AuthInput } from '@/components/AuthInput';

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
    <AuthShell
      statement="Behind the platform."
      support="Stores, subscriptions and the theme every tenant is served with."
      footnote="Restricted access · all actions are logged"
    >
      <span className="eyebrow">Restricted</span>
      <h1 className="mt-4 text-[28px] leading-tight">Super admin</h1>
      <p className="mt-2 text-[14px] text-muted">
        Platform-wide controls for MarkazOS.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4" autoComplete="off">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <AuthInput
            id="email"
            name="email"
            type="email"
            required
            className="input"
            placeholder="admin@store.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <AuthInput
            id="password"
            name="password"
            type="password"
            required
            className="input"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p role="alert" className="border-l-2 border-danger/60 pl-3 py-0.5 text-[13px] text-danger">
            {error}
          </p>
        )}

        <button disabled={loading} className="btn btn-primary w-full py-3">
          {loading ? 'Please wait…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-7 border-t border-line pt-4 text-[13px] text-muted">
        <Link href="/login" className="transition-colors hover:text-ink">
          ← Store owner sign in
        </Link>
      </p>
    </AuthShell>
  );
}
