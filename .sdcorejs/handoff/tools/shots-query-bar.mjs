// sd-query-bar before/after screenshots for the sd-operator handoff: popover chips and their editor, inline chips and the
// build flow (operator step, value step). Usage: node shots-query-bar.mjs <baseUrl> <outDir> <label>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir, label] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const errors = [];
page.on('console', message => {
  const text = message.text();
  if (message.type() === 'error' && !text.includes('versions.json') && !text.includes('404')) errors.push(text.split('\n')[0]);
});
await page.goto(base + '/v/latest/components/query-bar/examples', { waitUntil: 'networkidle' });
const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));

async function example(slug) {
  const preview = page.locator(`[id="${ids.find(i => i.includes(slug))}"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  await preview.locator('sd-query-bar').first().waitFor({ timeout: 30000 });
  await preview.evaluate(el => {
    const bar = document.querySelector('.topbar');
    window.scrollBy(0, el.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 0) - 16);
  });
  await page.waitForTimeout(600);
  await page.mouse.move(0, 0);
  return preview;
}

async function shotBar(preview, name, extra) {
  const bar = await preview.locator('sd-query-bar').first().boundingBox();
  let x = bar.x - 8;
  let y = bar.y - 8;
  let right = bar.x + bar.width + 8;
  let bottom = bar.y + bar.height + 8;
  if (extra && (await extra.count())) {
    const box = await extra.first().boundingBox();
    x = Math.min(x, box.x - 8);
    y = Math.min(y, box.y - 8);
    right = Math.max(right, box.x + box.width + 8);
    bottom = Math.max(bottom, box.y + box.height + 8);
  }
  await page.screenshot({ path: join(outDir, `qb-${name}-${label}.png`), clip: { x, y, width: Math.min(right - x, 1100), height: bottom - y } });
}

// Popover mode: the chips, then the editor of the first chip (operator in its header).
let preview = await example('che-do-popover');
await shotBar(preview, 'popover');
await preview.locator('.c-chip').first().click();
await page.waitForTimeout(700);
await shotBar(preview, 'popover-editor', page.locator('.cdk-overlay-pane .mat-mdc-menu-panel'));
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

// Inline mode: the chips with showOperatorOnChip, then the build flow.
preview = await example('che-do-inline');
await shotBar(preview, 'inline');
await preview.locator('.c-add-filter').first().click();
await page.waitForTimeout(600);
// Email có nhiều operator (operators: true) nên build flow dừng ở bước chọn operator.
const fieldRow = page.locator('.cdk-overlay-pane .mat-mdc-menu-item:not([disabled])', { hasText: 'Email' }).first();
const fieldName = (await fieldRow.textContent())?.trim();
await fieldRow.click();
await page.waitForTimeout(800);
await shotBar(preview, 'build-operator', page.locator('.cdk-overlay-pane .c-op-menu'));
const firstOp = page.locator('.cdk-overlay-pane .c-op-menu .c-op-row').first();
if (await firstOp.count()) {
  await firstOp.click();
  await page.waitForTimeout(800);
}
await shotBar(preview, 'build-value');

console.log(label, 'ok', `field ${fieldName}`, errors.length ? errors : 'no console errors');
await browser.close();
