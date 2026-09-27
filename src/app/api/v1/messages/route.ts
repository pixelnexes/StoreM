import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { messageSchema } from '@/lib/validators';
import { getMessagingProvider } from '@/lib/messaging';

/**
 * Send a WhatsApp message (invoice / receipt / reminder / marketing).
 * Logs a Notification and returns a click-to-send wa.me link for the link provider.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const body = messageSchema.parse(await req.json());

    const provider = getMessagingProvider();
    const result = await provider.send({ to: body.to, type: body.type, body: body.body });

    await prisma.notification.create({
      data: {
        tenantId: ctx.tenantId,
        recipient: body.to,
        channel: provider.channel,
        type: body.type,
        status: result.status,
        message: body.body,
        sentAt: result.status === 'sent' ? new Date() : null,
        failureReason: result.error,
      },
    });

    return ok({ status: result.status, link: result.link, error: result.error });
  });
}
