const { chromium } = require('@playwright/test');
const BASE = process.env.BASE || 'http://localhost:3100';
const EXE = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`;

const ROUTES = ['/', '/login', '/admin/login', '/app', '/app/pos', '/app/inventory', '/app/sales', '/app/purchases', '/app/customers', '/app/suppliers', '/app/khata', '/app/marketing', '/app/reports', '/app/settings'];

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F2FF}]/u;

function hueIsBluePurple(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  if (d < 35) return false;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60; if (h < 0) h += 360;
  return (h >= 195 && h <= 285) && max > 40 && d > 60;
}

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();

  const fail = (m) => console.log('FAIL ' + m);

  async function login(kind) {
    if (kind === 'admin') {
      await page.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
      await page.focus('input[name="email"]');
      await page.fill('input[name="email"]', 'superadmin@markazos.app');
      await page.focus('input[name="password"]');
      await page.fill('input[name="password"]', 'admin1234');
      await page.click('form button:not([type="button"])');
      await page.waitForURL(/\/admin(?!\/login)/, { timeout: 20000 });
    } else {
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
      await page.focus('input[name="phone"]');
      await page.fill('input[name="phone"]', '03001234567');
      await page.focus('input[name="password"]');
      await page.fill('input[name="password"]', 'owner1234');
      await page.click('form button:not([type="button"])');
      await page.waitForURL(/\/app/, { timeout: 20000 });
    }
    await page.waitForTimeout(500);
  }

  await login('owner');

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(400);

    const r = await page.evaluate(({ route, EMOJI_SRC }) => {
      const emoji = new RegExp(EMOJI_SRC, 'u');
      const out = { route };
      out.url = location.pathname;
      out.bodyBg = getComputedStyle(document.body).backgroundColor;
      out.bodyFont = getComputedStyle(document.body).fontFamily.split(',')[0].replace(/["']/g, '');
      const h1 = document.querySelector('h1, h2');
      out.headingFont = h1 ? getComputedStyle(h1).fontFamily.split(',')[0].replace(/["']/g, '') : '(none)';
      out.h1Count = document.querySelectorAll('h1').length;

      const radii = new Map();
      const colors = new Set();
      const emojiHits = new Set();
      let roundedCount = 0, pillCount = 0;
      for (const el of document.querySelectorAll('body *')) {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        if (rect.width > 4 && rect.height > 4) {
          for (const p of ['borderTopLeftRadius', 'borderTopRightRadius', 'borderBottomLeftRadius', 'borderBottomRightRadius']) {
            const v = cs[p];
            if (!v || v === '0px') continue;
            const px = parseFloat(v);
            radii.set(v, (radii.get(v) || 0) + 1);
            roundedCount++;
            if (px > 100 || v === '9999px') pillCount++;
          }
          for (const p of ['backgroundColor', 'color', 'borderTopColor']) {
            const m = cs[p].match(/rgba?\((\d+), (\d+), (\d+)/);
            if (m) colors.add(`${+m[1]},${+m[2]},${+m[3]}`);
          }
        }
        const t = el.children.length === 0 ? el.textContent || '' : '';
        const found = t.match(emoji);
        if (found) emojiHits.add(found[0]);
      }
      out.radii = [...radii.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
      out.maxRadius = out.radii.reduce((m, [v]) => Math.max(m, parseFloat(v)), 0);
      out.pillCount = pillCount;
      out.emoji = [...emojiHits];
      out.colors = [...colors];
      out.fontsLoaded = {
        plex: document.fonts.check('16px "IBM Plex Sans"'),
        fraunces: document.fonts.check('16px Fraunces'),
      };
      return out;
    }, { route, EMOJI_SRC: EMOJI.source });

    console.log(`--- ${route}`);
    console.log(`    url=${r.url} bg=${r.bodyBg} bodyFont=${r.bodyFont} headingFont=${r.headingFont} h1=${r.h1Count}`);
    console.log(`    fonts plex=${r.fontsLoaded.plex} fraunces=${r.fontsLoaded.fraunces} maxRadius=${r.maxRadius}px pill=${r.pillCount}`);
    if (r.bodyBg.replace(/\s/g, '') !== 'rgb(245,241,233)') fail(`${route} body bg ${r.bodyBg}`);
    if (!/IBM_Plex_Sans/.test(r.bodyFont)) fail(`${route} body font ${r.bodyFont}`);
    if (r.h1Count > 0 && !/Fraunces/.test(r.headingFont)) fail(`${route} heading font ${r.headingFont}`);
    if (!r.fontsLoaded.plex) fail(`${route} IBM Plex Sans not loaded`);
    if (!r.fontsLoaded.fraunces) fail(`${route} Fraunces not loaded`);
    if (r.maxRadius > 8) fail(`${route} radius ${r.maxRadius}px`);
    if (r.pillCount > 0) fail(`${route} pill corners: ${r.pillCount}`);
    if (r.emoji.length) fail(`${route} emoji: ${r.emoji.join(' ')}`);
    const bluePurple = (r.colors || []).filter((c) => {
      const [rr, gg, bb] = c.split(',').map(Number);
      return hueIsBluePurple(rr, gg, bb);
    });
    if (bluePurple.length) fail(`${route} blue/purple colors: ${bluePurple.slice(0, 5).join(' | ')}`);
    const STOCK = new Set(['248,113,113', '239,68,68', '220,38,38', '217,119,6', '245,158,11', '22,163,74', '22,101,52', '26,115,232', '79,70,229']);
    const stock = (r.colors || []).filter((c) => STOCK.has(c));
    if (stock.length) fail(`${route} stock Tailwind colors: ${stock.join(' | ')}`);
    console.log(`    radii: ${r.radii.map(([v, n]) => `${v}x${n}`).join(', ')}`);
  }

  await login('admin');
  for (const route of ['/admin', '/admin/plans', '/admin/stores/demo-store']) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(400);
    const url = page.url();
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    console.log(`--- ${route} -> ${url} bg=${bg}`);
    if (url.includes('/admin/login')) fail(`${route} bounced to login`);
    if (bg.replace(/\s/g, '') !== 'rgb(245,241,233)') fail(`${route} body bg ${bg}`);
  }

  await browser.close();
  console.log('audit complete');
})().catch((e) => { console.log('ERR ' + e.message); process.exit(1); });
