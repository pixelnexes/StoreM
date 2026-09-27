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
      <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6">
        <Link href="/admin" className="flex items-center gap-2 font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-fg">M</span> MarkazOS · Super Admin
        </Link>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted">{session.name}</span>
          <LogoutButton endpoint="/api/admin/logout" to="/admin/login" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-6">{children}</main>
    </div>
  );
}
