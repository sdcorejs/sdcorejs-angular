// Step 5 (ɵ search field) before/after screenshots. Usage: node shots-step5.mjs <baseUrl> <outDir> <label>
// The four search boxes keep their consumer class in both builds (.sd-kanban__search, .sd-quick-search-field,
// .fb-search, .filter-input-wrapper), so the same selectors find them before and after.
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

// Previews render lazily, and heavy ones wait behind a "Load live preview" button.
async function openPreview(path, id) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const previewId = id ?? (await page.locator('[id$="-preview"]').first().getAttribute('id'));
  const preview = page.locator(`[id="${previewId}"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  await page.waitForTimeout(2500);
  return preview;
}

async function findIn(path, id, selector) {
  const preview = await openPreview(path, id);
  const target = preview.locator(selector).first();
  await target.waitFor({ timeout: 45000 });
  await target.scrollIntoViewIfNeeded();
  return target;
}

async function clip(name, target, pad = 12, maxWidth = 620) {
  const box = await target.boundingBox();
  await page.screenshot({
    path: shot(name),
    clip: { x: box.x - pad, y: box.y - pad, width: Math.min(box.width + pad * 2, maxWidth), height: box.height + pad * 2 },
  });
  log('ok', name);
}

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    log('FAIL', name, String(e).split('\n')[0]);
  }
}

await step('kanban', async () => {
  const field = await findIn('/v/latest/components/kanban/examples', undefined, '.sd-kanban__search');
  await clip('01-kanban-rest', field);
  await field.locator('input').focus();
  await page.waitForTimeout(200);
  await clip('02-kanban-focus', field);
  await field.locator('input').blur();
});

await step('table quick search', async () => {
  const field = await findIn('/v/latest/components/table/examples', 'components-table-example-quick-search-preview', '.sd-quick-search-field');
  await clip('03-quick-search-rest', field.locator('xpath=ancestor::sd-table-quick-search'), 0, 1100);
  await field.locator('input').fill('alice');
  await page.waitForTimeout(200);
  await clip('04-quick-search-typed', field);
  await field.locator('input').fill('');
  await field.locator('input').blur();
});

await step('form builder palette', async () => {
  // The showcase column keeps the builder under 900px, so the palette is a closed overlay panel: open it.
  const preview = await openPreview('/v/latest/components/generic/examples', 'modules-integrations-generic-example-builder-render-preview');
  const toggle = preview.locator('.fb-panel-toggle[aria-controls$="-left"]').first();
  if (await toggle.isVisible()) await toggle.click();
  const field = preview.locator('.fb-search').first();
  await field.waitFor({ timeout: 15000 });
  // Opening the panel moves focus into it; blur for the resting shot.
  await page.evaluate(() => document.activeElement?.blur());
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await clip('05-palette-rest', field);
  await field.locator('input').focus();
  await page.waitForTimeout(200);
  await clip('06-palette-focus', field);
  await field.locator('input').blur();
});

// The virtual-scroll example has more than 10 items, so its panel shows the filter input.
await step('select panel filter', async () => {
  const preview = await openPreview('/v/latest/forms/select/examples', 'forms-select-example-cuon-ao-preview');
  const trigger = preview.locator('.mat-mdc-select-trigger').first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  const container = page.locator('.sd-select-panel .c-filter-input-container').first();
  await container.waitFor({ timeout: 15000 });
  await page.waitForTimeout(400);
  await clip('07-select-filter-rest', container, 4);
  await container.locator('input').fill('a');
  await page.waitForTimeout(300);
  await clip('08-select-filter-typed', container, 4);
  await page.keyboard.press('Escape');
});

await browser.close();
