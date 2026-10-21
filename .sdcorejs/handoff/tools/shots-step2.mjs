// Before/after screenshots of the showcase for the design handoff steps.
// Usage: node shots.mjs <baseUrl> <outDir> <label>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');

const [base, outDir, label] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const shot = name => join(outDir, `${name}-${label}.png`);
const log = (...a) => console.log(label, ...a);

async function open(path) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
}

/** Scrolls a demo preview into view and waits for its live content. */
async function reveal(id) {
  const preview = page.locator(`[id="${id}"]`);
  await preview.scrollIntoViewIfNeeded();
  await preview.locator('demo-section').first().waitFor({ timeout: 15000 });
  await page.waitForTimeout(300);
  return preview;
}

async function previews() {
  return page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
}

/** Screenshot a clip that covers every given box, padded. */
async function clipShot(name, boxes, pad = 12) {
  const b = boxes.filter(Boolean);
  const x = Math.max(0, Math.min(...b.map(r => r.x)) - pad);
  const y = Math.max(0, Math.min(...b.map(r => r.y)) - pad);
  const w = Math.max(...b.map(r => r.x + r.width)) + pad - x;
  const h = Math.max(...b.map(r => r.y + r.height)) + pad - y;
  await page.screenshot({ path: shot(name), clip: { x, y, width: w, height: h } });
}

async function step(name, fn) {
  try {
    await fn();
    log('ok', name);
  } catch (e) {
    log('FAIL', name, String(e).split('\n')[0]);
  }
}

// 1. Input: rest + focus, disabled / readonly, sizes.
await step('input', async () => {
  await open('/v/latest/forms/input/examples');
  log('input previews', (await previews()).join(' '));
  const basic = await reveal('forms-input-example-co-ban-preview');
  await basic.screenshot({ path: shot('01-input-rest') });
  await basic.locator('mat-form-field input').first().focus();
  await page.waitForTimeout(300);
  await basic.screenshot({ path: shot('02-input-focus') });
  await page.locator('body').click({ position: { x: 5, y: 5 } });
  const states = await reveal('forms-input-example-trang-thai-preview');
  await states.screenshot({ path: shot('03-input-disabled-readonly') });
  const sizes = await reveal('forms-input-example-kich-thuoc-preview');
  await sizes.screenshot({ path: shot('04-input-sizes') });
});

// 2. Select: open panel of the first example; panel with filter input focused if one exists.
await step('select', async () => {
  await open('/v/latest/forms/select/examples');
  const ids = await previews();
  log('select previews', ids.join(' '));
  const first = await reveal(ids[0]);
  const field = first.locator('mat-form-field').first();
  await field.locator('mat-select').click();
  const panel = page.locator('.mat-mdc-select-panel').first();
  await panel.waitFor();
  await page.waitForTimeout(400);
  await clipShot('05-select-panel', [await field.boundingBox(), await panel.boundingBox()]);
  await page.keyboard.press('Escape');
});

// 2b. Virtual-scroll select: long list, so the panel has the filter input; focus it.
await step('select-filter', async () => {
  await open('/v/latest/forms/select/examples');
  const preview = await reveal('forms-select-example-cuon-ao-preview');
  const field = preview.locator('mat-form-field').first();
  await field.locator('mat-select').click();
  const panel = page.locator('.mat-mdc-select-panel').first();
  await panel.waitFor();
  await page.waitForTimeout(500);
  const filter = page.locator('.sd-select-panel .filter-input-wrapper input').first();
  if (await filter.count()) {
    await filter.focus();
    await page.waitForTimeout(200);
  } else {
    log('select-filter: no filter input');
  }
  await clipShot('06-select-virtual-filter', [await field.boundingBox(), await panel.boundingBox()]);
  await page.keyboard.press('Escape');
});

// 3. Entity picker: rest + focus.
await step('entity-picker', async () => {
  await open('/v/latest/forms/entity-picker/examples');
  const ids = await previews();
  log('entity previews', ids.join(' '));
  const first = await reveal(ids[0]);
  await first.screenshot({ path: shot('07-entity-rest') });
  await first.locator('[data-entity-picker-trigger]').first().focus();
  await page.waitForTimeout(300);
  await first.screenshot({ path: shot('08-entity-focus') });
});

// 4. Operator menu.
await step('operator', async () => {
  await open('/v/latest/components/operator/examples');
  const ids = await previews();
  log('operator previews', ids.join(' '));
  const first = await reveal(ids[0]);
  const trigger = first.locator('.c-op-trigger').first();
  await trigger.click();
  const menu = page.locator('.mat-mdc-menu-panel.c-op-menu').first();
  await menu.waitFor();
  await page.waitForTimeout(400);
  await clipShot('09-operator-menu', [await trigger.boundingBox(), await menu.boundingBox()]);
  await page.keyboard.press('Escape');
});

// 5. Date picker calendar.
await step('date', async () => {
  await open('/v/latest/forms/date/examples');
  const ids = await previews();
  const first = await reveal(ids[0]);
  const field = first.locator('mat-form-field').first();
  await field.locator('.mat-datepicker-toggle button, button[aria-label]').first().click();
  const cal = page.locator('.mat-datepicker-content').first();
  await cal.waitFor();
  await page.waitForTimeout(400);
  await clipShot('10-date-calendar', [await field.boundingBox(), await cal.boundingBox()]);
  await page.keyboard.press('Escape');
});

// 6. Dark mode: input rest + focus.
await step('dark', async () => {
  await open('/v/latest/forms/input/examples');
  await page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'));
  const basic = await reveal('forms-input-example-co-ban-preview');
  await basic.locator('mat-form-field input').first().focus();
  await page.waitForTimeout(300);
  await basic.screenshot({ path: shot('11-input-focus-dark') });
});

await browser.close();
