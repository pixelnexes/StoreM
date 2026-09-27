import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { verifyPassword, createSession } from '@/lib/auth';
import { loginSchema } from '@/lib/validators';
import { audit } from '@/lib/audit';

export async function POST(req: Request) {
  return handle(async () => {
    const body = loginSchema.parse(await req.json());

    const user = await prisma.user.findFirst({
      where: { phone: body.phone, status: 'active' },
    });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return fail('INVALID_CREDENTIALS', 'Incorrect phone number or password', 401);
    }

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });
    await createSession({ sub: user.id, tenantId: user.tenantId, role: user.role, name: user.name });
    await audit({ tenantId: user.tenantId, userId: user.id, action: 'auth.login', entity: 'User', entityId: user.id });

    return ok({ redirect: '/app' });
  });
}
