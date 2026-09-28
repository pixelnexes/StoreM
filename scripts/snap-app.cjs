const { chromium } = require('@playwright/test');

const BASE = process.env.BASE || 'http://localhost:3100';
const OUT = 'scripts/shots';
const EXE = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`;

async function login(page, kind) {
  if (kind === 'admin') {
    await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
    await page.fill('input[name="email"]', 'superadmin@markazos.app');
    await page.fill('input[name="password"]', 'admin1234');
  } else {
    await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[name="phone"]', '03001234567');
    await page.fill('input[name="password"]', 'owner1234');
  }
  await page.click('form button:not([type="button"])');
  await page.waitForURL(kind === 'admin' ? /\/admin(?!\/login)/ : /\/app/, { timeout: 20000 });
  await page.waitForTimeout(600);
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });

  const sets = [
    {
      kind: 'owner',
      pages: [
        ['app-dashboard', '/app', false],
        ['app-pos', '/app/pos', true],
        ['app-inventory', '/app/inventory', true],
        ['app-customers', '/app/customers', true],
        ['app-invoices', '/app/invoices', true],
        ['app-khata', '/app/khata', true],
        ['app-sales', '/app/sales', true],
        ['app-purchases', '/app/purchases', true],
        ['app-suppliers', '/app/suppliers', true],
        ['app-reports', '/app/reports', true],
        ['app-marketing', '/app/marketing', true],
        ['app-settings', '/app/settings', true],
      ],
    },
    {
      kind: 'admin',
      pages: [
        ['admin-home', '/admin', true],
        ['admin-tenants', '/admin/tenants', true],
      ],
    },
  ];

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));

  for (const set of sets) {
    errors.length = 0;
    try {
      await login(page, set.kind);
      console.log(`login ok (${set.kind})`);
    } catch (e) {
      console.log(`LOGIN FAIL (${set.kind}): ${e.message.split('\n')[0]}`);
      console.log(`  url: ${page.url()}`);
      console.log(`  console: ${errors.slice(0, 5).join(' | ')}`);
      await page.screenshot({ path: `${OUT}/fail-${set.kind}.png` }).catch(() => {});
      continue;
    }

    for (const [name, path, fullPage] of set.pages) {
      errors.length = 0;
      await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${OUT}/${name}.png`, fullPage, animations: 'disabled', timeout: 20000 })
        .then(() => console.log(`ok   ${name}`))
        .catch((e) => console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`));
      if (errors.length) console.log(`     console: ${errors.slice(0, 3).join(' | ')}`);
    }
  }

  const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const mp = await mob.newPage();
  try {
    await login(mp, 'owner');
    for (const [name, path] of [['app-mobile-dashboard', '/app'], ['app-mobile-inventory', '/app/inventory'], ['app-mobile-pos', '/app/pos']]) {
      await mp.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
      await mp.waitForTimeout(700);
      await mp.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled', timeout: 20000 })
        .then(() => console.log(`ok   ${name}`))
        .catch((e) => console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`));
    }
  } catch (e) {
    console.log(`MOBILE LOGIN FAIL: ${e.message.split('\n')[0]}`);
  }

  await browser.close();
})();
