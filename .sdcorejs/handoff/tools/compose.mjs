// Builds one before/after comparison PNG from the shots of a step.
// Usage: node compose.mjs <shotsDir> <out.png> <title>
import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [dir, out, title] = process.argv.slice(2);

const names = [...new Set(readdirSync(dir).filter(f => f.endsWith('-before.png')).map(f => f.replace(/-before\.png$/, '')))].sort();
const img = f => `data:image/png;base64,${readFileSync(join(dir, f)).toString('base64')}`;
const rows = names
  .map(
    n => `<section><h2>${n}</h2><div class="pair">
      <figure><figcaption>Trước</figcaption><img src="${img(`${n}-before.png`)}"></figure>
      <figure><figcaption>Sau</figcaption><img src="${img(`${n}-after.png`)}"></figure></div></section>`,
  )
  .join('');
const html = `<!doctype html><meta charset="utf-8"><style>
  body{font:14px system-ui,sans-serif;margin:24px;background:#fff;color:#1a1b1f}
  h1{font-size:20px;margin:0 0 16px} h2{font:600 13px ui-monospace,monospace;margin:20px 0 8px;color:#44474f}
  .pair{display:flex;gap:16px;align-items:flex-start} figure{margin:0} figcaption{font-weight:600;margin-bottom:4px}
  img{border:1px solid #c4c6d0;max-width:620px;display:block}
</style><h1>${title}</h1>${rows}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1320, height: 800 } });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('wrote', out, names.length, 'pairs');
