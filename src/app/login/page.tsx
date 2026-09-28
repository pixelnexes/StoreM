'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AuthShell } from '@/components/AuthShell';

function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>(params.get('tab') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(''); setLoading(true);
    const fd = new FormData(e.currentTarget);
    const url = tab === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const payload = tab === 'login'
      ? { phone: fd.get('phone'), password: fd.get('password') }
      : {
          name: fd.get('name'), businessName: fd.get('businessName'),
          phone: fd.get('phone'), email: fd.get('email') || '', password: fd.get('password'),
        };
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!json.success) { setError(json.error?.message ?? 'Something went wrong'); return; }
      router.push(json.data.redirect ?? '/app');
      router.refresh();
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  const tabs: [typeof tab, string][] = [['login', 'Log in'], ['register', 'Sign up']];

  return (
    <>
      <div className="flex gap-6 border-b border-line">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => { setTab(key); setError(''); }}
            className={`-mb-px border-b-2 pb-3 text-[14px] transition-colors ${
              tab === key
                ? 'border-brand font-medium text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <h1 className="text-[28px] leading-tight">
          {tab === 'login' ? 'Welcome back.' : 'Open your store.'}
        </h1>
        <p className="mt-2 text-[14px] text-muted">
          {tab === 'login'
            ? 'Sign in to pick up where the counter left off.'
            : 'Fourteen days free. No card, no contract.'}
        </p>
      </div>

      <form onSubmit={submit} className="mt-7 space-y-4">
        {tab === 'register' && (
          <>
            <div>
              <label className="label" htmlFor="name">Your name</label>
              <input id="name" name="name" required className="input" placeholder="e.g. Ubaer" />
            </div>
            <div>
              <label className="label" htmlFor="businessName">Business name</label>
              <input id="businessName" name="businessName" required className="input" placeholder="e.g. Ubaer General Store" />
            </div>
            <div>
              <label className="label" htmlFor="email">Email <span className="font-normal text-muted">— optional</span></label>
              <input id="email" name="email" type="email" className="input" placeholder="owner@store.com" />
            </div>
          </>
        )}

        <div>
          <label className="label" htmlFor="phone">Mobile number</label>
          <input
            id="phone"
            name="phone"
            required
            className="input tabular-nums"
            placeholder="03001234567"
            defaultValue={tab === 'login' ? '03001234567' : ''}
          />
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="input"
            placeholder="••••••••"
            defaultValue={tab === 'login' ? 'owner1234' : ''}
          />
        </div>

        {error && (
          <p role="alert" className="border-l-2 border-danger/60 pl-3 py-0.5 text-[13px] text-danger">
            {error}
          </p>
        )}

        <button disabled={loading} className="btn btn-primary w-full py-3">
          {loading ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Create account and store'}
        </button>
      </form>

      <p className="mt-7 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">
        {tab === 'login' ? (
          <>
            Demo owner — <span className="tabular-nums text-ink">03001234567</span>{' / '}
            <span className="text-ink">owner1234</span>
          </>
        ) : (
          'Your data stays yours and remains exportable.'
        )}
      </p>

      <p className="mt-3 text-[13px] text-muted">
        <Link href="/admin/login" className="transition-colors hover:text-ink">
          Super admin sign in →
        </Link>
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      statement="The whole shop, in one book."
      support="Stock, sales, udhaar and cash in a single record — so closing time takes minutes, not hours."
      footnote="© 2026 MarkazOS by Zoqonyx"
    >
      <Suspense fallback={<div className="text-[14px] text-muted">Loading…</div>}>
        <AuthForm />
      </Suspense>
    </AuthShell>
  );
}
