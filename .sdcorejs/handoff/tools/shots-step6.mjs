// Step 6 (sd-table tokens) before/after screenshots. Usage: node shots-step6.mjs <baseUrl> <outDir> <label>
// Shoots the "Full demo (local)" table with a sorted column, two selected rows and a hovered row, the
// "Nhóm dòng" group rows and the row reorder handles, in light and in dark (data-sd-theme on <html>).
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
const PATH = '/v/latest/components/table/examples';

async function preview(fragment) {
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const id = ids.find(i => i.includes(fragment));
  if (!id) throw new Error(`no preview matching ${fragment}`);
  const locator = page.locator(`[id="${id}"]`);
  await locator.scrollIntoViewIfNeeded();
  const load = locator.locator('.example__load');
  if (await load.count()) await load.first().click();
  await locator.locator('sd-table').first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1200);
  return locator;
}

// Clip coordinates are viewport-relative: bring the top of the table to the top of the viewport first.
// Brings the table top just below the showcase's sticky top bar and resets every horizontal scroll inside
// it, so both builds are shot at the same position.
async function settle(target) {
  // Previews above render lazily while the page scrolls past them and push the table down, so repeat
  // until its top stays just under the top bar.
  for (let attempt = 0; attempt < 8; attempt++) {
    const top = await target.evaluate(el => {
      el.querySelectorAll('*').forEach(node => {
        if (node.scrollLeft) node.scrollLeft = 0;
      });
      const bar = document.querySelector('.topbar');
      const offset = (bar ? bar.getBoundingClientRect().bottom : 0) + 8;
      window.scrollBy(0, el.getBoundingClientRect().top - offset);
      return { now: el.getBoundingClientRect().top, offset };
    });
    await page.waitForTimeout(700);
    const box = await target.boundingBox();
    if (box && Math.abs(box.y - top.offset) < 2) return;
  }
}

async function clipTop(name, target, height = 420) {
  const box = await target.boundingBox();
  const y = Math.max(box.y, 0);
  await page.screenshot({ path: shot(name), clip: { x: box.x, y, width: Math.min(box.width, 1100), height: Math.min(box.height, height, 900 - y) } });
  log('ok', name);
}

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    log('FAIL', name, String(e).split('\n')[0]);
  }
}

for (const mode of ['light', 'dark']) {
  await page.goto(base + PATH, { waitUntil: 'networkidle' });
  await page.evaluate(m => document.documentElement.setAttribute('data-sd-theme', m), mode);
  await page.waitForTimeout(600);

  await step(`${mode} full demo`, async () => {
    const root = await preview('full-demo');
    const table = root.locator('sd-table').first();
    const sort = table.locator('th[aria-sort] .sd-table-sort-header').nth(1);
    if (await sort.count()) await sort.click();
    const boxes = table.locator('tbody tr.c-row .sd-selection-cell input[type="checkbox"]');
    for (let i = 0; i < Math.min(2, await boxes.count()); i++) await boxes.nth(i).click({ force: true }).catch(() => {});
    const rows = table.locator('tbody tr.c-row');
    // Settle first, so the hovered row is still under the pointer when clipTop shoots.
    await settle(table);
    if ((await rows.count()) > 3) await rows.nth(3).hover();
    await page.waitForTimeout(400);
    await clipTop(`${mode === 'light' ? '01' : '04'}-${mode}-full-demo`, table, 460);
  });

  await step(`${mode} group rows`, async () => {
    const root = await preview('nhom-dong');
    await settle(root.locator('sd-table').first());
    await page.mouse.move(0, 0);
    await clipTop(`${mode === 'light' ? '02' : '05'}-${mode}-group-rows`, root.locator('sd-table').first(), 360);
  });

  await step(`${mode} reorder`, async () => {
    const root = await preview('keo-tha');
    await settle(root.locator('sd-table').first());
    await page.mouse.move(0, 0);
    await clipTop(`${mode === 'light' ? '03' : '06'}-${mode}-reorder`, root.locator('sd-table').first(), 300);
  });
}

await browser.close();
