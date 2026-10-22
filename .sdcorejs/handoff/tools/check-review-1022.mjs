// Review 2026-10-22 check on the showcase: badge picker Esc key cap, lg suffix gap, rounded field background in the
// table filter row. Usage: node check-review-1022.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });

async function preview(path, fragment, ready) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const locator = page.locator(`[id="${ids.find(i => i.includes(fragment))}"]`);
  await locator.scrollIntoViewIfNeeded();
  const load = locator.locator('.example__load');
  if (await load.count()) await load.first().click();
  await locator.locator(ready).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1000);
  return locator;
}

// 1. Esc key cap in the picker footer.
const picker = await preview('/v/latest/components/badge-picker/examples', 'chon-badge', 'sd-badge-picker');
await picker.locator('[data-badge-picker-trigger]').first().click();
const footer = page.locator('.sd-badge-picker-panel__footer').first();
await footer.waitFor();
await page.waitForTimeout(400);
console.log('esc hint:', JSON.stringify(await footer.locator('.sd-badge-picker-panel__esc').innerText()), 'kbd:', await footer.locator('kbd').count());
await footer.screenshot({ path: join(outDir, 'esc-footer.png') });
await page.keyboard.press('Escape');

// 2. lg arrow gap.
const sizes = await preview('/v/latest/components/badge-picker/examples', 'kich-thuoc', 'sd-badge-picker');
const gaps = await sizes.evaluate(root =>
  Array.from(root.querySelectorAll('.mat-mdc-text-field-wrapper')).map(wrapper => {
    const arrow = wrapper.querySelector('.mat-mdc-form-field-icon-suffix .sd-suffix-icon');
    return Math.round(wrapper.getBoundingClientRect().right - arrow.getBoundingClientRect().right);
  })
);
console.log('picker arrow gap sm / md / lg:', gaps.join(' / '));
const lg = sizes.locator('.mat-mdc-text-field-wrapper').last();
await lg.screenshot({ path: join(outDir, 'picker-lg.png') });

// 3. Field background corner in the grey table filter row: the pixel just inside the corner, outside the 8px arc.
const table = (await preview('/v/latest/components/table/examples', 'full-demo', 'sd-table')).locator('sd-table').first();
const wrapper = table.locator('column-filter').nth(1).locator('.mat-mdc-text-field-wrapper').first();
const info = await wrapper.evaluate(el => ({ radius: getComputedStyle(el).borderBottomRightRadius, cell: getComputedStyle(el.closest('th, td')).backgroundColor }));
console.log('filter field radius:', info.radius, 'cell bg:', info.cell);
const box = await wrapper.boundingBox();
await page.screenshot({ path: join(outDir, 'filter-corner.png'), clip: { x: box.x - 6, y: box.y - 6, width: 70, height: box.height + 12 } });
await browser.close();
