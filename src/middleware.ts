import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Route guard for the two authenticated portals.
 *
 * Why this file exists: in the App Router a layout and its page render IN
 * PARALLEL, so `redirect()` inside `src/app/app/layout.tsx` does not stop the
 * page component from executing first. Every `/app/*` page does
 * `(await getSession())!` and then queries Prisma, so without a guard that runs
 * BEFORE rendering, an anonymous visitor hits a TypeError on every page and the
 * only thing standing between them and tenant data is a crash.
 *
 * Middleware runs first and rejects the request before any page renders.
 *
 * Edge-runtime constraints: this file may only use edge-safe APIs — no Prisma,
 * no bcryptjs, no `server-only`. That is why the JWT check is inlined here
 * instead of reusing `@/lib/auth` (which imports `next/headers`).
 */

const SESSION_COOKIE = 'markazos_session';
const ADMIN_COOKIE = 'markazos_admin';

async function verifyToken(token: string | undefined): Promise<Record<string, unknown> | null> {
  const secret = process.env.AUTH_SECRET;
  // No token, or no secret configured (misconfigured deploy) → treat as signed out.
  if (!token || !secret || secret.length < 16) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Platform portal: /admin/login is public, everything else needs an admin session.
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (pathname === '/admin/login') return NextResponse.next();
    const admin = await verifyToken(req.cookies.get(ADMIN_COOKIE)?.value);
    if (admin?.platform !== true) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
    return NextResponse.next();
  }

  // Store portal: needs a valid session carrying a tenant.
  const session = await verifyToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (typeof session?.tenantId !== 'string' || !session.tenantId) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  return NextResponse.next();
}

export const config = {
  // Deliberately excludes /api/* so JSON routes keep returning their JSON
  // envelope instead of an HTML redirect; they already call requireTenant().
  matcher: ['/app/:path*', '/admin/:path*'],
};
