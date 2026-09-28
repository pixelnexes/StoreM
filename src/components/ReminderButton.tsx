'use client';
import { useState } from 'react';

export function ReminderButton({ to, message }: { to: string; message: string }) {
  const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true);
    try {
      const res = await fetch('/api/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, type: 'CREDIT_REMINDER', body: message }),
      });
      const j = await res.json();
      if (j.success && j.data.link) window.open(j.data.link, '_blank');
    } finally { setBusy(false); }
  }
  return <button onClick={send} disabled={busy} className="btn btn-ghost btn-sm">{busy ? 'Sending…' : 'Send reminder'}</button>;
}
