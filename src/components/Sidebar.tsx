'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav: [string, string][] = [
  ['/app', 'Dashboard'],
  ['/app/pos', 'Point of Sale'],
  ['/app/sales', 'Sales'],
  ['/app/purchases', 'Purchases'],
  ['/app/inventory', 'Inventory'],
  ['/app/customers', 'Customers'],
  ['/app/suppliers', 'Suppliers'],
  ['/app/khata', 'Ledger & Credit'],
  ['/app/marketing', 'Marketing'],
  ['/app/reports', 'Reports'],
  ['/app/settings', 'Settings'],
];

/** The contents of the navigation rail. Containers (desktop rail, mobile
 *  drawer) are provided by AppShell so this can be rendered twice. */
export function Sidebar({ brand, store }: { brand: string; store: string }) {
  const path = usePathname();

  return (
    <>
      <div className="flex h-14 shrink-0 items-center border-b border-line px-5">
        <Link href="/" className="font-display text-[16px] font-semibold tracking-tightish">
          {brand}
        </Link>
      </div>

      <div className="shrink-0 border-b border-line px-5 py-3.5">
        <span className="eyebrow">Store</span>
        <div className="mt-1 truncate text-[13.5px] font-medium">{store}</div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {nav.map(([href, label]) => {
            const active = path === href || (href !== '/app' && path.startsWith(href));
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`block border-l-2 py-2 pl-3 pr-2 text-[13.5px] transition-colors ${
                    active
                      ? 'border-brand bg-brand-soft font-medium text-brand'
                      : 'border-transparent text-ink/75 hover:bg-canvas hover:text-ink'
                  }`}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
