// Step 4 (sd-segmented) before/after screenshots. Usage: node shots4.mjs <baseUrl> <outDir> <label>
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

await page.goto(base + '/v/latest/forms/segmented/examples', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
log('segmented previews', ids.join(' '));

let index = 0;
for (const id of ids.slice(0, 7)) {
  index++;
  try {
    const preview = page.locator(`[id="${id}"]`);
    await preview.scrollIntoViewIfNeeded();
    await preview.locator('demo-section').first().waitFor({ timeout: 15000 });
    await page.waitForTimeout(300);
    const name = `${String(index).padStart(2, '0')}-${id.replace('forms-segmented-example-', '').replace('-preview', '')}`;
    await preview.screenshot({ path: shot(name) });
    log('ok', name);
  } catch (e) {
    log('FAIL', id, String(e).split('\n')[0]);
  }
}

// Keyboard focus ring on the first example: Tab into the group, then ArrowRight.
try {
  const preview = page.locator(`[id="${ids[0]}"]`);
  await preview.scrollIntoViewIfNeeded();
  const first = preview.locator('.sd-segmented__item').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  const track = preview.locator('.sd-segmented').first();
  const box = await track.boundingBox();
  await page.screenshot({ path: shot('99-focus-ring'), clip: { x: box.x - 12, y: box.y - 12, width: Math.min(box.width + 24, 700), height: box.height + 24 } });
  log('ok focus-ring');
} catch (e) {
  log('FAIL focus-ring', String(e).split('\n')[0]);
}

await browser.close();
