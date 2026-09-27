'use client';
import { useRouter } from 'next/navigation';

export function LogoutButton({ endpoint = '/api/v1/auth/logout', to = '/login' }: { endpoint?: string; to?: string }) {
  const router = useRouter();
  async function logout() {
    await fetch(endpoint, { method: 'POST' });
    router.push(to);
    router.refresh();
  }
  return <button onClick={logout} className="btn btn-ghost text-sm">Logout</button>;
}
