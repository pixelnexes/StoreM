import { handle, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireTenant } from '@/lib/tenant';
import { bulkMessageSchema } from '@/lib/validators';
import { getMessagingProvider } from '@/lib/messaging';

/**
 * Bulk send (Select All). Logs a Notification per recipient and returns wa.me
 * links for the link provider. With a configured WhatsApp Business API the same
 * loop sends server-side automatically.
 */
export async function POST(req: Request) {
  return handle(async () => {
    const ctx = await requireTenant();
    const body = bulkMessageSchema.parse(await req.json());
    const provider = getMessagingProvider();

    const results: { phone: string; name?: string; status: string; link?: string }[] = [];
    const rows: any[] = [];

    for (const r of body.recipients) {
      const res = await provider.send({ to: r.phone, type: body.type, body: body.body });
      results.push({ phone: r.phone, name: r.name, status: res.status, link: res.link });
      rows.push({
        tenantId: ctx.tenantId, recipient: r.phone, channel: provider.channel, type: body.type,
        status: res.status, message: body.body,
        sentAt: res.status === 'sent' ? new Date() : null, failureReason: res.error,
      });
    }
    if (rows.length) await prisma.notification.createMany({ data: rows });

    return ok({ count: results.length, results });
  });
}
