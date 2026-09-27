import { handle, ok } from '@/lib/api';
import { destroyAdminSession } from '@/lib/platformAuth';

export async function POST() {
  return handle(async () => {
    destroyAdminSession();
    return ok({ redirect: '/admin/login' });
  });
}
