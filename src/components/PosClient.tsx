'use client';
import { useEffect, useMemo, useState } from 'react';
import { computeSaleTotals, settlePayments } from '@/domain/sales';

interface Product { id: string; name: string; sellingPrice: number; stock: number; baseUnit: string; sku?: string | null; image?: string | null; }
interface Customer { id: string; name: string; phone: string; }
interface Line { productId: string; name: string; unitPrice: number; quantity: number; stock: number; unit: string; }
type Method = 'CASH' | 'CARD' | 'BANK' | 'ONLINE';

const fmt = (n: number) => 'Rs. ' + Math.round(n).toLocaleString('en-PK');

export function PosClient({ branchId, store }: { branchId: string; store: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Line[]>([]);

  // Customer
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [custQuery, setCustQuery] = useState('');
  const [custResults, setCustResults] = useState<Customer[]>([]);
  const [showNewCust, setShowNewCust] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [custMsg, setCustMsg] = useState('');

  // Payments
  const [pay, setPay] = useState<Record<Method, number>>({ CASH: 0, CARD: 0, BANK: 0, ONLINE: 0 });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ saleId: string; invoiceNumber: string; total: number; outstanding: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const t = setTimeout(() => {
      fetch('/api/v1/products?q=' + encodeURIComponent(query))
        .then((r) => r.json()).then((j) => j.success && setProducts(j.data));
    }, 180);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!custQuery.trim()) { setCustResults([]); return; }
    const t = setTimeout(() => {
      fetch('/api/v1/customers?q=' + encodeURIComponent(custQuery))
        .then((r) => r.json()).then((j) => j.success && setCustResults(j.data));
    }, 220);
    return () => clearTimeout(t);
  }, [custQuery]);

  function addToCart(p: Product) {
    setResult(null);
    setCart((c) => {
      const found = c.find((l) => l.productId === p.id);
      if (found) return c.map((l) => l.productId === p.id ? { ...l, quantity: Math.min(l.quantity + 1, p.stock) } : l);
      return [...c, { productId: p.id, name: p.name, unitPrice: p.sellingPrice, quantity: 1, stock: p.stock, unit: p.baseUnit }];
    });
  }
  const setQty = (id: string, q: number) =>
    setCart((c) => c.map((l) => l.productId === id ? { ...l, quantity: Math.max(1, Math.min(q, l.stock)) } : l));
  const removeLine = (id: string) => setCart((c) => c.filter((l) => l.productId !== id));

  const totals = useMemo(
    () => cart.length ? computeSaleTotals(cart.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice }))) : { subtotal: 0, discount: 0, tax: 0, total: 0 },
    [cart],
  );
  const payments = (Object.keys(pay) as Method[]).filter((m) => pay[m] > 0).map((m) => ({ method: m, amount: pay[m] }));
  const settlement = settlePayments(totals.total, payments);

  function selectCustomer(c: Customer) {
    setCustomer(c); setCustQuery(`${c.name} · ${c.phone}`); setCustResults([]); setShowNewCust(false); setCustMsg('');
  }

  async function addCustomer() {
    setCustMsg('');
    if (!newName.trim()) { setCustMsg('Customer name is required'); return; }
    if (!newPhone.trim()) { setCustMsg('Phone number is required for every customer'); return; }
    const res = await fetch('/api/v1/customers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
    });
    const j = await res.json();
    if (!j.success) { setCustMsg(j.error?.message ?? 'Could not add customer'); return; }
    if (j.data.existing) setCustMsg('A customer with this phone already exists — selected their profile.');
    selectCustomer(j.data);
    setNewName(''); setNewPhone('');
  }

  function clearCustomer() { setCustomer(null); setCustQuery(''); setShowNewCust(false); setCustMsg(''); }

  async function checkout() {
    setError('');
    if (cart.length === 0) { setError('Cart is empty'); return; }
    if (settlement.outstanding > 0 && !customer) {
      setError('A customer is required for a credit (partial/unpaid) sale.'); return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/v1/sales', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId, customerId: customer?.id ?? null,
          items: cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unit: l.unit, unitPrice: l.unitPrice })),
          payments,
        }),
      });
      const j = await res.json();
      if (!j.success) { setError(j.error?.message ?? 'Sale failed'); return; }
      setResult({ saleId: j.data.sale.id, invoiceNumber: j.data.invoiceNumber, total: j.data.totals.total, outstanding: j.data.settlement.outstanding });
      setCart([]); setPay({ CASH: 0, CARD: 0, BANK: 0, ONLINE: 0 });
      clearCustomer(); setQuery('');
      fetch('/api/v1/products').then((r) => r.json()).then((jj) => jj.success && setProducts(jj.data));
    } catch { setError('Network error'); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-5">
      {/* Products */}
      <div className="flex flex-col lg:col-span-3">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <span className="text-sm text-muted">{store}</span>
        </div>
        <input autoFocus className="input mb-4" placeholder="Search product name, SKU or barcode…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0}
              className="group flex flex-col overflow-hidden rounded-xl border border-line bg-surface text-left transition hover:border-brand hover:shadow-sm disabled:opacity-40">
              <div className="flex h-24 w-full items-center justify-center bg-canvas">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl text-muted">🛒</span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="font-semibold leading-tight">{p.name}</div>
                <div className="mt-1 text-base font-bold text-brand">{fmt(p.sellingPrice)}</div>
                <div className={`mt-auto pt-2 text-xs ${p.stock <= 0 ? 'text-red-500' : 'text-muted'}`}>{p.stock} {p.baseUnit} in stock</div>
              </div>
            </button>
          ))}
          {products.length === 0 && <p className="col-span-full text-sm text-muted">No products found.</p>}
        </div>
      </div>

      {/* Cart / checkout */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface lg:col-span-2">
        <div className="border-b border-line px-4 py-3 font-semibold">Current Sale</div>

        {/* Customer */}
        <div className="border-b border-line p-4">
          <label className="label">Customer</label>
          {customer ? (
            <div className="flex items-center justify-between rounded-lg bg-brand-soft px-3 py-2 text-sm">
              <span><b>{customer.name}</b> · {customer.phone}</span>
              <button onClick={clearCustomer} className="text-xs text-brand hover:underline">Change</button>
            </div>
          ) : (
            <>
              <input className="input" placeholder="Search by phone or name…" value={custQuery}
                onChange={(e) => { setCustQuery(e.target.value); setShowNewCust(false); }} />
              {custResults.length > 0 && (
                <div className="mt-1 overflow-hidden rounded-lg border border-line text-sm">
                  {custResults.map((c) => (
                    <button key={c.id} onClick={() => selectCustomer(c)} className="block w-full px-3 py-2 text-left hover:bg-canvas">
                      {c.name} · {c.phone}
                    </button>
                  ))}
                </div>
              )}
              {!showNewCust && (
                <button onClick={() => { setShowNewCust(true); setNewPhone(custQuery.replace(/[^\d+]/g, '')); }} className="mt-2 text-xs font-medium text-brand hover:underline">
                  + Add new customer
                </button>
              )}
              {showNewCust && (
                <div className="mt-2 space-y-2 rounded-lg border border-line p-3">
                  <input className="input" placeholder="Customer name (required)" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <input className="input" placeholder="Phone number (required)" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
                  <div className="flex gap-2">
                    <button onClick={addCustomer} className="btn btn-primary btn-sm">Save customer</button>
                    <button onClick={() => setShowNewCust(false)} className="btn btn-ghost btn-sm">Cancel</button>
                  </div>
                </div>
              )}
              {custMsg && <p className="mt-2 text-xs text-amber-600">{custMsg}</p>}
              <p className="mt-1 text-xs text-muted">Walk-in cash sales can skip this. Credit sales require a customer.</p>
            </>
          )}
        </div>

        {/* Cart lines */}
        <div className="flex-1 overflow-auto p-4">
          {cart.length === 0 ? (
            <p className="text-sm text-muted">Tap a product to add it to the sale.</p>
          ) : (
            <ul className="space-y-2">
              {cart.map((l) => (
                <li key={l.productId} className="flex items-center gap-2 border-b border-line pb-2 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted">{fmt(l.unitPrice)} / {l.unit}</div>
                  </div>
                  <div className="flex items-center rounded-lg border border-line">
                    <button onClick={() => setQty(l.productId, l.quantity - 1)} className="px-2 py-1 text-muted hover:text-ink">−</button>
                    <input value={l.quantity} onChange={(e) => setQty(l.productId, Number(e.target.value) || 1)} className="w-10 border-x border-line py-1 text-center outline-none" />
                    <button onClick={() => setQty(l.productId, l.quantity + 1)} className="px-2 py-1 text-muted hover:text-ink">+</button>
                  </div>
                  <div className="w-20 text-right font-semibold">{fmt(l.unitPrice * l.quantity)}</div>
                  <button onClick={() => removeLine(l.productId)} className="text-red-400 hover:text-red-600">✕</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals + payments */}
        <div className="space-y-2 border-t border-line p-4 text-sm">
          <div className="flex justify-between text-lg font-bold"><span>Total</span><span>{fmt(totals.total)}</span></div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {(['CASH', 'CARD', 'BANK', 'ONLINE'] as Method[]).map((m) => (
              <label key={m} className="text-xs">
                <span className="text-muted">{m === 'BANK' ? 'BANK TRANSFER' : m}</span>
                <input type="number" min={0} value={pay[m] || ''} onChange={(e) => setPay((p) => ({ ...p, [m]: Number(e.target.value) || 0 }))} className="input mt-1 py-1.5" placeholder="0" />
              </label>
            ))}
          </div>
          <button onClick={() => setPay((p) => ({ ...p, CASH: Math.max(0, totals.total - p.CARD - p.BANK - p.ONLINE) }))} className="text-xs font-medium text-brand hover:underline">
            Auto-fill cash for the remaining balance
          </button>
          <div className="flex justify-between"><span className="text-muted">Paid</span><span>{fmt(settlement.paid)}</span></div>
          <div className={`flex justify-between font-semibold ${settlement.outstanding > 0 ? 'text-amber-600' : 'text-green-600'}`}>
            <span>{settlement.outstanding > 0 ? 'Credit (outstanding)' : 'Balance due'}</span><span>{fmt(settlement.outstanding)}</span>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

          {result ? (
            <div className="space-y-2 rounded-lg bg-green-50 p-3 text-sm text-green-800">
              <div>Sale completed — <b>{result.invoiceNumber}</b> · {fmt(result.total)}{result.outstanding > 0 ? ` · Credit ${fmt(result.outstanding)}` : ''}</div>
              <div className="flex gap-2">
                <a href={`/app/invoices/${result.saleId}`} target="_blank" className="btn btn-primary btn-sm">Open invoice</a>
                <a href={`/app/invoices/${result.saleId}?print=1`} target="_blank" className="btn btn-ghost btn-sm">Print / PDF</a>
                <button onClick={() => setResult(null)} className="btn btn-ghost btn-sm">New sale</button>
              </div>
            </div>
          ) : (
            <button onClick={checkout} disabled={busy} className="btn btn-primary w-full py-3">
              {busy ? 'Processing…' : `Complete sale · ${fmt(totals.total)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
