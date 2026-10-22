// sd-chip-calendar before/after screenshots: the field and the open popup of the first examples.
// Usage: node shots-chip-calendar.mjs <baseUrl> <outDir> <label> [fragment=lien-ket-hai-chieu]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir, label, fragment = 'lien-ket-hai-chieu'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', message => {
  const text = message.text();
  if (message.type() === 'error' && !text.includes('versions.json') && !text.includes('404')) errors.push(text.split('\n')[0]);
});

await page.goto(base + '/v/latest/forms/chip-calendar/examples', { waitUntil: 'networkidle' });
const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
const preview = page.locator(`[id="${ids.find(i => i.includes(fragment))}"]`);
await preview.scrollIntoViewIfNeeded();
const load = preview.locator('.example__load');
if (await load.count()) await load.first().click();
const host = preview.locator('sd-chip-calendar').first();
await host.waitFor({ timeout: 30000 });
await host.evaluate(el => {
  const bar = document.querySelector('.topbar');
  window.scrollBy(0, el.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 0) - 24);
});
await page.waitForTimeout(800);
await page.mouse.move(0, 0);
const field = host.locator('.mat-mdc-text-field-wrapper').first();
const box = await field.boundingBox();
await page.screenshot({ path: join(outDir, `field-${label}.png`), clip: { x: box.x - 12, y: box.y - 20, width: box.width + 24, height: box.height + 32 } });

await host.locator('input').first().click();
await page.waitForTimeout(800);
const panel = page.locator('.cdk-overlay-pane .sd-chip-calendar-panel, .cdk-overlay-pane .mat-mdc-menu-panel').first();
await panel.waitFor({ timeout: 5000 });
const pbox = await panel.boundingBox();
const fbox = await field.boundingBox();
const x = Math.min(pbox.x, fbox.x) - 12;
const y = Math.min(pbox.y, fbox.y) - 20;
await page.screenshot({
  path: join(outDir, `popup-${label}.png`),
  clip: { x, y, width: Math.max(pbox.x + pbox.width, fbox.x + fbox.width) - x + 12, height: Math.max(pbox.y + pbox.height, fbox.y + fbox.height) - y + 12 },
});
console.log(label, 'ok', errors.length ? errors : 'no console errors');
await browser.close();
