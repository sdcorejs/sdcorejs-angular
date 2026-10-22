// Review 2026-10-22 check of the operator menu on the showcase: no tick, 6px from the field box and lined up with the
// field start (chip), 6px from the trigger (standalone sd-operator), arrow shown in the narrow salary filter.
// Usage: node check-operator-menu.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

async function preview(path, fragment, ready) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const locator = page.locator(`[id="${ids.find(i => i.includes(fragment))}"]`);
  await locator.scrollIntoViewIfNeeded();
  const load = locator.locator('.example__load');
  if (await load.count()) await load.first().click();
  await locator.locator(ready).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
  return locator;
}

async function measure(anchor, trigger, shot) {
  await trigger.click();
  const panel = page.locator('.cdk-overlay-pane .c-op-menu').first();
  await panel.waitFor();
  await page.waitForTimeout(400);
  const a = await anchor.boundingBox();
  const p = await panel.boundingBox();
  const above = await panel.evaluate(el => el.classList.contains('mat-menu-above'));
  const result = {
    gap: Math.round((above ? a.y - (p.y + p.height) : p.y - (a.y + a.height)) * 10) / 10,
    leftDelta: Math.round((p.x - a.x) * 10) / 10,
    ticks: await page.locator('.cdk-overlay-pane .c-op-check').count(),
  };
  const x = Math.min(a.x, p.x) - 8;
  const y = Math.min(a.y, p.y) - 8;
  await page.screenshot({ path: join(outDir, shot), clip: { x, y, width: Math.max(a.x + a.width, p.x + p.width) - x + 8, height: Math.max(a.y + a.height, p.y + p.height) - y + 8 } });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  return result;
}

const controls = await preview('/v/latest/components/operator/examples', 'trong-control', 'sd-operator-chip');
const field = controls.locator('sd-input-number .mat-mdc-text-field-wrapper').first();
console.log('chip menu (field box):', await measure(field, controls.locator('sd-input-number sd-operator-chip button').first(), 'chip-menu.png'));

const standalone = await preview('/v/latest/components/operator/examples', 'toan-tu-so', 'sd-operator');
const trigger = standalone.locator('sd-operator button').first();
console.log('sd-operator menu (trigger):', await measure(trigger, trigger, 'standalone-menu.png'));

const table = (await preview('/v/latest/components/table/examples', 'full-demo', 'sd-table')).locator('sd-table').first();
const salary = table.locator('column-filter').filter({ has: page.locator('sd-input-number') }).first();
await salary.scrollIntoViewIfNeeded();
const arrow = salary.locator('.sd-operator-chip__arrow').first();
console.log('salary filter:', {
  fieldWidth: Math.round((await salary.locator('.mat-mdc-text-field-wrapper').first().boundingBox()).width),
  arrowVisible: await arrow.isVisible(),
});
await salary.screenshot({ path: join(outDir, 'salary-filter.png') });
await browser.close();
