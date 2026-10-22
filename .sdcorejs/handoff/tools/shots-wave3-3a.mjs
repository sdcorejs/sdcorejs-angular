// Wave 3 · 3a (tab bar) screenshots of the live route /demo/tab-router. Usage: node shots-wave3-3a.mjs <baseUrl> <outDir>
// Shoots the top 140px of the outlet: one tab (bar hidden), five tabs with the second open and the third hovered,
// sixteen tabs, the tooltip of a cut name, in light, dark, graphite, forced colours and a 390px touch viewport.
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
  await shoot(page, `${mode}-1-one-tab`);
  await page.locator('[data-tab-live="five"] button').click();
  await page.waitForTimeout(600);
  await page.locator('.tab-router__item').nth(1).click();
  await page.waitForTimeout(300);
  if (!options.hasTouch) await page.locator('.tab-router__item').nth(2).hover();
  await page.waitForTimeout(300);
  await shoot(page, `${mode}-2-five-tabs-second-open-third-hovered`);
  if (!options.hasTouch) {
    await page.locator('.tab-router__item').nth(4).hover();
    await page.waitForTimeout(700);
    await shoot(page, `${mode}-3-cut-name-tooltip`, 190);
  }
  await page.locator('[data-tab-live="reset"] button').click();
  await page.waitForTimeout(400);
  await page.locator('[data-tab-live="sixteen"] button').click();
  await page.waitForTimeout(1500);
  await page.mouse.move(0, 0);
  await shoot(page, `${mode}-4-sixteen-tabs`);
  await context.close();
}

const desktop = { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' };
await run('light', desktop);
await run('dark', desktop, page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark')));
await run('graphite', desktop, page => page.evaluate(() => document.querySelector('.tab-live')?.classList.add('layout-demo__preview--graphite')));
await run('forced', { ...desktop, forcedColors: 'active' });
await run('phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
await browser.close();
