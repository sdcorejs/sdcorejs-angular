// Review fixes of the select / autocomplete panels: before/after shots of the field plus its open panel.
// Usage: node shots-panels.mjs <baseUrl> <outDir> <label>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir, label] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const shot = name => join(outDir, `${name}-${label}.png`);
const log = (...a) => console.log(label, ...a);

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    log('FAIL', name, String(e).split('\n')[0]);
  }
}

async function openPreview(path, idPart) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const preview = page.locator(`[id$="${idPart}-preview"]`).first();
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  await page.waitForTimeout(1200);
  // Leave room below the field so the panel opens downwards.
  await preview.evaluate(el => {
    const bar = document.querySelector('.topbar');
    window.scrollBy(0, el.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 0) - 16);
  });
  await page.waitForTimeout(400);
  return preview;
}

// Shoots the field and the open panel together.
async function clipFieldAndPanel(name, field, panelSelector) {
  const panel = page.locator(panelSelector).first();
  await panel.waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  const a = await field.boundingBox();
  const b = await panel.boundingBox();
  const x = Math.min(a.x, b.x) - 12;
  const y = Math.min(a.y, b.y) - 12;
  const right = Math.max(a.x + a.width, b.x + b.width) + 12;
  const bottom = Math.max(a.y + a.height, b.y + b.height) + 12;
  await page.screenshot({ path: shot(name), clip: { x, y, width: right - x, height: Math.min(bottom - y, 900 - y) } });
  log('ok', name);
}

await step('select single', async () => {
  const preview = await openPreview('/v/latest/forms/select/examples', 'co-ban');
  const field = preview.locator('mat-form-field').first();
  await field.locator('.mat-mdc-select-trigger').click();
  await page.mouse.move(0, 0);
  await clipFieldAndPanel('01-select-single', field, '.sd-select-panel');
  await page.keyboard.press('Escape');
});

await step('select hover', async () => {
  const preview = await openPreview('/v/latest/forms/select/examples', 'co-ban');
  const field = preview.locator('mat-form-field').first();
  await field.locator('.mat-mdc-select-trigger').click();
  await page.locator('.sd-select-panel mat-option').nth(1).hover();
  await clipFieldAndPanel('02-select-hover', field, '.sd-select-panel');
  await page.keyboard.press('Escape');
});

await step('select all', async () => {
  const preview = await openPreview('/v/latest/forms/select/examples', 'chon-nhieu-voi-dong-tat-ca');
  const field = preview.locator('mat-form-field').first();
  await field.locator('.mat-mdc-select-trigger').click();
  await page.mouse.move(0, 0);
  await clipFieldAndPanel('03-select-all', field, '.sd-select-panel');
  await page.keyboard.press('Escape');
});

await step('select with search', async () => {
  const preview = await openPreview('/v/latest/forms/select/examples', 'cuon-ao');
  const field = preview.locator('mat-form-field').first();
  await field.locator('.mat-mdc-select-trigger').click();
  await page.mouse.move(0, 0);
  await clipFieldAndPanel('04-select-search', field, '.sd-select-panel');
  await page.keyboard.press('Escape');
});

await step('autocomplete reopened', async () => {
  await page.goto(base + '/v/latest/forms/autocomplete/examples', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const preview = page.locator('[id$="-preview"]').first();
  await preview.scrollIntoViewIfNeeded();
  const field = preview.locator('mat-form-field').first();
  const input = field.locator('input').first();
  await input.click();
  await page.locator('.sd-autocomplete-panel mat-option').nth(1).click();
  await page.waitForTimeout(400);
  await page.mouse.click(5, 5);
  await input.click();
  await page.mouse.move(0, 0);
  await clipFieldAndPanel('05-autocomplete-reopen', field, '.sd-autocomplete-panel');
  await page.keyboard.press('Escape');
});

await browser.close();
