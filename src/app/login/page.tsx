'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

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

  return (
    <div className="w-full max-w-md">
      <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-extrabold">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-fg">M</span> MarkazOS
      </Link>
      <div className="card">
        <div className="mb-5 grid grid-cols-2 rounded-lg bg-canvas p-1 text-sm font-semibold">
          <button onClick={() => setTab('login')} className={`rounded-md py-2 ${tab === 'login' ? 'bg-brand text-brand-fg' : 'text-muted'}`}>Log in</button>
          <button onClick={() => setTab('register')} className={`rounded-md py-2 ${tab === 'register' ? 'bg-brand text-brand-fg' : 'text-muted'}`}>Sign up</button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {tab === 'register' && (
            <>
              <div><label className="label">Your name</label><input name="name" required className="input" placeholder="e.g. Ubaer" /></div>
              <div><label className="label">Business name</label><input name="businessName" required className="input" placeholder="e.g. Ubaer General Store" /></div>
              <div><label className="label">Email (optional)</label><input name="email" type="email" className="input" placeholder="owner@store.com" /></div>
            </>
          )}
          <div><label className="label">Mobile number</label><input name="phone" required className="input" placeholder="03001234567" defaultValue={tab === 'login' ? '03001234567' : ''} /></div>
          <div><label className="label">Password</label><input name="password" type="password" required className="input" placeholder="••••••••" defaultValue={tab === 'login' ? 'owner1234' : ''} /></div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="btn btn-primary w-full py-3">
            {loading ? 'Please wait…' : tab === 'login' ? 'Log in' : 'Create account & store'}
          </button>
        </form>
      </div>
      <p className="mt-4 text-center text-sm text-muted">
        {tab === 'login' ? 'Demo owner: 03001234567 / owner1234' : 'Free 14-day trial — no card required.'}
      </p>
      <p className="mt-2 text-center text-sm">
        <Link href="/admin/login" className="text-brand hover:underline">Super Admin login →</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-b from-brand-soft to-canvas px-5 py-10">
      <Suspense fallback={<div className="text-muted">Loading…</div>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
