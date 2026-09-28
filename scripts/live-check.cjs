const { chromium } = require('@playwright/test');

const BASE = 'https://storez.zoqonyx.com';

function tracker(page, tag) {
  const events = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') events.push(`[${tag}][console.${m.type()}] ${m.text()}`);
  });
  page.on('pageerror', (e) => events.push(`[${tag}][pageerror] ${e.message}`));
  page.on('response', async (res) => {
    const url = res.url();
    const status = res.status();
    const isApi = url.includes('/api/');
    if (status < 400 && !isApi) return;
    let body = '';
    try { body = (await res.text()).slice(0, 400); } catch { body = '<no body>'; }
    const kind = res.request().resourceType();
    events.push(`[${tag}][net] ${status} ${res.request().method()} ${kind} ${url} -> ${isApi ? body : '<asset>'}`);
  });
  return events;
}

async function shot(page, name) {
  try {
    await page.screenshot({ path: `scripts/${name}.png`, animations: 'disabled', caret: 'hide', timeout: 15000 });
    console.log(`  saved scripts/${name}.png`);
  } catch (e) {
    console.log(`  screenshot ${name} failed: ${e.message.split('\n')[0]}`);
  }
}

async function flow({ label, url, fill, submit }) {
  const browser = await chromium.launch({
    headless: true,
    executablePath: `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe`,
  });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const events = tracker(page, label);

  console.log(`\n=== ${label} ===`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(6000);
  await shot(page, `${label}-1-loaded`);

  for (const [sel, val] of fill) {
    try { await page.fill(sel, val, { timeout: 8000 }); } catch (e) { console.log(`  fill ${sel} failed: ${e.message.split('\n')[0]}`); }
  }
  await shot(page, `${label}-2-filled`);

  const before = page.url();
  try {
    await Promise.all([
      page.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {}),
      page.click(submit, { timeout: 8000 }),
    ]);
  } catch (e) { console.log(`  submit failed: ${e.message.split('\n')[0]}`); }
  await page.waitForTimeout(4000);
  await shot(page, `${label}-3-after`);

  const text = (await page.locator('body').innerText().catch(() => '')).replace(/\n+/g, ' | ');
  console.log('  before url :', before);
  console.log('  after  url :', page.url());
  console.log('  body text  :', text.slice(0, 600));
  console.log('  events     :');
  console.log(events.length ? events.map((e) => '    ' + e).join('\n') : '    (none)');

  await browser.close();
}

(async () => {
  await flow({
    label: 'store-login',
    url: `${BASE}/login`,
    fill: [['input[name="phone"]', '03001234567'], ['input[type="password"]', 'owner1234']],
    submit: 'form button:not([type="button"])',
  });

  await flow({
    label: 'admin-login',
    url: `${BASE}/admin/login`,
    fill: [['input[type="email"]', 'superadmin@markazos.app'], ['input[type="password"]', 'admin1234']],
    submit: 'form button:not([type="button"])',
  });
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
