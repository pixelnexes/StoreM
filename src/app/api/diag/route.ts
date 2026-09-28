import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

function redact(input: string): string {
  return input
    .replace(/:[^:@/\s]+@/g, ':***@')
    .replace(/[a-z0-9-]+\.hstgr\.io/gi, '***.hstgr.io')
    .replace(/[a-z0-9-]+\.main-hosting\.eu/gi, '***.main-hosting.eu');
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const auth = process.env.AUTH_SECRET;

  const env: Record<string, unknown> = {
    DATABASE_URL: { set: Boolean(dbUrl) },
    AUTH_SECRET: {
      set: Boolean(auth),
      length: auth?.length ?? 0,
      looksLikeGithubToken: Boolean(auth?.startsWith('ghp_')),
      longEnough: Boolean(auth && auth.length >= 16),
    },
    NODE_ENV: process.env.NODE_ENV ?? null,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? null,
    NEXT_OUTPUT: process.env.NEXT_OUTPUT ?? null,
  };

  if (dbUrl) {
    try {
      const u = new URL(dbUrl);
      Object.assign(env.DATABASE_URL as object, {
        protocol: u.protocol.replace(':', ''),
        host: u.hostname,
        database: u.pathname.replace('/', ''),
        user: u.username,
        passwordLength: u.password.length,
        passwordStartsWith: u.password.slice(0, 1),
        hasConnectionLimit: Boolean(u.searchParams.get('connection_limit')),
        totalLength: dbUrl.length,
      });
    } catch (e) {
      Object.assign(env.DATABASE_URL as object, {
        parseError: redact(e instanceof Error ? e.message : String(e)),
      });
    }
  }

  let probe: string;
  const p = new PrismaClient();
  try {
    await p.$queryRaw`SELECT 1`;
    probe = 'OK';
  } catch (e) {
    probe = redact(e instanceof Error ? `${e.name}: ${e.message}` : String(e));
  } finally {
    await p.$disconnect().catch(() => {});
  }

  let egressIp: string | null = null;
  for (const url of ['https://api.ipify.org?format=json', 'https://httpbin.org/ip', 'https://ifconfig.me/ip']) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(t);
      if (!r.ok) continue;
      const text = (await r.text()).trim();
      const m = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
      if (m) { egressIp = m[0]; break; }
    } catch { /* try next */ }
  }

  return NextResponse.json({ env, probe, egressIp });
}
