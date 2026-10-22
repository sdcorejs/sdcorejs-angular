// Wave 3 · 1b (sd-badge solid / dot / pair, label, pulse) screenshots. The types are new, so there is no "before".
// Usage: node shots-wave3-1b.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const SECTIONS = ['sau-dang', 'solid', 'dot-va-pulse', 'pair'];
const browser = await chromium.launch();
const log = (...a) => console.log(...a);

async function open(context) {
  const page = await context.newPage();
  await page.goto(base + '/v/latest/components/badge/examples', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  return page;
}

async function preview(page, section) {
  const el = page.locator(`[id="components-badge-example-${section}-preview"]`);
  await el.scrollIntoViewIfNeeded();
  await el.locator('demo-section').first().waitFor({ timeout: 15000 });
  return el;
}

async function shootSections(context, mode, prepare) {
  const page = await open(context);
  if (prepare) await prepare(page);
  for (const section of SECTIONS) {
    try {
      const el = await preview(page, section);
      if (mode === 'graphite') await el.evaluate(node => node.classList.add('layout-demo__preview--graphite'));
      await page.waitForTimeout(200);
      await el.screenshot({ path: join(outDir, `${mode}-${section}.png`) });
      log('ok', mode, section);
    } catch (e) {
      log('FAIL', mode, section, String(e).split('\n')[0]);
    }
  }
  await page.close();
}

const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
await shootSections(desktop, 'light');
await shootSections(desktop, 'dark', page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark')));
await shootSections(desktop, 'graphite');
const forced = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, forcedColors: 'active' });
await shootSections(forced, 'forced');
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await shootSections(phone, 'phone');

// Pulse: two frames half a period apart, plus the still ring under reduced motion.
{
  const page = await open(desktop);
  const el = await preview(page, 'dot-va-pulse');
  const row = el.locator('sd-badge[pulse]').first().locator('xpath=..');
  for (const [name, wait] of [
    ['zz-pulse-frame-a', 0],
    ['zz-pulse-frame-b', 800],
  ]) {
    await page.waitForTimeout(wait);
    await row.screenshot({ path: join(outDir, `${name}.png`) });
  }
  await page.close();
  const still = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  const stillPage = await open(still);
  const stillEl = await preview(stillPage, 'dot-va-pulse');
  await stillEl.locator('sd-badge[pulse]').first().locator('xpath=..').screenshot({ path: join(outDir, 'zz-pulse-reduced-motion.png') });
  log('ok pulse');
}

// Dot tooltip, and the cut value of a pair with its tooltip.
{
  const page = await open(desktop);
  try {
    const dot = (await preview(page, 'dot-va-pulse')).locator('sd-badge').first();
    await dot.hover();
    await page.waitForTimeout(500);
    const box = await dot.boundingBox();
    await page.screenshot({ path: join(outDir, 'zz-dot-tooltip.png'), clip: { x: box.x - 60, y: box.y - 50, width: 200, height: 80 } });
    const cut = (await preview(page, 'pair')).locator('.badge-demo-cell sd-badge');
    await cut.hover();
    await page.waitForTimeout(500);
    const cbox = await cut.boundingBox();
    await page.screenshot({ path: join(outDir, 'zz-pair-cut-tooltip.png'), clip: { x: cbox.x - 40, y: cbox.y - 60, width: 380, height: cbox.height + 80 } });
    log('ok tooltips');
  } catch (e) {
    log('FAIL tooltips', String(e).split('\n')[0]);
  }
  await page.close();
}

await browser.close();
