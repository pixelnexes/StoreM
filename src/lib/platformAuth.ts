import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { ApiError } from './tenant';

const ADMIN_COOKIE = 'markazos_admin';

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(s);
}

export interface AdminSession { sub: string; name: string; email: string; platform: true }

export async function createAdminSession(p: Omit<AdminSession, 'platform'>) {
  const token = await new SignJWT({ ...p, platform: true })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(secret());
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 43200,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as AdminSession;
  } catch { return null; }
}

export async function requirePlatformAdmin(): Promise<AdminSession> {
  const s = await getAdminSession();
  if (!s?.platform) throw new ApiError(401, 'UNAUTHENTICATED', 'Super admin login required');
  return s;
}

export function destroyAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}
