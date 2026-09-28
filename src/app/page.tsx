import Link from 'next/link';
import { getPlatformSettings } from '@/lib/platform';

const modules: [string, string, string][] = [
  ['01', 'Inventory', 'Transaction-based stock, so the count in the system is the count on the shelf.'],
  ['02', 'Point of sale', 'Barcode search, discounts and split payments — checkout that keeps the queue moving.'],
  ['03', 'Khata & credit', 'Every customer keeps an authoritative ledger with the outstanding balance always current.'],
  ['04', 'Invoices', 'Print, download or send a PDF from the counter in one action.'],
  ['05', 'Customers & suppliers', 'Profiles with contact numbers, purchase history and payment terms.'],
  ['06', 'Payments', 'Cash, card, bank and online — including a single sale split across methods.'],
  ['07', 'Reports', 'Profit and loss measured on true cost of goods sold, not on guesswork.'],
  ['08', 'WhatsApp', 'Invoices, receipts, credit reminders and campaigns, sent where your customers already are.'],
];

const pricing: { name: string; price: string; unit: string; modules: string; staff: string; products: string; support: string; chosen?: boolean }[] = [
  { name: 'Basic', price: 'Rs 5,000', unit: '/mo', modules: 'POS, stock, customers', staff: '2', products: '500', support: 'Email' },
  { name: 'Standard', price: 'Rs 10,000', unit: '/mo', modules: 'Add khata & credit', staff: '8', products: '5,000', support: 'Priority', chosen: true },
  { name: 'Premium', price: 'Rs 15,000', unit: '/mo', modules: 'Add reports', staff: '25', products: 'Unlimited', support: 'Priority' },
  { name: 'Custom', price: 'Custom', unit: '', modules: 'Everything, plus campaigns', staff: 'Custom', products: 'Unlimited', support: 'Dedicated' },
];

const faqs: [string, string][] = [
  ['What exactly does MarkazOS replace?', 'The counter book, the stock register, the khata diary, the invoice pad and the end-of-month spreadsheet. Sales, stock, credit and cash are kept in one record instead of five.'],
  ['Does it work on a phone?', 'Yes. The whole app — including the POS — is designed for small screens, not just squeezed down from desktop.'],
  ['How does customer credit work?', 'Every customer has a ledger. Each sale and each payment writes to it, so the outstanding figure is never something you have to reconcile by hand.'],
  ['Can I send the invoice on WhatsApp?', 'Yes. Invoices, payment receipts, credit reminders and marketing campaigns all go out over WhatsApp.'],
  ['What happens to my data?', 'Each store is strictly isolated, access is role-based, changes are written to an audit log, and backups are taken regularly.'],
  ['Is there a free trial?', 'Fourteen days, no card. If you stop, your data stays exportable.'],
];

export default async function Landing() {
  const { brandName } = await getPlatformSettings();

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-line bg-canvas">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5">
          <Link href="/" className="font-display text-[19px] font-semibold tracking-tightish">
            {brandName}
          </Link>
          <nav className="hidden gap-7 text-[13px] text-muted md:flex">
            <a href="#modules" className="transition-colors hover:text-ink">Modules</a>
            <a href="#day" className="transition-colors hover:text-ink">A day</a>
            <a href="#pricing" className="transition-colors hover:text-ink">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-ink">FAQ</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-[13px] text-muted transition-colors hover:text-ink">
              Log in
            </Link>
            <Link href="/login?tab=register" className="btn btn-primary">
              Start free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero: asymmetric, no mock browser, no gradient ── */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1.05fr_.95fr] md:items-end md:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow">Retail &amp; store management</span>
            <h1 className="mt-5 text-[clamp(2.5rem,5.4vw,4.15rem)] leading-[1.04]">
              The whole shop,<br />in one book.
            </h1>
            <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-muted">
              Stock, sales, udhaar and cash — kept in a single record that updates as you trade.
              Built for the way small retailers actually work, not for a slide deck.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/login?tab=register" className="btn btn-primary px-5 py-3 text-[15px]">
                Start free
              </Link>
              <a href="#modules" className="btn btn-ghost px-5 py-3 text-[15px]">
                See what it does
              </a>
            </div>
            <p className="mt-6 text-[13px] text-muted">
              14 days free · No card · Priced in rupees
            </p>
          </div>

          {/* A docket, not a dashboard mock: something a shop actually prints. */}
          <div className="animate-fade-up border border-line bg-surface [animation-delay:120ms]">
            <div className="flex items-baseline justify-between border-b border-line px-5 py-3">
              <span className="eyebrow">Invoice 1042</span>
              <span className="text-xs tabular-nums text-muted">Today, 4:40 pm</span>
            </div>
            <table className="w-full">
              <tbody className="text-[13px]">
                {[
                  ['Basmati rice 5kg', '2', '3,600'],
                  ['Cooking oil 1L', '4', '1,120'],
                  ['Sugar 1kg', '3', '390'],
                  ['Tea 250g', '1', '240'],
                ].map(([item, qty, amt]) => (
                  <tr key={item} className="border-b border-line/70">
                    <td className="px-5 py-2.5">{item}</td>
                    <td className="w-10 px-2 py-2.5 text-right tabular-nums text-muted">{qty}</td>
                    <td className="w-24 px-5 py-2.5 text-right tabular-nums">{amt}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-b border-ink/20">
                  <td colSpan={2} className="px-5 py-3 text-[13px] font-medium">Total</td>
                  <td className="px-5 py-3 text-right text-[15px] font-semibold tabular-nums">Rs 5,350</td>
                </tr>
              </tfoot>
            </table>
            <dl className="grid grid-cols-2 divide-x divide-line bg-canvas text-[13px]">
              <div className="px-5 py-3">
                <dt className="text-[11px] uppercase tracking-eyebrow text-muted">Paid</dt>
                <dd className="mt-0.5 tabular-nums">Cash · Rs 5,350</dd>
              </div>
              <div className="px-5 py-3">
                <dt className="text-[11px] uppercase tracking-eyebrow text-muted">Khata due</dt>
                <dd className="mt-0.5 tabular-nums text-brand">Rs 8,200</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* ── Modules as a ruled index, not a card grid ── */}
      <section id="modules" className="mx-auto max-w-5xl px-5 py-20">
        <div className="max-w-2xl">
          <span className="eyebrow">Modules</span>
          <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)]">
            Eight things your shop already does, kept in one place.
          </h2>
          <p className="mt-4 text-muted">
            Nothing here is a separate app with a separate login. A sale writes to stock, to the
            customer ledger and to the day book at once.
          </p>
        </div>

        <ol className="mt-12 border-t border-line">
          {modules.map(([num, title, desc]) => (
            <li
              key={num}
              className="group grid gap-x-8 gap-y-1 border-b border-line py-5 sm:grid-cols-[3rem_13rem_1fr] sm:items-baseline"
            >
              <span className="text-[13px] tabular-nums text-muted">{num}</span>
              <h3 className="text-[17px] transition-colors group-hover:text-brand">{title}</h3>
              <p className="text-[15px] leading-relaxed text-muted">{desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── A day, told as a day ── */}
      <section id="day" className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="max-w-2xl">
            <span className="eyebrow">One trading day</span>
            <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)]">Open, trade, close.</h2>
          </div>

          <div className="mt-12 grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {[
              ['Before opening', 'Receive stock from suppliers with the cost you actually paid, and see what is running low before the rush starts.'],
              ['Through the day', 'Ring sales at the counter. Stock, invoice, customer ledger and payment method all move together, in the same entry.'],
              ['At closing', 'Read profit and cash position without a spreadsheet, and send credit reminders to whoever is overdue.'],
            ].map(([when, what]) => (
              <div key={when} className="px-0 py-6 md:px-8 md:first:pl-0 md:last:pr-0">
                <span className="eyebrow">{when}</span>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{what}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing as a rate card ── */}
      <section id="pricing" className="mx-auto max-w-5xl px-5 py-20">
        <div className="max-w-2xl">
          <span className="eyebrow">Rate card</span>
          <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)]">Plans, plainly.</h2>
          <p className="mt-4 text-muted">Monthly, in rupees. Upgrade or downgrade whenever the shop changes shape.</p>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead>
              <tr className="border-b border-ink/25">
                <th scope="col" className="th pr-4">Plan</th>
                <th scope="col" className="th px-4 text-right">Price</th>
                <th scope="col" className="th px-4 text-left">Modules</th>
                <th scope="col" className="th px-4 text-right">Staff</th>
                <th scope="col" className="th px-4 text-right">Products</th>
                <th scope="col" className="th pl-4">Support</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p) => (
                <tr
                  key={p.name}
                  className={`border-b border-line ${p.chosen ? 'bg-brand-soft/60' : ''}`}
                >
                  <th scope="row" className="py-4 pr-4 text-[15px] font-medium">
                    <span className="flex items-baseline gap-2">
                      <span className={p.chosen ? 'border-l-2 border-brand pl-2.5' : 'pl-[10px] -ml-[10px]'}>
                        {p.name}
                      </span>
                      {p.chosen && <span className="text-[11px] font-normal text-brand">most chosen</span>}
                    </span>
                  </th>
                  <td className="px-4 py-4 text-right text-[15px] tabular-nums">
                    {p.price}
                    <span className="text-[13px] text-muted">{p.unit}</span>
                  </td>
                  <td className="px-4 py-4 text-[15px] text-muted">{p.modules}</td>
                  <td className="px-4 py-4 text-right text-[15px] text-muted tabular-nums">{p.staff}</td>
                  <td className="px-4 py-4 text-right text-[15px] text-muted tabular-nums">{p.products}</td>
                  <td className="py-4 pl-4 text-[15px] text-muted">{p.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/login?tab=register" className="btn btn-primary px-5 py-3 text-[15px]">
            Start free trial
          </Link>
          <p className="text-[13px] text-muted">Every plan includes invoices and WhatsApp sending. Higher plans unlock more modules.</p>
        </div>
      </section>

      {/* ── FAQ as a ruled list ── */}
      <section id="faq" className="border-t border-line bg-surface">
        <div className="mx-auto max-w-3xl px-5 py-20">
          <span className="eyebrow">Questions</span>
          <h2 className="mt-4 text-[clamp(1.75rem,3vw,2.5rem)]">Before you sign up.</h2>

          <div className="mt-10 border-t border-line">
            {faqs.map(([q, a]) => (
              <details key={q} className="group border-b border-line">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[15px] font-medium marker:hidden">
                  <span>{q}</span>
                  <span
                    aria-hidden
                    className="mt-0.5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[60ch] pb-5 text-[15px] leading-relaxed text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing band: full bleed, ink ── */}
      <section className="bg-ink text-canvas">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-16 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="max-w-[18ch] text-[clamp(1.75rem,3.4vw,2.75rem)] text-canvas">
              Put the counter book away.
            </h2>
            <p className="mt-3 max-w-[46ch] text-[15px] text-canvas/70">
              Set up your shop in an afternoon and trade on it the same evening.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/login?tab=register" className="btn bg-canvas px-5 py-3 text-[15px] text-ink hover:bg-canvas/90">
              Start free
            </Link>
            <a href="mailto:hello@markazos.app" className="btn border border-canvas/30 px-5 py-3 text-[15px] text-canvas hover:border-canvas/70">
              Book a demo
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 text-[13px] text-muted md:flex-row md:items-center md:justify-between">
          <p>© 2026 {brandName} by Zoqonyx.</p>
          <nav className="flex flex-wrap gap-6">
            <a href="#modules" className="transition-colors hover:text-ink">Modules</a>
            <a href="#pricing" className="transition-colors hover:text-ink">Pricing</a>
            <a href="#faq" className="transition-colors hover:text-ink">FAQ</a>
            <Link href="/login" className="transition-colors hover:text-ink">Log in</Link>
            <Link href="/admin/login" className="transition-colors hover:text-ink">Super admin</Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
