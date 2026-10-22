// sd-operator before/after screenshots: each example of the operator page, closed and with its first menu open.
// Usage: node shots-operator.mjs <baseUrl> <outDir> <label> [slug,slug,...]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir, label, slugList] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', message => {
  const text = message.text();
  if (message.type() === 'error' && !text.includes('versions.json') && !text.includes('404')) errors.push(text.split('\n')[0]);
});

await page.goto(base + '/v/latest/components/operator/examples', { waitUntil: 'networkidle' });
const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
const slugs = slugList ? slugList.split(',') : ids.map(id => id.replace(/^components-operator-example-|-preview$/g, ''));

for (const slug of slugs) {
  const id = ids.find(i => i.includes(slug));
  if (!id) {
    console.log('no example', slug);
    continue;
  }
  const preview = page.locator(`[id="${id}"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  await page.waitForTimeout(800);
  await preview.evaluate(el => {
    const bar = document.querySelector('.topbar');
    window.scrollBy(0, el.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 0) - 16);
  });
  await page.waitForTimeout(400);
  await page.mouse.move(0, 0);
  const box = await preview.boundingBox();
  await page.screenshot({ path: join(outDir, `${slug}-${label}.png`), clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 600) } });

  const trigger = preview.locator('button.c-op-trigger:not([disabled]), button.sd-operator-chip__trigger:not([disabled]), .sd-operator__glyph:not([disabled])').first();
  if (!(await trigger.count())) continue;
  await trigger.click();
  await page.waitForTimeout(700);
  const panel = page.locator('.cdk-overlay-pane .c-op-menu').first();
  if (!(await panel.count())) continue;
  const t = await trigger.boundingBox();
  const p = await panel.boundingBox();
  const x = Math.min(t.x, p.x) - 16;
  const y = Math.min(t.y, p.y) - 16;
  await page.screenshot({
    path: join(outDir, `${slug}-menu-${label}.png`),
    clip: { x, y, width: Math.max(t.x + t.width, p.x + p.width) - x + 16, height: Math.max(t.y + t.height, p.y + p.height) - y + 16 },
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
}

console.log(label, 'ok', errors.length ? errors : 'no console errors');
await browser.close();
