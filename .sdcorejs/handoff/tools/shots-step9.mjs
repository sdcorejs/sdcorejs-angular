// Step 9 (sd-button indicator) screenshots of the new showcase example, light and dark.
// Usage: node shots-step9.mjs <baseUrl> <out.png>
import { createRequire } from 'node:module';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, out] = process.argv.slice(2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const shots = [];

for (const mode of ['light', 'dark']) {
  await page.goto(base + '/v/latest/components/button/examples', { waitUntil: 'networkidle' });
  await page.evaluate(m => document.documentElement.setAttribute('data-sd-theme', m), mode);
  await page.waitForTimeout(800);
  const preview = page.locator('[id$="example-indicator-preview"]').first();
  await preview.scrollIntoViewIfNeeded();
  const example = preview.locator('app-button-indicator-example').first();
  await example.waitFor({ timeout: 30000 });
  await example.evaluate(el => {
    const bar = document.querySelector('.topbar');
    window.scrollBy(0, el.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 0) - 24);
  });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(600);
  const box = await example.boundingBox();
  const png = await page.screenshot({ clip: { x: box.x - 16, y: box.y - 16, width: Math.min(box.width + 32, 1100), height: box.height + 32 } });
  shots.push({ mode, data: png.toString('base64') });
  console.log('ok', mode);
}

const html = `<!doctype html><meta charset="utf-8"><style>
  body{font:14px system-ui,sans-serif;margin:24px;background:#fff;color:#1a1b1f}
  h1{font-size:20px;margin:0 0 16px} h2{font:600 13px ui-monospace,monospace;margin:20px 0 8px;color:#44474f}
  img{border:1px solid #c4c6d0;max-width:1100px;display:block}
</style><h1>Bước 9 · indicator trên sd-button (demo mới, không có bản trước)</h1>${shots
  .map(s => `<h2>${s.mode}</h2><img src="data:image/png;base64,${s.data}">`)
  .join('')}`;
await page.setViewportSize({ width: 1200, height: 800 });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('wrote', out);
