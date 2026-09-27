/**
 * Messaging abstraction (spec §27). WhatsApp is an optional integration layer —
 * core business logic never depends on a specific provider.
 *
 * Two providers ship:
 *  - WhatsAppLinkProvider: builds `wa.me` click-to-send links (works with zero API
 *    keys — ideal for owners sending invoices/reminders from their own WhatsApp).
 *  - WhatsAppApiProvider: stub for a Cloud API / BSP integration (server-side only).
 *
 * Message types: INVOICE | RECEIPT | CREDIT_REMINDER | MARKETING | PROMO.
 */

export type MessageChannel = 'WHATSAPP' | 'SMS' | 'EMAIL';
export type MessageType = 'INVOICE' | 'RECEIPT' | 'CREDIT_REMINDER' | 'MARKETING' | 'PROMO';

export interface OutboundMessage {
  to: string;        // recipient phone
  type: MessageType;
  body: string;
}

export interface SendResult {
  status: 'queued' | 'sent' | 'failed';
  link?: string;     // for link-based providers
  error?: string;
}

/** Normalise a local phone to international digits (Pakistan default +92). */
export function normalizePhone(raw: string, defaultCountry = '92'): string {
  let d = (raw || '').replace(/[^\d]/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = defaultCountry + d.slice(1);
  else if (!d.startsWith(defaultCountry) && d.length <= 10) d = defaultCountry + d;
  return d;
}

export interface MessagingProvider {
  readonly channel: MessageChannel;
  send(msg: OutboundMessage): Promise<SendResult>;
}

/** Click-to-send WhatsApp links (no API keys required). */
export class WhatsAppLinkProvider implements MessagingProvider {
  readonly channel = 'WHATSAPP' as const;
  async send(msg: OutboundMessage): Promise<SendResult> {
    const phone = normalizePhone(msg.to);
    if (!phone) return { status: 'failed', error: 'INVALID_PHONE' };
    const link = `https://wa.me/${phone}?text=${encodeURIComponent(msg.body)}`;
    return { status: 'queued', link };
  }
}

/** Placeholder for a real WhatsApp Cloud API / BSP integration. */
export class WhatsAppApiProvider implements MessagingProvider {
  readonly channel = 'WHATSAPP' as const;
  constructor(private apiUrl?: string, private token?: string) {}
  async send(msg: OutboundMessage): Promise<SendResult> {
    if (!this.apiUrl || !this.token) return { status: 'failed', error: 'PROVIDER_NOT_CONFIGURED' };
    // Real implementation would POST to this.apiUrl with this.token.
    void msg;
    return { status: 'failed', error: 'NOT_IMPLEMENTED' };
  }
}

/** Resolve the active provider from env (falls back to link provider). */
export function getMessagingProvider(): MessagingProvider {
  if (process.env.WHATSAPP_API_URL && process.env.WHATSAPP_API_TOKEN) {
    return new WhatsAppApiProvider(process.env.WHATSAPP_API_URL, process.env.WHATSAPP_API_TOKEN);
  }
  return new WhatsAppLinkProvider();
}

// ── Message templates ─────────────────────────────────────────

const money = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-PK');

export interface InvoiceMsgData {
  store: string; invoiceNumber: string; total: number; paid: number; outstanding: number;
  items: { name: string; quantity: number; unitPrice: number }[];
}

export function invoiceMessage(d: InvoiceMsgData): string {
  const lines = d.items.map((i) => `• ${i.name} x${i.quantity} = ${money(i.unitPrice * i.quantity)}`).join('\n');
  return [
    `*${d.store}*`,
    `Invoice: ${d.invoiceNumber}`,
    '',
    lines,
    '',
    `Total: ${money(d.total)}`,
    `Paid: ${money(d.paid)}`,
    d.outstanding > 0 ? `Balance due: ${money(d.outstanding)}` : 'Fully paid ✅',
    '',
    'Thank you for your business!',
  ].join('\n');
}

export function receiptMessage(store: string, invoiceNumber: string, amount: number): string {
  return `*${store}*\nPayment received for ${invoiceNumber}: ${money(amount)}.\nThank you!`;
}

export function creditReminderMessage(store: string, customer: string, outstanding: number, dueDate?: string): string {
  return [
    `*${store}*`,
    `Dear ${customer},`,
    `This is a friendly reminder that you have an outstanding balance of ${money(outstanding)}.`,
    dueDate ? `Due date: ${dueDate}.` : '',
    'Please clear it at your convenience. Thank you.',
  ].filter(Boolean).join('\n');
}

export function marketingMessage(store: string, body: string): string {
  return `*${store}*\n${body}`;
}
