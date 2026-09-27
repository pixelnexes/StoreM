import 'server-only';
import { prisma } from './prisma';
import { DEFAULT_THEME, themeOr } from './theme';

/** Read the platform-wide settings (theme, brand) chosen by the super admin. */
export async function getPlatformSettings(): Promise<{ themeKey: string; brandName: string }> {
  try {
    const s = await prisma.platformSetting.findUnique({ where: { id: 'singleton' } });
    return { themeKey: themeOr(s?.themeKey), brandName: s?.brandName ?? 'MarkazOS' };
  } catch {
    // DB not reachable yet (e.g. before first migrate) — fall back safely.
    return { themeKey: DEFAULT_THEME, brandName: 'MarkazOS' };
  }
}
