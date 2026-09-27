import 'server-only';
import { prisma } from './prisma';

/** Write an audit log entry (TC-015). Never throws into the caller path. */
export async function audit(params: {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
  ip?: string;
  userAgent?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldValue: params.oldValue === undefined ? undefined : JSON.stringify(params.oldValue),
        newValue: params.newValue === undefined ? undefined : JSON.stringify(params.newValue),
        ip: params.ip,
        userAgent: params.userAgent,
      },
    });
  } catch (e) {
    console.error('[audit] failed', e);
  }
}
