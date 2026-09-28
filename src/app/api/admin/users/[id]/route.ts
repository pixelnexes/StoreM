import { handle, ok, fail } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { hashPassword } from '@/lib/auth';
import { userUpdateSchema } from '@/lib/validators';
import { ApiError } from '@/lib/tenant';

/**
 * Super admin edits any store user: name, phone, role, status, password.
 * Phone moves are checked for collisions because login is phone-based.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requirePlatformAdmin();
    const body = userUpdateSchema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

    if (body.phone && body.phone !== user.phone) {
      const taken = await prisma.user.findFirst({ where: { phone: body.phone, NOT: { id: user.id } } });
      if (taken) throw new ApiError(409, 'PHONE_TAKEN', 'This phone number belongs to another user');
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email === '' ? null : body.email ?? undefined,
        role: body.role ?? undefined,
        status: body.status ?? undefined,
        passwordHash: body.password ? await hashPassword(body.password) : undefined,
      },
      select: { id: true, name: true, phone: true, role: true, status: true },
    });

    return ok(updated);
  });
}

/** Super admin removes a store user (the last OWNER of a store is protected). */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requirePlatformAdmin();
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

    if (user.role === 'OWNER') {
      const owners = await prisma.user.count({ where: { tenantId: user.tenantId, role: 'OWNER' } });
      if (owners <= 1) return fail('LAST_OWNER', 'A store needs at least one owner', 409);
    }

    await prisma.user.delete({ where: { id: user.id } });
    return ok({ deleted: true });
  });
}
