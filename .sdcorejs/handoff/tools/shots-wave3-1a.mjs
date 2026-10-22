// Wave 3 · 1a (sd-badge) screenshots. Usage: node shots-wave3-1a.mjs <baseUrl> <outDir> <label>
// Shoots every badge example in light, dark (data-sd-theme), graphite (showcase preset class) and forced colours,
// the narrow touch layout, the tooltip of a cut title, the focus ring, and the first table with badge cells.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir, label, only] = process.argv.slice(2);
const skipPreviews = only === 'extras';
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const shot = name => join(outDir, `${name}-${label}.png`);
const log = (...a) => console.log(label, ...a);

async function open(context, path) {
  const page = await context.newPage();
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  return page;
}

async function shootPreviews(page, mode) {
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  for (const id of ids) {
    if (id.includes('fontset')) continue;
    try {
      const preview = page.locator(`[id="${id}"]`);
      await preview.scrollIntoViewIfNeeded();
      await preview.locator('demo-section').first().waitFor({ timeout: 15000 });
      if (mode === 'graphite') await preview.evaluate(el => el.classList.add('layout-demo__preview--graphite'));
      await page.waitForTimeout(150);
      const name = `${mode}-${id.replace('components-badge-example-', '').replace('-preview', '')}`;
      await preview.screenshot({ path: shot(name) });
      log('ok', name);
    } catch (e) {
      log('FAIL', mode, id, String(e).split('\n')[0]);
    }
  }
}

const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
if (!only) for (const mode of ['light', 'dark', 'graphite']) {
  const page = await open(desktop, '/v/latest/components/badge/examples');
  if (mode === 'dark') await page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'));
  await shootPreviews(page, mode);
  await page.close();
}

if (!only) {
const forced = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, forcedColors: 'active' });
{
  const page = await open(forced, '/v/latest/components/badge/examples');
  await shootPreviews(page, 'forced');
  await page.close();
}

const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
{
  const page = await open(phone, '/v/latest/components/badge/examples');
  await shootPreviews(page, 'phone');
  await page.close();
}

}

// Tooltip of a cut title, and the focus ring of a clickable badge.
if (!only || skipPreviews) {
  const page = await open(desktop, '/v/latest/components/badge/examples');
  try {
    const longPreview = page.locator('[id$="ten-dai-trong-o-hep-preview"]');
    await longPreview.scrollIntoViewIfNeeded();
    const long = longPreview.locator('sd-badge').first();
    await long.waitFor({ timeout: 15000 });
    await long.hover();
    await page.waitForTimeout(500);
    const box = await long.boundingBox();
    await page.screenshot({ path: shot('zz-tooltip-cut-title'), clip: { x: box.x - 40, y: box.y - 70, width: 360, height: box.height + 90 } });
    log('ok tooltip');
  } catch (e) {
    log('FAIL tooltip', String(e).split('\n')[0]);
  }
  try {
    const clickPreview = page.locator('[id$="bam-duoc-preview"]');
    await clickPreview.scrollIntoViewIfNeeded();
    const clickable = clickPreview.locator('sd-badge').first();
    await clickable.waitFor({ timeout: 15000 });
    await page.mouse.move(0, 0);
    await clickable.locator('[role="button"]').focus();
    await page.keyboard.press('Shift');
    await page.waitForTimeout(300);
    const box = await clickable.boundingBox();
    await page.screenshot({ path: shot('zz-focus-ring'), clip: { x: box.x - 16, y: box.y - 16, width: 420, height: box.height + 32 } });
    log('ok focus');
  } catch (e) {
    log('FAIL focus', String(e).split('\n')[0]);
  }
  await page.close();
}

// Badge cells of the table example.
{
  const page = await open(desktop, '/v/latest/components/table/examples');
  try {
    // The examples render when scrolled into view; the employee table of "Full demo (local)" has badge cells.
    const preview = page.locator('[id$="full-demo-local-preview"]');
    await preview.scrollIntoViewIfNeeded();
    const cell = preview.locator('sd-table sd-badge').first();
    await cell.waitFor({ timeout: 15000 });
    await cell.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    // Clip around the badge column: union of the badges in view, plus the column on its left for context.
    const boxes = await preview.locator('sd-table sd-badge').evaluateAll(els => els.map(e => e.getBoundingClientRect().toJSON()));
    const top = Math.min(...boxes.map(b => b.top));
    const bottom = Math.max(...boxes.map(b => b.bottom));
    const left = Math.min(...boxes.map(b => b.left));
    await page.screenshot({ path: shot('zz-table-badges'), clip: { x: Math.max(0, left - 260), y: top - 70, width: 640, height: bottom - top + 100 } });
    log('ok table');
  } catch (e) {
    log('FAIL table', String(e).split('\n')[0]);
  }
  await page.close();
}

await browser.close();
