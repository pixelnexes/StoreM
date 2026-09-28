'use client';
import { useEffect, useState } from 'react';

export function InvoiceActions({
  autoPrint, customerPhone, message,
}: { autoPrint: boolean; customerPhone?: string | null; message: string }) {
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (autoPrint) {
      const t = setTimeout(() => window.print(), 500);
      return () => clearTimeout(t);
    }
  }, [autoPrint]);

  async function sendWhatsApp() {
    if (!customerPhone) { setNote('This sale has no customer phone number.'); return; }
    setSending(true); setNote('');
    try {
      const res = await fetch('/api/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: customerPhone, type: 'INVOICE', body: message }),
      });
      const j = await res.json();
      if (j.success && j.data.link) window.open(j.data.link, '_blank');
      else setNote(j.error?.message ?? 'Could not create WhatsApp link.');
    } catch { setNote('Network error'); }
    finally { setSending(false); }
  }

  return (
    <div className="no-print mb-4 flex flex-wrap items-center gap-2">
      <button onClick={() => window.print()} className="btn btn-primary btn-sm">Print</button>
      <button onClick={() => window.print()} className="btn btn-ghost btn-sm">Save as PDF</button>
      <button onClick={sendWhatsApp} disabled={sending} className="btn btn-ghost btn-sm">{sending ? 'Opening…' : 'Send on WhatsApp'}</button>
      {note && <span className="text-xs text-warn">{note}</span>}
    </div>
  );
}
