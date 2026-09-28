const { chromium } = require('@playwright/test');
const BASE = 'https://storez.zoqonyx.com';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`,
  });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const log = [];
  page.on('response', (res) => {
    if (!res.url().includes('zoqonyx.com')) return;
    log.push(`${res.status()} ${res.request().resourceType()} ${res.url().replace(BASE, '').slice(0, 90)}`);
  });
  page.on('pageerror', (e) => log.push('PAGEERROR ' + e.message.split('\n')[0]));
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) log.push('NAV -> ' + f.url().replace(BASE, '').slice(0, 90)); });

  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => log.push('GOTO ' + e.message.split('\n')[0]));
  await page.waitForTimeout(15000);

  console.log('url=' + page.url());
  const scripts = await page.evaluate(() => document.querySelectorAll('script[src]').length);
  console.log('script tags=' + scripts);
  console.log('--- network log:');
  console.log(log.join('\n'));

  console.log('--- attempting click');
  const before = page.url();
  await page.click('form button:not([type="button"])').catch((e) => log.push('CLICK ' + e.message.split('\n')[0]));
  await page.waitForTimeout(6000);
  console.log('before=' + before);
  console.log('after =' + page.url());
  const t = (await page.locator('body').innerText().catch(() => '')).replace(/\n+/g, ' | ');
  console.log('body: ' + t.slice(0, 400));
  await browser.close();
})().catch((e) => { console.log('ERR ' + e.message.split('\n')[0]); process.exit(1); });
