import Link from 'next/link';
import { Reveal } from '@/components/Reveal';
import { getPlatformSettings } from '@/lib/platform';

const features = [
  ['📦', 'Inventory', 'Real-time stock with transaction-based accounting for every unit.'],
  ['🧾', 'Point of Sale', 'Fast checkout with barcode search, discounts and split payments.'],
  ['📒', 'Ledger & Credit', 'Track customer credit and full payment history automatically.'],
  ['👥', 'Customers', 'Complete customer profiles with mandatory contact numbers.'],
  ['📄', 'Invoices', 'Generate, print, download PDF and share instantly.'],
  ['💳', 'Payments', 'Cash, card, bank and online — including split payments.'],
  ['📈', 'Reports', 'Accurate profit &amp; loss based on true cost of goods sold.'],
  ['💬', 'WhatsApp', 'Send invoices, receipts, reminders and campaigns.'],
];

const steps = [
  ['Create your store', 'Register and complete a quick setup.'],
  ['Add products & stock', 'Receive stock from suppliers with cost tracking.'],
  ['Start selling', 'Ring up sales at the POS in seconds.'],
  ['Track credit & payments', 'Ledgers update automatically; reminders go out.'],
  ['Review reports', 'See real profit and trends on one dashboard.'],
];

export default async function Landing() {
  const { brandName } = await getPlatformSettings();

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-line bg-surface/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">M</span>
            {brandName}
          </Link>
          <nav className="hidden gap-7 text-sm font-medium text-muted md:flex">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-ghost">Log in</Link>
            <Link href="/login?tab=register" className="btn btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-soft to-canvas" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
          <div className="animate-fade-up">
            <span className="badge">Complete retail &amp; store management</span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Run your entire store from one powerful system.
            </h1>
            <p className="mt-5 max-w-lg text-lg text-muted">
              Inventory, sales, credit, customers, payments, invoices and WhatsApp marketing — all in one platform built for retail businesses.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login?tab=register" className="btn btn-primary px-6 py-3 text-base">Start free →</Link>
              <a href="#pricing" className="btn btn-ghost px-6 py-3 text-base">View pricing</a>
            </div>
            <div className="mt-6 flex flex-wrap gap-5 text-sm text-muted">
              <span>⭐ <b className="text-ink">4.9/5</b> owner rating</span>
              <span>🔒 <b className="text-ink">Secure</b> multi-tenant</span>
              <span>🏪 Scales to <b className="text-ink">1,000+</b> stores</span>
            </div>
          </div>
          <div className="animate-fade-up rounded-2xl border border-line bg-surface p-4 shadow-xl [animation-delay:150ms]">
            <div className="mb-3 flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-red-400" />
              <span className="h-3 w-3 rounded-full bg-amber-400" />
              <span className="h-3 w-3 rounded-full bg-green-400" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[["Today's sales", 'Rs. 42,300'], ['Gross profit', 'Rs. 14,900'], ['Outstanding', 'Rs. 8,200']].map(([l, v]) => (
                <div key={l} className="rounded-lg border border-line bg-canvas p-3">
                  <div className="text-[10px] uppercase tracking-wide text-muted">{l}</div>
                  <div className="mt-1 text-lg font-extrabold">{v}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex h-28 items-end gap-2 rounded-lg border border-line bg-canvas p-3">
              {[40, 65, 50, 80, 60, 95, 72].map((h, i) => (
                <span key={i} className="flex-1 rounded-t bg-brand/80" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="badge">Everything in one place</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">One integrated system for your whole business</h2>
          <p className="mt-3 text-muted">Every module is connected — no duplicate data entry, no scattered records.</p>
        </Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([icon, title, desc], i) => (
            <Reveal key={title} delay={i * 60}>
              <div className="card h-full">
                <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl bg-brand-soft text-xl">{icon}</div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted" dangerouslySetInnerHTML={{ __html: desc }} />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="bg-brand-soft/50 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <Reveal className="text-center">
            <span className="badge">How it works</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Up and running in five steps</h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map(([title, desc], i) => (
              <Reveal key={title} delay={i * 80} className="text-center">
                <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-brand font-bold text-brand-fg">{i + 1}</div>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-6xl px-5 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="badge">Pricing</span>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Simple, transparent plans</h2>
          <p className="mt-3 text-muted">A plan for every business. Upgrade or downgrade anytime.</p>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Starter', 'Rs. 1,999', ['1 branch', '2 staff', 'Inventory & POS', 'Credit ledger', '500 products'], false],
            ['Professional', 'Rs. 4,999', ['2 branches', '8 staff', 'WhatsApp marketing', 'Advanced reports', '5,000 products'], true],
            ['Business', 'Rs. 9,999', ['Unlimited branches', '25 staff', 'Payment reconciliation', 'Priority support', 'Unlimited products'], false],
            ['Enterprise', 'Custom', ['Custom limits', 'Dedicated manager', 'API access', 'SLA & onboarding', 'Audit & compliance'], false],
          ].map(([name, price, feats, pop], i) => (
            <Reveal key={name as string} delay={i * 60}>
              <div className={`card flex h-full flex-col ${pop ? 'ring-2 ring-brand' : ''}`}>
                {pop ? <span className="badge mb-2 w-fit">Most popular</span> : null}
                <div className="font-semibold">{name as string}</div>
                <div className="mt-2 text-3xl font-extrabold">{price as string}<span className="text-sm font-medium text-muted">{price === 'Custom' ? '' : '/mo'}</span></div>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-muted">
                  {(feats as string[]).map((f) => <li key={f}>✓ {f}</li>)}
                </ul>
                <Link href="/login?tab=register" className={`btn mt-5 ${pop ? 'btn-primary' : 'btn-ghost'}`}>Start free</Link>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="faq" className="bg-brand-soft/50 py-20">
        <div className="mx-auto max-w-3xl px-5">
          <Reveal className="text-center">
            <span className="badge">FAQ</span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Frequently asked questions</h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {[
              [`What is ${brandName}?`, `${brandName} is a complete retail and store management platform — inventory, POS, credit, customers, payments, invoices, reports and WhatsApp marketing, all in one place.`],
              ['Does it work on mobile?', 'Yes. The app is fully responsive across desktop, tablet and mobile.'],
              ['Can I track customer credit?', 'Absolutely. Every customer has an authoritative ledger with an up-to-date outstanding balance.'],
              ['Can I send invoices on WhatsApp?', 'Yes — invoices, payment receipts, credit reminders and marketing campaigns can all be sent via WhatsApp.'],
              ['Is my data secure?', 'Yes — strict multi-tenant isolation, role-based access, audit logs and backups.'],
              ['Is there a free trial?', 'Yes, start free — no card required.'],
            ].map(([q, a], i) => (
              <Reveal key={q} delay={i * 50}>
                <details className="rounded-xl border border-line bg-surface px-5 py-1">
                  <summary className="cursor-pointer list-none py-4 font-semibold">{q}</summary>
                  <p className="pb-4 text-muted">{a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <Reveal>
          <div className="rounded-3xl bg-brand px-6 py-14 text-center text-brand-fg">
            <h2 className="text-3xl font-bold">Start managing your store the smart way.</h2>
            <p className="mt-3 opacity-90">Set up in minutes with a free trial.</p>
            <div className="mt-7 flex justify-center gap-3">
              <Link href="/login?tab=register" className="btn bg-surface px-6 py-3 text-brand hover:opacity-90">Start free</Link>
              <a href="mailto:hello@markazos.app" className="btn border border-brand-fg/40 px-6 py-3 text-brand-fg">Book a demo</a>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line bg-surface py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-5 text-sm text-muted md:flex-row">
          <span>© 2026 {brandName} by Zoqonyx. All rights reserved.</span>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-ink">Log in</Link>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
            <a href="#faq" className="hover:text-ink">FAQ</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
