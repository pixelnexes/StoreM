import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { createAdminSession } from '@/lib/platformAuth';
import { z } from 'zod';

const schema = z.object({ email: z.string().email(), password: z.string().min(6) });

export async function POST(req: Request) {
  return handle(async () => {
    const body = schema.parse(await req.json());
    const admin = await prisma.platformAdmin.findUnique({ where: { email: body.email } });
    if (!admin || !(await verifyPassword(body.password, admin.passwordHash))) {
      return fail('INVALID_CREDENTIALS', 'Incorrect email or password', 401);
    }
    await createAdminSession({ sub: admin.id, name: admin.name, email: admin.email });
    return ok({ redirect: '/admin' });
  });
}
