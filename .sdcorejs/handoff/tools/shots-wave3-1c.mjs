// Wave 3 · 1c (sd-badge-picker) screenshots. New component, so there is no "before".
// Usage: node shots-wave3-1c.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const SECTIONS = ['chon-badge', 'trong-form', 'kich-thuoc', 'nhan-va-placeholder', 'gioi-han-lua-chon', 'mo-ta-trong-ban-xem-truoc', 'chi-xem-va-vo-hieu'];
const browser = await chromium.launch();
const log = (...a) => console.log(...a);

async function open(context, prepare) {
  const page = await context.newPage();
  await page.goto(base + '/v/latest/components/badge-picker/examples', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (prepare) await prepare(page);
  return page;
}

async function preview(page, section) {
  const el = page.locator(`[id="components-badge-picker-example-${section}-preview"]`);
  await el.scrollIntoViewIfNeeded();
  await el.locator('demo-section').first().waitFor({ timeout: 15000 });
  return el;
}

async function shootPanel(page, section, name, act) {
  const el = await preview(page, section);
  await el.locator('[data-badge-picker-trigger]').first().click();
  const panel = page.locator('.sd-badge-picker-panel');
  await panel.waitFor();
  await page.waitForTimeout(300);
  if (act) await act(page, panel);
  await page.waitForTimeout(200);
  const field = await el.locator('mat-form-field').first().boundingBox();
  const box = await panel.boundingBox();
  const top = Math.min(field.y, box.y) - 12;
  const bottom = Math.max(field.y + field.height, box.y + box.height) + 12;
  await page.screenshot({ path: join(outDir, `${name}.png`), clip: { x: Math.min(field.x, box.x) - 12, y: top, width: Math.max(field.width, box.width) + 24, height: bottom - top } });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  log('ok', name);
}

const desktop = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const dark = page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'));

for (const [mode, prepare] of [
  ['light', null],
  ['dark', dark],
]) {
  const page = await open(desktop, prepare);
  for (const section of SECTIONS) {
    try {
      const el = await preview(page, section);
      await page.waitForTimeout(150);
      await el.screenshot({ path: join(outDir, `${mode}-${section}.png`) });
      log('ok', mode, section);
    } catch (e) {
      log('FAIL', mode, section, String(e).split('\n')[0]);
    }
  }
  try {
    await shootPanel(page, 'chon-badge', `${mode}-panel-open`);
    await shootPanel(page, 'chon-badge', `${mode}-panel-draft`, async (p, panel) => {
      await panel.locator('[data-badge-picker-type="tag"]').click();
      await panel.locator('[data-badge-picker-color="info"]').click();
      await panel.locator('[data-badge-picker-icon="label"]').click();
    });
    await shootPanel(page, 'chon-badge', `${mode}-panel-dot`, async (p, panel) => {
      await panel.locator('[data-badge-picker-type="dot"]').click();
    });
    await shootPanel(page, 'chon-badge', `${mode}-panel-no-match`, async (p, panel) => {
      await panel.locator('[data-badge-picker-icons] input').fill('zzz');
    });
    await shootPanel(page, 'mo-ta-trong-ban-xem-truoc', `${mode}-panel-description-note`, async (p, panel) => {
      await panel.locator('[data-badge-picker-type="round"]').click();
    });
  } catch (e) {
    log('FAIL', mode, 'panel', String(e).split('\n')[0]);
  }
  await page.close();
}

// Required error after the first close, and the keyboard focus inside the panel.
{
  const page = await open(desktop);
  try {
    const el = await preview(page, 'trong-form');
    await el.locator('[data-badge-picker-trigger]').click();
    await page.locator('.sd-badge-picker-panel').waitFor();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await el.screenshot({ path: join(outDir, 'zz-required-error.png') });
    await shootPanel(page, 'chon-badge', 'zz-keyboard-focus', async p => {
      await p.keyboard.press('ArrowRight');
      await p.keyboard.press('Tab');
      await p.keyboard.press('ArrowRight');
    });
    log('ok required + keyboard');
  } catch (e) {
    log('FAIL required', String(e).split('\n')[0]);
  }
  await page.close();
}

const forced = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2, forcedColors: 'active' });
{
  const page = await open(forced);
  try {
    await shootPanel(page, 'chon-badge', 'forced-panel-open');
  } catch (e) {
    log('FAIL forced', String(e).split('\n')[0]);
  }
  await page.close();
}

const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
{
  const page = await open(phone);
  try {
    await shootPanel(page, 'chon-badge', 'phone-panel-open');
  } catch (e) {
    log('FAIL phone', String(e).split('\n')[0]);
  }
  await page.close();
}

await browser.close();
