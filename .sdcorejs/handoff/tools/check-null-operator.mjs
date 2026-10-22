// Checks the NULL operator on the showcase: the "Trong control" example and the table demo name filter.
// Usage: node check-null-operator.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', message => {
  if (message.type() === 'error') errors.push(message.text().split('\n')[0]);
});

async function preview(path, fragment, ready) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const id = ids.find(i => i.includes(fragment));
  const locator = page.locator(`[id="${id}"]`);
  await locator.scrollIntoViewIfNeeded();
  const load = locator.locator('.example__load');
  if (await load.count()) await load.first().click();
  await locator.locator(ready).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
  return locator;
}

async function pick(chipButton, label) {
  await chipButton.click();
  await page.locator('.cdk-overlay-pane .c-op-menu .c-op-row', { hasText: label }).first().click();
  await page.waitForTimeout(600);
}

// 1. Control example: "Họ tên" has a value; NULL clears and locks it, CONTAIN unlocks it.
const root = await preview('/v/latest/components/operator/examples', 'trong-control', 'sd-operator-chip');
const name = root.locator('sd-input').first();
const chip = name.locator('sd-operator-chip button').first();
await pick(chip, 'NULL');
const input = name.locator('input').first();
console.log('control NULL:', { value: await input.inputValue(), disabled: await input.isDisabled(), chipEnabled: await chip.isEnabled() });
await name.screenshot({ path: join(outDir, 'null-control.png') });
await pick(chip, 'CONTAIN');
console.log('control CONTAIN:', { disabled: await input.isDisabled(), focused: await input.evaluate(el => el === document.activeElement) });

// 2. Table demo: NULL on the name column filters at once (every employee has a name, so no rows).
const table = (await preview('/v/latest/components/table/examples', 'full-demo', 'sd-table')).locator('sd-table').first();
const rowsBefore = await table.locator('tbody tr.c-row').count();
const filter = table.locator('column-filter').first();
await pick(filter.locator('sd-operator-chip button').first(), 'NOT_NULL');
await page.waitForTimeout(1200);
const rowsNotNull = await table.locator('tbody tr.c-row').count();
await pick(filter.locator('sd-operator-chip button').first(), 'NULL');
await page.waitForTimeout(1200);
const rowsNull = await table.locator('tbody tr.c-row').count();
await table.locator('thead').first().screenshot({ path: join(outDir, 'null-table.png') });
console.log('table rows:', { before: rowsBefore, notNull: rowsNotNull, null: rowsNull, filterInputDisabled: await filter.locator('input').first().isDisabled() });
console.log('console errors:', errors.length ? errors : 'none');
await browser.close();
