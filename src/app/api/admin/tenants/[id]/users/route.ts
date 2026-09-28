import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requirePlatformAdmin } from '@/lib/platformAuth';
import { hashPassword } from '@/lib/auth';
import { userCreateSchema } from '@/lib/validators';
import { ApiError } from '@/lib/tenant';

/** Super admin adds a user (owner/manager/cashier) to a store. */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    await requirePlatformAdmin();
    const body = userCreateSchema.parse(await req.json());

    const tenant = await prisma.tenant.findUnique({ where: { id: params.id } });
    if (!tenant) throw new ApiError(404, 'NOT_FOUND', 'Store not found');

    const existing = await prisma.user.findFirst({ where: { phone: body.phone } });
    if (existing) throw new ApiError(409, 'PHONE_TAKEN', 'This phone number is already registered');

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        name: body.name,
        phone: body.phone,
        email: body.email || null,
        passwordHash: await hashPassword(body.password),
        role: body.role,
      },
      select: { id: true, name: true, phone: true, role: true, status: true },
    });

    return ok(user, 201);
  });
}
