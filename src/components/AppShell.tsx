'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { LogoutButton } from './LogoutButton';

/**
 * Chrome for the authenticated store portal: a fixed navigation rail on
 * desktop, a drawer at smaller widths, and a slim toolbar.
 *
 * Kept client-side because the menu state and the "close on navigate"
 * behaviour both need it; the server layout passes session data in as props.
 */
export function AppShell({
  brand,
  store,
  name,
  role,
  plan,
  planStatus,
  modules,
  notice,
  children,
}: {
  brand: string;
  store: string;
  name: string;
  role: string;
  plan?: string;
  planStatus?: string;
  modules?: string[];
  notice?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-surface md:flex">
        <Sidebar brand={brand} store={store} modules={modules} />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40"
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 animate-fade-in flex-col border-r border-line bg-surface">
            <Sidebar brand={brand} store={store} modules={modules} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-line bg-canvas px-4 md:px-8">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center text-ink md:hidden"
          >
            <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
              <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          <p className="min-w-0 truncate text-[13px] text-muted">
            <span className="hidden sm:inline">Signed in as </span>
            <span className="font-medium text-ink">{name}</span>
            <span className="mx-2 text-line">·</span>
            <span className="badge align-middle">{role}</span>
          </p>

          <div className="ml-auto flex shrink-0 items-center gap-4">
            {plan && (
              <span className="hidden text-[12px] text-muted lg:inline">
                Plan <span className="font-medium text-ink">{plan}</span>
                {planStatus && <span className="ml-1 text-muted">· {planStatus}</span>}
              </span>
            )}
            <LogoutButton />
          </div>
        </header>

        {notice && (
          <div className="shrink-0 border-b border-line bg-brand-soft px-4 py-2.5 text-[13px] md:px-8">
            {notice}
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
