import { handle, ok } from '@/lib/api';
import { destroySession } from '@/lib/auth';

export async function POST() {
  return handle(async () => {
    destroySession();
    return ok({ redirect: '/login' });
  });
}
