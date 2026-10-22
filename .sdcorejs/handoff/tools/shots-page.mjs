// Shoots every example of one showcase page in light, dark (data-sd-theme), graphite (showcase preset class), forced
// colours and a 390px touch viewport. Usage: node shots-page.mjs <baseUrl> <outDir> <category/slug> [section-filter]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir, page, filter] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const prefix = page.replace('/', '-') + '-example-';

const browser = await chromium.launch();
const modes = [
  ['light', { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' }],
  ['dark', { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' }],
  ['graphite', { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' }],
  ['forced', { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, forcedColors: 'active', reducedMotion: 'reduce' }],
  ['phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' }],
];

for (const [mode, options] of modes) {
  const context = await browser.newContext(options);
  const tab = await context.newPage();
  await tab.goto(`${base}/v/latest/${page}/examples`, { waitUntil: 'networkidle' });
  await tab.waitForTimeout(800);
  if (mode === 'dark') await tab.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'));
  const ids = await tab.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  for (const id of ids) {
    const section = id.replace(prefix, '').replace('-preview', '');
    if (filter && !section.includes(filter)) continue;
    try {
      const el = tab.locator(`[id="${id}"]`);
      await el.scrollIntoViewIfNeeded();
      await el.locator('demo-section').first().waitFor({ timeout: 15000 });
      if (mode === 'graphite') await el.evaluate(node => node.classList.add('layout-demo__preview--graphite'));
      await tab.waitForTimeout(250);
      await el.screenshot({ path: join(outDir, `${mode}-${section}.png`) });
      console.log('ok', mode, section);
    } catch (e) {
      console.log('FAIL', mode, section, String(e).split('\n')[0]);
    }
  }
  await context.close();
}
await browser.close();
