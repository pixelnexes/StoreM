/** Plan-limit enforcement & subscription-state access rules (server-authoritative). */

export interface PlanLimits {
  staff?: number;
  products?: number;
  customers?: number;
  branches?: number;
  [feature: string]: number | boolean | undefined;
}

export type LimitCode =
  | 'STAFF_LIMIT_REACHED'
  | 'PRODUCT_LIMIT_REACHED'
  | 'CUSTOMER_LIMIT_REACHED'
  | 'BRANCH_LIMIT_REACHED';

const LIMIT_CODE: Record<string, LimitCode> = {
  staff: 'STAFF_LIMIT_REACHED',
  products: 'PRODUCT_LIMIT_REACHED',
  customers: 'CUSTOMER_LIMIT_REACHED',
  branches: 'BRANCH_LIMIT_REACHED',
};

export interface LimitCheck {
  allowed: boolean;
  code?: LimitCode;
}

/** Check whether adding one more of `resource` stays within the plan limit. */
export function checkLimit(
  resource: 'staff' | 'products' | 'customers' | 'branches',
  currentCount: number,
  limits: PlanLimits,
): LimitCheck {
  const max = limits[resource];
  if (typeof max !== 'number') return { allowed: true }; // unlimited / not configured
  if (currentCount >= max) return { allowed: false, code: LIMIT_CODE[resource] };
  return { allowed: true };
}

export type SubStatus = 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';

export interface AccessDecision {
  canAccess: boolean;
  readOnly: boolean;
  reason?: string;
}

/**
 * Access policy by subscription state. EXPIRED/CANCELLED/SUSPENDED restrict
 * access; data is always preserved. PAST_DUE within grace period => read-only.
 */
export function accessForStatus(
  status: SubStatus,
  periodEnd: Date | null,
  gracePeriodDays: number,
  now: Date = new Date(),
): AccessDecision {
  switch (status) {
    case 'ACTIVE':
    case 'TRIAL':
      return { canAccess: true, readOnly: false };
    case 'PAST_DUE': {
      if (!periodEnd) return { canAccess: true, readOnly: true, reason: 'PAST_DUE' };
      const graceEnd = new Date(periodEnd.getTime() + gracePeriodDays * 86400000);
      if (now <= graceEnd) return { canAccess: true, readOnly: true, reason: 'GRACE_PERIOD' };
      return { canAccess: false, readOnly: true, reason: 'GRACE_EXPIRED' };
    }
    case 'SUSPENDED':
      return { canAccess: false, readOnly: true, reason: 'SUSPENDED' };
    case 'EXPIRED':
    case 'CANCELLED':
      return { canAccess: false, readOnly: true, reason: status };
    default:
      return { canAccess: false, readOnly: true, reason: 'UNKNOWN' };
  }
}
