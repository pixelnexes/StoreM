/**
 * Wave-2 verification: mandatory customer on invoices, POS active/qty behaviour,
 * no autofill on auth, super-admin plans + store/user CRUD, plan gating.
 * Run against a locally started production build: BASE=http://localhost:3000
 */
const { chromium, request } = require('@playwright/test');

const BASE = process.env.BASE || 'http://localhost:3000';
const EXE = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`;

let pass = 0;
let fail = 0;
const ok = (cond, label) => {
  if (cond) { pass++; console.log(`  PASS ${label}`); }
  else { fail++; console.log(`  FAIL ${label}`); }
};
const bodyText = async (page) => (await page.locator('body').innerText()).replace(/\n+/g, ' | ');

(async () => {
  // ── A. Super admin API ─────────────────────────────────────
  console.log('\n=== A. super admin API ===');
  const rq = await request.newContext({ baseURL: BASE });

  const login = await rq.post('/api/admin/login', { data: { email: 'superadmin@markazos.app', password: 'admin1234' } });
  ok(login.ok(), 'admin login status');
  ok((await login.json()).success, 'admin login success');

  const plansJson = await (await rq.get('/api/admin/plans')).json();
  const plans = plansJson.data || [];
  const byKey = Object.fromEntries(plans.map((p) => [p.key, p]));
  ok(plans.length >= 4, `plans listed (${plans.length})`);
  ok(byKey.starter?.name === 'Basic' && byKey.starter?.priceMonthly === 5000, 'Basic = Rs 5,000');
  ok(byKey.professional?.name === 'Standard' && byKey.professional?.priceMonthly === 10000, 'Standard = Rs 10,000');
  ok(byKey.business?.name === 'Premium' && byKey.business?.priceMonthly === 15000, 'Premium = Rs 15,000');
  ok(byKey.enterprise?.name === 'Custom' && byKey.enterprise?.priceMonthly === 0, 'Custom = contact pricing');
  ok((byKey.starter?.modules || []).length === 3, 'Basic unlocks 3 modules');
  ok((byKey.enterprise?.modules || []).length === 6, 'Custom unlocks 6 modules');

  const std = byKey.professional;
  const patch = await rq.patch(`/api/admin/plans/${std.id}`, {
    data: { name: std.name, priceMonthly: std.priceMonthly, priceYearly: std.priceYearly, active: true, modules: std.modules },
  });
  ok(patch.ok() && (await patch.json()).success, 'PATCH plan (no-op save) accepted');

  const userPost = await rq.post('/api/admin/tenants/demo-store/users', {
    data: { name: 'QA Test User', phone: '03009990009', password: 'qatest12345', role: 'CASHIER' },
  });
  const userJson = await userPost.json();
  ok(userPost.ok() && userJson.success, `create store user (${userJson.data?.id || userJson.error?.message})`);
  if (userJson.success) {
    const del = await rq.delete(`/api/admin/users/${userJson.data.id}`);
    ok(del.ok() && (await del.json()).success, 'delete store user');
  }

  const tPatch = await rq.patch('/api/admin/tenants/demo-store', {
    data: { businessName: 'Demo Store', phone: '03000000000', planId: byKey.enterprise.id, subStatus: 'ACTIVE' },
  });
  ok(tPatch.ok() && (await tPatch.json()).success, 'PATCH store profile + plan');

  const adminPage = await rq.get('/admin');
  ok(adminPage.ok(), '/admin page 200');
  const plansPage = await rq.get('/admin/plans');
  const plansHtml = await plansPage.text();
  ok(plansPage.ok() && plansHtml.includes('Basic') && plansHtml.includes('Premium'), '/admin/plans renders plan names');
  const storePage = await rq.get('/admin/stores/demo-store');
  ok(storePage.ok() && (await storePage.text()).includes('Demo Owner'), '/admin/stores/demo-store renders users');

  // ── B. Auth forms refuse autofill ─────────────────────────
  console.log('\n=== B. login form autofill ===');
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const phoneInput = page.locator('input[name="phone"]');
  const pwdInput = page.locator('input[name="password"]');
  ok((await phoneInput.getAttribute('autocomplete')) === 'off', 'phone autocomplete=off');
  ok((await pwdInput.getAttribute('autocomplete')) === 'off', 'password autocomplete=off');
  ok((await phoneInput.getAttribute('readonly')) !== null, 'phone starts read-only (blocks browser autofill)');
  ok((await pwdInput.getAttribute('readonly')) !== null, 'password starts read-only');
  await phoneInput.focus();
  ok((await phoneInput.getAttribute('readonly')) === null, 'phone unlocks on focus');
  await pwdInput.focus();
  ok((await pwdInput.getAttribute('readonly')) === null, 'password unlocks on focus');
  const formAC = await page.locator('form[autocomplete="off"]').count();
  ok(formAC > 0, 'login form has autoComplete="off"');

  // ── C. POS flow — demo store owner ────────────────────────
  console.log('\n=== C. POS (Demo Store) ===');
  await phoneInput.fill('03009990001');
  await pwdInput.fill('demostore123');
  await page.click('form button:not([type="button"])');
  await page.waitForURL(/\/app/, { timeout: 20000 });
  const appBody = await bodyText(page);
  ok(/Custom/.test(appBody), 'plan chip shows plan name (Custom)');
  const navLabels = await page.locator('nav a').allInnerTexts();
  ok(navLabels.includes('Marketing'), `sidebar shows all modules for Custom plan (${navLabels.length} links)`);

  await page.goto(`${BASE}/app/pos`, { waitUntil: 'networkidle' });
  const tile = page.locator('button', { hasText: 'in stock' }).first();
  await tile.waitFor({ timeout: 15000 });
  const tileClass = await tile.getAttribute('class');
  const tileName = (await tile.innerText()).split('\n')[0];
  await tile.click();
  await page.waitForTimeout(200);
  const tileClassAfter = await tile.getAttribute('class');
  ok(/border-brand/.test(tileClassAfter || ''), `product tile becomes active (${tileName})`);
  ok(await page.locator('span:has-text("in sale")').first().isVisible(), 'tile shows "N in sale" badge');
  const line = page.locator('#pos-cart li').first();
  ok(/border-l-brand/.test((await line.getAttribute('class')) || ''), 'cart line shows active left rule');

  // Qty draft: type a value without it snapping back.
  const qty = page.locator('input[aria-label^="Quantity of"]').first();
  await qty.fill('3');
  const typed = await qty.inputValue();
  ok(typed === '3', `qty stays typed value (${typed})`);
  await page.keyboard.press('Tab');
  await page.waitForTimeout(300);
  ok((await qty.inputValue()) === '3', 'qty still 3 after blur/commit');
  ok(await page.locator('span:has-text("3 in sale")').first().isVisible(), 'badge follows typed qty (3 in sale)');

  // Checkout without a customer must be refused.
  await page.click('button:has-text("Complete sale")');
  await page.waitForTimeout(400);
  let t = await bodyText(page);
  ok(/Customer name and phone number are required on every invoice\./.test(t), 'checkout blocked without customer');
  ok(await page.locator('#pos-customer').evaluate((el) => getComputedStyle(el).borderColor.includes('145') || /rgb\(145, 56, 40\)/.test(getComputedStyle(el).borderTopColor)), 'customer block highlighted red');

  // Pick the customer, then complete the sale.
  const custInput = page.locator('#pos-customer input.input').first();
  await custInput.fill('Bilal');
  await page.waitForTimeout(600);
  const firstResult = page.locator('#pos-customer button', { hasText: '03218000001' }).first();
  await firstResult.waitFor({ timeout: 8000 });
  await firstResult.click();
  ok(/Bilal Ahmed/.test(await bodyText(page)), 'customer selected');
  await page.click('button:has-text("Complete sale")');
  await page.waitForSelector('text=/Sale completed/i', { timeout: 20000 }).catch(() => {});
  t = await bodyText(page);
  ok(/Sale completed/i.test(t), `sale completes once customer is set (${t.slice(t.search(/Sale/i), 120)})`);
  const invHref = await page.locator('a:has-text("Open invoice")').first().getAttribute('href');
  ok(!!invHref, `invoice link present (${invHref})`);

  await page.goto(`${BASE}${invHref}`, { waitUntil: 'networkidle' });
  t = await bodyText(page);
  ok(/billed to/i.test(t), 'invoice has "Billed to" block');
  ok(/Bilal Ahmed/.test(t) && /03218000001/.test(t), 'invoice prints customer name and phone');

  // ── D. Plan gating — main store (Standard, no marketing) ─
  console.log('\n=== D. plan gating ===');
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await p2.locator('input[name="phone"]').focus();
  await p2.locator('input[name="phone"]').fill('03001234567');
  await p2.locator('input[name="password"]').focus();
  await p2.locator('input[name="password"]').fill('owner1234');
  await p2.click('form button:not([type="button"])');
  await p2.waitForURL(/\/app/, { timeout: 20000 });
  const nav2 = await p2.locator('nav a').allInnerTexts();
  ok(!nav2.includes('Marketing'), `Marketing hidden from sidebar on Standard plan (${nav2.join(', ')})`);
  await p2.goto(`${BASE}/app/marketing`, { waitUntil: 'networkidle' });
  const mktText = await bodyText(p2);
  console.log('  marketing page:', mktText.slice(0, 240));
  ok(/not in your plan/i.test(mktText), 'marketing page shows upgrade gate');

  await browser.close();

  // ── E. Design audit on the new admin pages ────────────────
  console.log('\n=== E. new admin pages reachable ===');
  ok(plansPage.ok() && storePage.ok(), 'plans + store pages 200');

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
