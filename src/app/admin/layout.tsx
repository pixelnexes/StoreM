import { getAdminSession } from '@/lib/platformAuth';
import { LogoutButton } from '@/components/LogoutButton';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  // Unauthenticated: render bare (the /admin/login page). Authed pages below
  // (e.g. /admin) guard themselves and redirect to /admin/login when needed.
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/admin" className="font-display text-[16px] font-semibold tracking-tightish">
            MarkazOS
            <span className="ml-2 align-middle text-[11px] font-normal uppercase tracking-eyebrow text-muted">
              Super admin
            </span>
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <nav className="flex items-center gap-4">
              <Link href="/admin" className="text-muted hover:text-ink">Overview</Link>
              <Link href="/admin/plans" className="text-muted hover:text-ink">Plans</Link>
            </nav>
            <span className="hidden text-muted sm:inline">{session.name}</span>
            <LogoutButton endpoint="/api/admin/logout" to="/admin/login" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">{children}</main>
    </div>
  );
}
