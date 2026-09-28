/**
 * The purchasable modules of the product.
 *
 * A plan is a named set of these keys (stored as JSON in `Plan.features`),
 * so the super admin can build Basic / Standard / Premium / Custom from one
 * editor instead of hard-coding tiers. Safe to import from client and server:
 * no Prisma, no env access.
 */

export interface ModuleDef {
  key: string;
  label: string;
  /** Every portal route that belongs to this module. */
  hrefs: string[];
}

export const MODULES: ModuleDef[] = [
  { key: 'pos', label: 'Point of Sale', hrefs: ['/app/pos', '/app/sales'] },
  { key: 'inventory', label: 'Inventory & purchases', hrefs: ['/app/inventory', '/app/purchases'] },
  { key: 'customers', label: 'Customers & suppliers', hrefs: ['/app/customers', '/app/suppliers'] },
  { key: 'khata', label: 'Ledger & credit', hrefs: ['/app/khata'] },
  { key: 'reports', label: 'Reports & profit', hrefs: ['/app/reports'] },
  { key: 'marketing', label: 'WhatsApp marketing', hrefs: ['/app/marketing'] },
];

export const MODULE_KEYS: string[] = MODULES.map((m) => m.key);

/** Routes every plan gets, whatever it buys. */
export const ALWAYS_ALLOWED = new Set(['/app', '/app/settings']);

export function moduleLabel(key: string): string {
  return MODULES.find((m) => m.key === key)?.label ?? key;
}

/**
 * Modules enabled by a plan's `features` JSON.
 *
 * Shape: `{ modules: string[], staff?: number, products?: number, ... }`.
 * Older rows only carry boolean flags — those plans keep every module visible
 * so a schema lag can never lock a paying store out of its own data.
 */
export function planModules(features?: string | null): string[] {
  if (!features) return MODULE_KEYS;
  try {
    const parsed = JSON.parse(features) as { modules?: unknown };
    if (Array.isArray(parsed.modules) && parsed.modules.length > 0) {
      return parsed.modules.filter((k): k is string => typeof k === 'string' && MODULE_KEYS.includes(k));
    }
  } catch {
    /* fall through to the safe default */
  }
  return MODULE_KEYS;
}

/** True when `pathname` is inside a module this plan has paid for. */
export function canAccessPath(modules: string[], pathname: string): boolean {
  if (ALWAYS_ALLOWED.has(pathname)) return true;
  const mod = MODULES.find((m) => m.hrefs.some((h) => pathname === h || pathname.startsWith(`${h}/`)));
  if (!mod) return true;
  return modules.includes(mod.key);
}
