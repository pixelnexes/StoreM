import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PosClient } from '@/components/PosClient';

export const dynamic = 'force-dynamic';

export default async function PosPage() {
  const session = (await getSession())!;
  const [branch, tenant] = await Promise.all([
    prisma.branch.findFirst({ where: { tenantId: session.tenantId, status: 'active' }, orderBy: { createdAt: 'asc' } }),
    prisma.tenant.findUnique({ where: { id: session.tenantId }, select: { businessName: true } }),
  ]);
  return <PosClient branchId={branch?.id ?? ''} store={tenant?.businessName ?? ''} />;
}
