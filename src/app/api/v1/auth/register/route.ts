import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { hashPassword, createSession } from '@/lib/auth';
import { registerSchema } from '@/lib/validators';

export async function POST(req: Request) {
  return handle(async () => {
    const body = registerSchema.parse(await req.json());

    const existing = await prisma.user.findFirst({ where: { phone: body.phone } });
    if (existing) return fail('PHONE_TAKEN', 'This phone number is already registered', 409);

    const starter = await prisma.plan.findUnique({ where: { key: 'professional' } });

    // Create tenant + owner + branch + trial subscription atomically.
    const result = await prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: body.businessName,
          businessName: body.businessName,
          phone: body.phone,
          email: body.email || null,
          settings: { create: {} },
          subscription: starter ? {
            create: {
              planId: starter.id, status: 'TRIAL',
              trialEndsAt: new Date(Date.now() + 14 * 86400000),
              currentPeriodEnd: new Date(Date.now() + 14 * 86400000),
            },
          } : undefined,
        },
      });
      await tx.branch.create({ data: { tenantId: tenant.id, name: 'Main Branch', phone: body.phone } });
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id, name: body.name, phone: body.phone, email: body.email || null,
          passwordHash: await hashPassword(body.password), role: 'OWNER',
        },
      });
      return { tenant, user };
    });

    await createSession({
      sub: result.user.id, tenantId: result.tenant.id, role: 'OWNER', name: result.user.name,
    });
    return ok({ tenantId: result.tenant.id, redirect: '/app' }, 201);
  });
}
