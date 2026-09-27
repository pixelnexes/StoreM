import 'server-only';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'markazos_session';

function secret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error('AUTH_SECRET is not set (see .env.example)');
  }
  return new TextEncoder().encode(s);
}

export interface SessionPayload {
  sub: string;        // user id
  tenantId: string;
  role: string;
  name: string;
  [k: string]: unknown;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const ttl = Number(process.env.SESSION_TTL ?? 604800);
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ttl}s`)
    .sign(secret());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ttl,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export function destroySession(): void {
  cookies().delete(SESSION_COOKIE);
}
