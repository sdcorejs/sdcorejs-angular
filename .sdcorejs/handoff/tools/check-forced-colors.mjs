// Forced-colors check of the two final-sweep bugs: option gap lines in the select / autocomplete panels and the
// sd-button indicator dot. Usage: node check-forced-colors.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
await page.emulateMedia({ forcedColors: 'active' });

async function preview(path, fragment, ready) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const id = ids.find(i => i.includes(fragment)) ?? ids[0];
  const locator = page.locator(`[id="${id}"]`);
  await locator.scrollIntoViewIfNeeded();
  const load = locator.locator('.example__load');
  if (await load.count()) await load.first().click();
  await locator.locator(ready).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(800);
  return locator;
}

const optionBorders = () =>
  page.$$eval('.cdk-overlay-pane mat-option, .cdk-overlay-pane .sd-select-all-row', els =>
    [...new Set(els.slice(0, 6).map(el => `${getComputedStyle(el).borderTopColor} / ${getComputedStyle(el).height}`))]
  );

// Select (single) and select multiple with "select all".
for (const [fragment, name] of [
  ['', 'select'],
  ['nhieu', 'select-multiple'],
]) {
  const root = await preview('/v/latest/forms/select/examples', fragment, 'sd-select');
  await root.locator('sd-select .mat-mdc-select-trigger').first().click();
  await page.locator('.cdk-overlay-pane mat-option').first().waitFor();
  await page.waitForTimeout(500);
  console.log(name, 'option border / height:', await optionBorders());
  await page.locator('.cdk-overlay-pane .mat-mdc-select-panel').first().screenshot({ path: join(outDir, `${name}.png`) });
  await page.keyboard.press('Escape');
}

// Autocomplete.
const auto = await preview('/v/latest/forms/autocomplete/examples', '', 'sd-autocomplete');
await auto.locator('sd-autocomplete input').first().click();
await page.locator('.cdk-overlay-pane mat-option').first().waitFor({ timeout: 10000 }).catch(() => {});
await page.waitForTimeout(500);
console.log('autocomplete option border / height:', await optionBorders());
const autoPanel = page.locator('.cdk-overlay-pane .mat-mdc-autocomplete-panel').first();
if (await autoPanel.count()) await autoPanel.screenshot({ path: join(outDir, 'autocomplete.png') });
await page.keyboard.press('Escape');

// Button indicator.
const indicatorRoot = await preview('/v/latest/components/button/examples', 'indicator', 'app-button-indicator-example');
const example = indicatorRoot.locator('app-button-indicator-example').first();
const dots = await example.locator('.sd-button__indicator').evaluateAll(els =>
  els.map(el => {
    const style = getComputedStyle(el);
    return `${el.className.includes('dot') ? 'dot' : 'count'}: bg ${style.backgroundColor}, adjust ${style.forcedColorAdjust}`;
  })
);
console.log('indicators:', dots);
await example.screenshot({ path: join(outDir, 'button-indicator.png') });
await browser.close();
