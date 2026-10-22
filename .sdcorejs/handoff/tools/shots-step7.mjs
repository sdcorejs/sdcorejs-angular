// Step 7 (sd-form-builder toolbar and page strip) before/after screenshots.
// Usage: node shots-step7.mjs <baseUrl> <outDir> <label>
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
const PREVIEW = 'modules-integrations-generic-example-builder-render-preview';

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    log('FAIL', name, String(e).split('\n')[0]);
  }
}

// Brings an element just under the showcase top bar; previews above render lazily, so repeat until stable.
async function settle(target) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const offset = await target.evaluate(el => {
      const bar = document.querySelector('.topbar');
      const offset = (bar ? bar.getBoundingClientRect().bottom : 0) + 8;
      window.scrollBy(0, el.getBoundingClientRect().top - offset);
      return offset;
    });
    await page.waitForTimeout(600);
    const box = await target.boundingBox();
    if (box && Math.abs(box.y - offset) < 2) return;
  }
}

async function clip(name, target, { height = 200, extraHeight = 0, width = 1100 } = {}) {
  const box = await target.boundingBox();
  await page.screenshot({
    path: shot(name),
    clip: { x: box.x, y: box.y, width: Math.min(box.width, width), height: Math.min(box.height + extraHeight, height, 900 - box.y) },
  });
  log('ok', name);
}

async function openBuilder(multipage) {
  await page.goto(base + '/v/latest/components/generic/examples', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const preview = page.locator(`[id="${PREVIEW}"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  const builder = preview.locator('sd-form-builder').first();
  await builder.waitFor({ timeout: 45000 });
  if (multipage) {
    await preview.locator('sd-button[title="Tabs nhiều trang"] button').first().click();
    await page.waitForTimeout(800);
  }
  await settle(builder);
  await page.mouse.move(0, 0);
  return builder;
}

await step('toolbar', async () => {
  const builder = await openBuilder(false);
  await clip('01-toolbar', builder.locator('.fb-toolbar'), { height: 80 });
});

await step('page strip', async () => {
  const builder = await openBuilder(true);
  await clip('02-page-strip', builder.locator('.fb-pages'), { height: 80 });
});

await step('page actions', async () => {
  const builder = await openBuilder(true);
  const pages = builder.locator('.fb-pages');
  const trigger = builder.locator('[data-page-menu-trigger]');
  // After: open the ⋯ menu and shoot the strip with the menu below it. Before: the five icon buttons.
  if (await trigger.count()) {
    await trigger.first().click();
    await page.waitForTimeout(500);
    await clip('03-page-actions', pages, { height: 320, extraHeight: 240 });
    await page.keyboard.press('Escape');
  } else {
    await clip('03-page-actions', pages, { height: 320, extraHeight: 240 });
  }
});

await step('narrow toolbar', async () => {
  const builder = await openBuilder(false);
  await builder.evaluate(el => (el.style.width = '640px'));
  await page.waitForTimeout(800);
  await clip('04-toolbar-640', builder.locator('.fb-toolbar'), { height: 80, width: 660 });
});

await browser.close();
