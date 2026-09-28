import Link from 'next/link';

/**
 * Shared chrome for the two sign-in screens: a quiet ink panel carrying the
 * brand's one-line promise, and a narrow paper column holding the form.
 *
 * Deliberately not a centred card floating on a gradient — the form sits on
 * the page the way a printed slip sits on a counter.
 */
export function AuthShell({
  statement,
  support,
  footnote,
  children,
}: {
  statement: React.ReactNode;
  support: string;
  footnote: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen md:grid md:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-10 text-canvas md:flex">
        <div aria-hidden className="ruled-ink absolute inset-0" />
        <Link href="/" className="relative font-display text-[17px] font-semibold tracking-tightish">
          MarkazOS
        </Link>
        <div className="relative">
          <p className="max-w-[15ch] text-[clamp(2rem,3vw,2.75rem)] font-semibold leading-[1.08] font-display tracking-tightish">
            {statement}
          </p>
          <p className="mt-5 max-w-[40ch] text-[14px] leading-relaxed text-canvas/60">{support}</p>
        </div>
        <p className="relative text-[12px] text-canvas/40">{footnote}</p>
      </aside>

      <div className="flex items-center justify-center px-5 py-12 md:px-10">
        <div className="w-full max-w-[24rem]">
          <Link
            href="/"
            className="mb-10 block font-display text-[17px] font-semibold tracking-tightish md:hidden"
          >
            MarkazOS
          </Link>
          {children}
        </div>
      </div>
    </main>
  );
}
