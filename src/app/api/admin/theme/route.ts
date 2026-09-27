import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { themeSchema } from '@/lib/validators';
import { isValidTheme } from '@/lib/theme';

export async function POST(req: Request) {
  return handle(async () => {
    await requirePlatformAdmin();
    const body = themeSchema.parse(await req.json());
    if (!isValidTheme(body.themeKey)) return fail('INVALID_THEME', 'Unknown theme', 422);

    const updated = await prisma.platformSetting.upsert({
      where: { id: 'singleton' },
      update: { themeKey: body.themeKey, ...(body.brandName ? { brandName: body.brandName } : {}) },
      create: { id: 'singleton', themeKey: body.themeKey, brandName: body.brandName ?? 'MarkazOS' },
    });
    return ok(updated);
  });
}
