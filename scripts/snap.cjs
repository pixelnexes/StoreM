const { chromium } = require('@playwright/test');

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = 'scripts/shots';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`,
  });

  const shots = [
    ['landing-desktop', '/', { width: 1440, height: 1000 }, false],
    ['landing-mobile', '/', { width: 390, height: 844 }, true],
    ['login-desktop', '/login', { width: 1440, height: 900 }, false],
    ['login-mobile', '/login', { width: 390, height: 844 }, true],
    ['admin-login', '/admin/login', { width: 1440, height: 900 }, false],
  ];

  for (const [name, path, viewport, fullPage] of shots) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage, animations: 'disabled', timeout: 20000 })
      .then(() => console.log(`ok   ${name}`))
      .catch((e) => console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`));
    if (errors.length) console.log(`     console: ${errors.slice(0, 3).join(' | ')}`);
    await ctx.close();
  }

  await browser.close();
})();
