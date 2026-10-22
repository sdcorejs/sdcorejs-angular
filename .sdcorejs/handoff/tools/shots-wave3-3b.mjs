// Wave 3 · 3b (many tabs) screenshots of the live route /demo/tab-router. Usage: node shots-wave3-3b.mjs <baseUrl> <outDir>
// Sixteen tabs scrolled to the open (last) tab, the bar scrolled to the middle (both fades), and the tab list open with a
// hovered row, in light, dark, graphite, forced colours and a 390px touch viewport.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();

async function shoot(page, name, height = 140) {
  const box = await page.locator('sd-tab-router-outlet').boundingBox();
  await page.screenshot({ path: join(outDir, `${name}.png`), clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height } });
  console.log('ok', name);
}

async function run(mode, options, prepare) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(base + '/demo/tab-router/overview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (prepare) await prepare(page);
  await page.locator('[data-tab-live="sixteen"] button').click();
  await page.waitForTimeout(1500);
  await page.mouse.move(0, 0);
  if (mode === 'light') {
    await shoot(page, `${mode}-1-sixteen-tabs-open-tab-in-view`);
    await page.locator('.tab-router__scroller').evaluate(el => {
      el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    });
    await page.waitForTimeout(300);
    await shoot(page, `${mode}-2-scrolled-to-the-middle-both-fades`);
  }
  await page.locator('.tab-router__list-button').click();
  await page.waitForTimeout(400);
  if (!options.hasTouch) await page.locator('.tab-router__menu-row').nth(6).hover();
  await page.waitForTimeout(300);
  await shoot(page, `${mode}-3-tab-list-open`, 420);
  await context.close();
}

const desktop = { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' };
await run('light', desktop);
await run('dark', desktop, page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark')));
await run('graphite', desktop, page => page.evaluate(() => document.querySelector('.tab-live')?.classList.add('layout-demo__preview--graphite')));
await run('forced', { ...desktop, forcedColors: 'active' });
await run('phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
await browser.close();
