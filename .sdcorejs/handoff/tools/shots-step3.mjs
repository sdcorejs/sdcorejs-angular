// Step 3 (checkbox / radio) before/after screenshots. Usage: node shots3.mjs <baseUrl> <outDir> <label>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir, label] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const shot = name => join(outDir, `${name}-${label}.png`);
const log = (...a) => console.log(label, ...a);

async function open(path) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
}
async function previews() {
  return page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
}
async function reveal(id) {
  const preview = page.locator(`[id="${id}"]`);
  await preview.scrollIntoViewIfNeeded();
  await preview.locator('demo-section').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  return preview;
}
async function step(name, fn) {
  try {
    await fn();
    log('ok', name);
  } catch (e) {
    log('FAIL', name, String(e).split('\n')[0]);
  }
}
const pick = (ids, re) => ids.find(id => re.test(id));

await step('checkbox', async () => {
  await open('/v/latest/forms/checkbox/examples');
  const ids = await previews();
  log('checkbox previews', ids.join(' '));
  const sizes = pick(ids, /kich-thuoc|size/) ?? ids[0];
  const p = await reveal(sizes);
  await p.screenshot({ path: shot('01-checkbox-sizes') });
  const first = await reveal(ids[0]);
  await first.screenshot({ path: shot('02-checkbox-basic') });
  const unchecked = first.locator('input[type="checkbox"]:not(:checked)').first();
  if (await unchecked.count()) {
    await unchecked.focus();
    await page.waitForTimeout(200);
    await first.screenshot({ path: shot('03-checkbox-unchecked-focus') });
  }
});

await step('radio', async () => {
  await open('/v/latest/forms/radio/examples');
  const ids = await previews();
  log('radio previews', ids.join(' '));
  const p = await reveal(ids[0]);
  await p.screenshot({ path: shot('04-radio-basic') });
});

await step('select-multiple', async () => {
  await open('/v/latest/forms/select/examples');
  const ids = await previews();
  const p = await reveal(pick(ids, /chon-nhieu/) ?? ids[0]);
  const field = p.locator('mat-form-field').first();
  await field.locator('mat-select').click();
  const panel = page.locator('.mat-mdc-select-panel').first();
  await panel.waitFor();
  await page.waitForTimeout(500);
  const f = await field.boundingBox();
  const b = await panel.boundingBox();
  const x = Math.min(f.x, b.x) - 8;
  const y = Math.min(f.y, b.y) - 8;
  await page.screenshot({
    path: shot('05-select-multiple'),
    clip: { x, y, width: Math.max(f.x + f.width, b.x + b.width) - x + 8, height: Math.max(f.y + f.height, b.y + b.height) - y + 8 },
  });
  await page.keyboard.press('Escape');
});

await step('table-selection', async () => {
  await open('/v/latest/components/table/examples');
  const ids = await previews();
  log('table previews', ids.join(' '));
  for (const id of ids) {
    const p = await reveal(id);
    if (await p.locator('.c-selection').count()) {
      const table = p.locator('table').first();
      const box = await table.boundingBox();
      await page.screenshot({ path: shot('06-table-selection'), clip: { x: box.x, y: box.y, width: Math.min(box.width, 520), height: Math.min(box.height, 260) } });
      log('table selection example', id);
      return;
    }
  }
  log('table: no example with a selection column');
});

await browser.close();
