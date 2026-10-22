// Builds one PNG from shots that have no "before" (new demos). Usage: node compose-only.mjs <dir> <out.png> <title>
import { createRequire } from 'node:module';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [dir, out, title] = process.argv.slice(2);

const names = readdirSync(dir).filter(f => f.endsWith('.png')).sort();
const rows = names
  .map(n => `<h2>${n.replace(/\.png$/, '')}</h2><img src="data:image/png;base64,${readFileSync(join(dir, n)).toString('base64')}">`)
  .join('');
const html = `<!doctype html><meta charset="utf-8"><style>
  body{font:14px system-ui,sans-serif;margin:24px;background:#fff;color:#1a1b1f}
  h1{font-size:20px;margin:0 0 16px} h2{font:600 13px ui-monospace,monospace;margin:20px 0 8px;color:#44474f}
  img{border:1px solid #c4c6d0;max-width:900px;display:block}
</style><h1>${title}</h1>${rows}`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 980, height: 800 } });
await page.setContent(html);
await page.screenshot({ path: out, fullPage: true });
await browser.close();
console.log('wrote', out);
