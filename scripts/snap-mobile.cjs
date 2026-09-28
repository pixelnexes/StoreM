const { chromium } = require('@playwright/test');
const BASE = 'http://localhost:3100';

(async () => {
  const b = await chromium.launch({
    headless: true,
    executablePath: `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`,
  });
  const c = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await c.newPage();
  await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await p.fill('input[name="phone"]', '03001234567');
  await p.fill('input[name="password"]', 'owner1234');
  await p.click('form button:not([type="button"])');
  await p.waitForURL(/\/app/, { timeout: 20000 });
  for (const [n, u] of [
    ['app-mobile-dashboard', '/app'],
    ['app-mobile-inventory', '/app/inventory'],
    ['app-mobile-pos', '/app/pos'],
  ]) {
    await p.goto(`${BASE}${u}`, { waitUntil: 'networkidle', timeout: 60000 });
    await p.waitForTimeout(700);
    console.log(n, '->', p.url());
    await p.screenshot({ path: `scripts/shots/${n}.png`, animations: 'disabled' });
  }
  await b.close();
})().catch((e) => { console.log('ERR', e.message); process.exit(1); });
