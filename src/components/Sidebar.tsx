'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  ['/app', 'Dashboard', '📊'],
  ['/app/pos', 'Point of Sale', '🧾'],
  ['/app/sales', 'Sales', '🧮'],
  ['/app/purchases', 'Purchases', '📥'],
  ['/app/inventory', 'Inventory', '📦'],
  ['/app/customers', 'Customers', '👥'],
  ['/app/suppliers', 'Suppliers', '🚚'],
  ['/app/khata', 'Ledger & Credit', '📒'],
  ['/app/marketing', 'Marketing', '💬'],
  ['/app/reports', 'Reports', '📈'],
  ['/app/settings', 'Settings', '⚙️'],
];

export function Sidebar({ brand, store }: { brand: string; store: string }) {
  const path = usePathname();
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex h-16 items-center gap-2 border-b border-line px-5 font-extrabold">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">M</span> {brand}
      </div>
      <div className="border-b border-line px-5 py-3 text-xs">
        <div className="text-muted">Store</div>
        <div className="font-semibold">{store}</div>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {nav.map(([href, label, icon]) => {
          const active = path === href || (href !== '/app' && path.startsWith(href));
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                active ? 'bg-brand text-brand-fg' : 'text-ink hover:bg-canvas'
              }`}>
              <span className="w-5 text-center">{icon}</span> {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
