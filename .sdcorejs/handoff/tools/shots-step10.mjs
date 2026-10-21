// Step 10 (operator inside the controls) screenshots. Usage: node shots-step10.mjs <baseUrl> <outDir> <label>
// Before/after pair: the inline column filter of the table "Full demo (local)" (name and salary columns have
// operators) and the open sd-operator menu. With label "after" it also shoots the new "Trong control"
// operator example (light, dark, sm, the chip menu open, a column-filter chip menu) into <outDir>/after-only.
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

async function preview(fragment, ready) {
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const id = ids.find(i => i.includes(fragment));
  if (!id) throw new Error(`no preview matching ${fragment}`);
  const locator = page.locator(`[id="${id}"]`);
  await locator.scrollIntoViewIfNeeded();
  const load = locator.locator('.example__load');
  if (await load.count()) await load.first().click();
  await locator.locator(ready).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1000);
  return locator;
}

// Lazy previews above push the target down while the page scrolls, so repeat until its top stays put just
// under the sticky top bar.
async function settle(target) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const offset = await target.evaluate(el => {
      el.querySelectorAll('*').forEach(node => {
        if (node.scrollLeft) node.scrollLeft = 0;
      });
      const bar = document.querySelector('.topbar');
      const top = (bar ? bar.getBoundingClientRect().bottom : 0) + 8;
      window.scrollBy(0, el.getBoundingClientRect().top - top);
      return top;
    });
    await page.waitForTimeout(600);
    const box = await target.boundingBox();
    if (box && Math.abs(box.y - offset) < 2) return;
  }
}

async function clip(path, box, pad = 8) {
  await page.screenshot({
    path,
    clip: { x: Math.max(box.x - pad, 0), y: Math.max(box.y - pad, 0), width: Math.min(box.width + pad * 2, 1200), height: Math.min(box.height + pad * 2, 880) },
  });
}

// Union of the target box and the open menu panel (overlay), so the shot shows both.
async function withMenu(target) {
  const a = await target.boundingBox();
  const panel = page.locator('.cdk-overlay-pane .c-op-menu').first();
  await panel.waitFor({ timeout: 5000 });
  await page.waitForTimeout(400);
  const b = await panel.boundingBox();
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
}

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    log('FAIL', name, String(e).split('\n')[0]);
  }
}

async function open(path, mode) {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.evaluate(m => document.documentElement.setAttribute('data-sd-theme', m), mode);
  await page.waitForTimeout(600);
}

// ---- Pair 1: inline column filter of the table.
await open('/v/latest/components/table/examples', 'light');
await step('table filter', async () => {
  const root = await preview('full-demo', 'sd-table');
  const table = root.locator('sd-table').first();
  await settle(table);
  // A value in the name filter shows the "has value" tone of the chip; Enter would scroll the table, so reset it.
  const name = table.locator('column-filter').first();
  await name.locator('input').first().fill('Nguyễn');
  await name.locator('input').first().evaluate(el => el.blur());
  await page.mouse.move(0, 0);
  await page.waitForTimeout(800);
  await settle(table);
  const head = await table.locator('thead').first().boundingBox();
  const frame = await table.boundingBox();
  await clip(shot('table-filter'), { x: frame.x, y: head.y, width: frame.width, height: head.height }, 4);
  log('ok table-filter');
  // The name column operator menu: the chip after, the separate sd-operator before.
  const trigger = name.locator('sd-operator-chip button, sd-operator button').first();
  await trigger.click();
  await clip(shot('table-filter-menu'), await withMenu(name), 8);
  await page.keyboard.press('Escape');
  log('ok table-filter-menu');
});

// ---- Pair 2: the sd-operator menu (tick and white surface).
await open('/v/latest/components/operator/examples', 'light');
await step('operator menu', async () => {
  const root = await preview('toan-tu-chuoi', 'sd-operator');
  await settle(root);
  await root.locator('sd-operator button').first().click();
  await clip(shot('operator-menu'), await withMenu(root.locator('sd-operator').first()), 8);
  await page.keyboard.press('Escape');
  log('ok operator-menu');
});

if (label === 'after') {
  const only = join(outDir, 'after-only');
  mkdirSync(only, { recursive: true });
  for (const mode of ['light', 'dark']) {
    await open('/v/latest/components/operator/examples', mode);
    await step(`controls ${mode}`, async () => {
      const root = await preview('trong-control', 'sd-operator-chip');
      const grid = root.locator('.control-grid').first();
      await settle(grid);
      await page.mouse.move(0, 0);
      await page.waitForTimeout(500);
      await clip(join(only, `controls-${mode}.png`), await grid.boundingBox(), 12);
      log('ok controls', mode);
      if (mode === 'light') {
        const number = grid.locator('sd-input-number').first();
        await number.locator('sd-operator-chip button').first().click();
        await clip(join(only, 'controls-menu.png'), await withMenu(number), 8);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        // Keyboard focus ring on the chip (Escape gives focus back to it).
        await clip(join(only, 'controls-focus.png'), await number.boundingBox(), 12);
        log('ok controls menu / focus');
      }
    });
  }
}

await browser.close();
