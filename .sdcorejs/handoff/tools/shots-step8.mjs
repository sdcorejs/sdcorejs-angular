// Step 8 (sd-kanban look) before/after screenshots. Usage: node shots-step8.mjs <baseUrl> <outDir> <label>
// Shoots the first kanban example at rest, with a hovered card, with a collapsed lane, and in dark.
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

async function step(name, fn) {
  try {
    await fn();
  } catch (e) {
    log('FAIL', name, String(e).split('\n')[0]);
  }
}

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

async function board(mode) {
  await page.goto(base + '/v/latest/components/kanban/examples', { waitUntil: 'networkidle' });
  await page.evaluate(m => document.documentElement.setAttribute('data-sd-theme', m), mode);
  await page.waitForTimeout(800);
  const preview = page.locator('[id$="-preview"]').first();
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  const kanban = preview.locator('sd-kanban').first();
  await kanban.waitFor({ timeout: 30000 });
  await settle(kanban);
  await page.mouse.move(0, 0);
  return kanban;
}

async function clip(name, target, height = 520) {
  const box = await target.boundingBox();
  await page.screenshot({ path: shot(name), clip: { x: box.x, y: box.y, width: Math.min(box.width, 1100), height: Math.min(box.height, height, 900 - box.y) } });
  log('ok', name);
}

await step('rest', async () => {
  const kanban = await board('light');
  await clip('01-light-rest', kanban);
});

await step('hover', async () => {
  const kanban = await board('light');
  await kanban.locator('.sd-kanban__card').nth(1).hover();
  await page.waitForTimeout(300);
  await clip('02-light-hover-card', kanban);
});

await step('collapsed', async () => {
  const kanban = await board('light');
  await kanban.locator('.sd-kanban__header button[aria-expanded="true"]').first().click();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(400);
  await clip('03-light-collapsed', kanban);
});

await step('dark', async () => {
  const kanban = await board('dark');
  await clip('04-dark-rest', kanban);
});

await browser.close();
