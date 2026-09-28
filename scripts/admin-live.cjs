const { chromium } = require('@playwright/test');
const BASE = process.env.BASE || 'https://storez.zoqonyx.com';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`,
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const events = [];
  page.on('response', async (res) => {
    if (res.status() < 400 && !res.url().includes('/api/')) return;
    let body = '';
    try { body = (await res.text()).slice(0, 300); } catch {}
    events.push(`${res.status()} ${res.request().method()} ${res.url()} -> ${body}`);
  });

  await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.fill('input[type="email"]', 'superadmin@markazos.app');
  await page.fill('input[type="password"]', 'admin1234');
  await page.click('form button:not([type="button"])');
  await page.waitForTimeout(5000);
  console.log('after url:', page.url());
  const text = (await page.locator('body').innerText()).replace(/\n+/g, ' | ');
  console.log('body:', text.slice(0, 500));
  console.log('events:\n  ' + (events.join('\n  ') || '(none)'));

  for (const p of ['/admin/tenants', '/admin']) {
    await page.goto(`${BASE}${p}`, { waitUntil: 'networkidle', timeout: 60000 });
    const t = (await page.locator('body').innerText()).replace(/\n+/g, ' | ');
    console.log(`${p}: ${t.slice(0, 220)}`);
  }
  await browser.close();
})().catch((e) => { console.log('ERR ' + e.message.split('\n')[0]); process.exit(1); });
