// Wave 3 · 2a (sd-avatar status, name) screenshots. Usage: node shots-wave3-2a.mjs <baseUrl> <outDir>
// The existing avatar examples do not change look, so only the new examples are shot (light, dark, graphite, forced
// colours, phone), plus the dot and image tooltips and a 3x zoom of the dots by size.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });

const SECTIONS = ['cham-trang-thai', 'cham-theo-kich-thuoc', 'anh-co-ten', 'trong-danh-sach'];
const browser = await chromium.launch();
const log = (...a) => console.log(...a);

async function open(context, prepare) {
  const page = await context.newPage();
  await page.goto(base + '/v/latest/components/avatar/examples', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (prepare) await prepare(page);
  return page;
}

async function preview(page, section) {
  const el = page.locator(`[id="components-avatar-example-${section}-preview"]`);
  await el.scrollIntoViewIfNeeded();
  await el.locator('demo-section').first().waitFor({ timeout: 15000 });
  return el;
}

async function shootAll(context, mode, prepare) {
  const page = await open(context, prepare);
  for (const section of SECTIONS) {
    try {
      const el = await preview(page, section);
      if (mode === 'graphite') await el.evaluate(node => node.classList.add('layout-demo__preview--graphite'));
      await page.waitForTimeout(300);
      await el.screenshot({ path: join(outDir, `${mode}-${section}.png`) });
      log('ok', mode, section);
    } catch (e) {
      log('FAIL', mode, section, String(e).split('\n')[0]);
    }
  }
  await page.close();
}

const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'no-preference' });
await shootAll(desktop, 'light');
await shootAll(desktop, 'dark', page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark')));
await shootAll(desktop, 'graphite');
await shootAll(await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, forcedColors: 'active' }), 'forced');
await shootAll(await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }), 'phone');

{
  const zoom = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 3 });
  const page = await open(zoom);
  try {
    const sizes = await preview(page, 'cham-theo-kich-thuoc');
    await sizes.locator('.row').screenshot({ path: join(outDir, 'zz-dots-by-size-3x.png') });
    const dot = (await preview(page, 'cham-trang-thai')).locator('sd-avatar').first().locator('sd-badge');
    await dot.hover();
    await page.waitForTimeout(500);
    const box = await dot.boundingBox();
    await page.screenshot({ path: join(outDir, 'zz-dot-tooltip.png'), clip: { x: box.x - 80, y: box.y - 70, width: 200, height: 100 } });
    const image = (await preview(page, 'anh-co-ten')).locator('sd-avatar').first().locator('.sd-avatar');
    await image.hover();
    await page.waitForTimeout(500);
    const ibox = await image.boundingBox();
    await page.screenshot({ path: join(outDir, 'zz-image-tooltip.png'), clip: { x: ibox.x - 60, y: ibox.y - 50, width: 220, height: ibox.height + 70 } });
    log('ok zoom + tooltips');
  } catch (e) {
    log('FAIL zoom', String(e).split('\n')[0]);
  }
  await page.close();
}

await browser.close();
