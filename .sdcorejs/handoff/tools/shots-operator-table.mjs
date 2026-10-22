// sd-operator in a table column filter: the filter row and the first operator menu of one table example.
// Usage: node shots-operator-table.mjs <baseUrl> <outDir> <label> [slug=full-demo-local] [nth=0]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir, label, slug = 'full-demo-local', nth = '0'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', message => {
  const text = message.text();
  if (message.type() === 'error' && !text.includes('versions.json') && !text.includes('404')) errors.push(text.split('\n')[0]);
});

await page.goto(base + '/v/latest/components/table/examples', { waitUntil: 'networkidle' });
const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
const preview = page.locator(`[id="${ids.find(i => i.includes(slug))}"]`);
// why: các preview phía trên dựng chậm và đẩy preview này xuống; cuộn lại tới khi vị trí đứng yên.
for (let i = 0; i < 6; i++) {
  await preview.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
}
const load = preview.locator('.example__load');
if (await load.count()) await load.first().click();
const trigger = preview.locator('button.sd-operator-chip__trigger:not([disabled])').nth(Number(nth));
await trigger.waitFor({ timeout: 30000 });
await trigger.evaluate(el => {
  const bar = document.querySelector('.topbar');
  window.scrollBy(0, el.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 0) - 120);
});
await page.waitForTimeout(500);
await page.mouse.move(0, 0);
const row = await trigger.evaluate(el => {
  const r = (el.closest('tr') ?? el.parentElement).getBoundingClientRect();
  return { x: r.x, y: r.y, width: r.width, height: r.height };
});
await page.screenshot({ path: join(outDir, `table-${slug}-${nth}-${label}.png`), clip: { x: row.x, y: row.y - 8, width: Math.min(row.width, 1200), height: row.height + 16 } });
await trigger.click();
await page.waitForTimeout(700);
const panel = page.locator('.cdk-overlay-pane .c-op-menu').first();
const t = await trigger.boundingBox();
const p = await panel.boundingBox();
const x = Math.min(t.x, p.x) - 16;
const y = Math.min(t.y, p.y) - 16;
await page.screenshot({
  path: join(outDir, `table-${slug}-${nth}-menu-${label}.png`),
  clip: { x, y, width: Math.max(t.x + t.width, p.x + p.width) - x + 16, height: Math.max(t.y + t.height, p.y + p.height) - y + 16 },
});
console.log(label, 'ok', errors.length ? errors : 'no console errors');
await browser.close();
