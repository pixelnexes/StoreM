import 'server-only';
import { getSession, type SessionPayload } from './auth';

/**
 * Tenant isolation guard. Every tenant-scoped API/route handler must call
 * requireTenant() and use ctx.tenantId in EVERY query. Never trust a tenantId
 * supplied by the client.
 */

export class ApiError extends Error {
  constructor(public status: number, public code: string, message?: string) {
    super(message ?? code);
  }
}

export interface TenantContext {
  userId: string;
  tenantId: string;
  role: string;
  name: string;
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError(401, 'UNAUTHENTICATED', 'Login required');
  return session;
}

export async function requireTenant(): Promise<TenantContext> {
  const s = await requireSession();
  if (!s.tenantId) throw new ApiError(403, 'NO_TENANT', 'No tenant context');
  return { userId: s.sub, tenantId: s.tenantId, role: s.role, name: s.name };
}

export async function requireRole(roles: string[]): Promise<TenantContext> {
  const ctx = await requireTenant();
  if (!roles.includes(ctx.role)) {
    throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions');
  }
  return ctx;
}

/** Assert a fetched record belongs to the current tenant (TC-010). */
export function assertOwned(record: { tenantId: string } | null, tenantId: string) {
  if (!record || record.tenantId !== tenantId) {
    throw new ApiError(404, 'NOT_FOUND', 'Resource not found');
  }
}
