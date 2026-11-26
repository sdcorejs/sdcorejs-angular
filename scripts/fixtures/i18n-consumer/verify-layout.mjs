import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { createRequire } from 'node:module';

const [consumer, output] = process.argv.slice(2);
const { chromium } = createRequire(new URL('../../../showcase/package.json', import.meta.url))('@playwright/test');
const root = resolve(consumer, 'dist/layout/browser');
const paths = {
  home: { vi: 'Trang chủ', en: 'Home' },
  403: { vi: 'Không có quyền', en: 'Access Denied' },
  404: { vi: 'Không tìm thấy trang', en: 'Page Not Found' },
};
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.html': 'text/html; charset=utf-8' };
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname.slice(1);
  const name = Object.hasOwn(paths, path) ? 'index.html' : path;
  const file = resolve(root, name);
  if (!file.startsWith(root + sep)) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const data = await readFile(file);
    res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}) });
const runs = [];
try {
  await mkdir(output, { recursive: true });
  for (const [path, names] of Object.entries(paths)) {
    for (const [lang, name] of Object.entries(names)) {
      for (const width of [390, 900, 1280]) {
        const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
        const errors = [];
        page.on('pageerror', e => errors.push(e.message));
        page.on('console', m => {
          if (m.type() === 'error') errors.push(m.text());
        });
        await page.addInitScript(l => localStorage.setItem('sd-core.language', l), lang);
        const initial = path === 'home' ? '403' : 'home';
        await page.goto('http://127.0.0.1:' + server.address().port + '/' + initial);
        await page.waitForFunction(expected => document.title.includes(expected), paths[initial][lang]);
        await page.locator('nav[aria-label="Fixture routes"] a[href="/' + path + '"]').click();
        try {
          await page.waitForFunction(expected => document.title.includes(expected), name, { timeout: 12000 });
          const tab = page.getByRole('tab', { name: new RegExp(name) }).first();
          await tab.waitFor({ timeout: 5000 });
          assert.equal(await tab.isVisible(), true);
          const pane = page.getByRole('tabpanel').filter({ visible: true });
          await pane.waitFor({ timeout: 5000 });
          if (path === '403') assert.ok((await pane.innerText()).includes(lang === 'en' ? 'Access denied' : 'Không được phép truy cập'));
          if (path === '404')
            assert.ok((await pane.innerText()).includes(lang === 'en' ? '404 - Page not found' : '404 - Trang không tồn tại'));
          const image = 'layout-' + path + '-' + lang + '-' + width + '.png';
          await page.waitForLoadState('networkidle');
          await page.evaluate(() => document.fonts.ready);
          assert.deepEqual(errors, []);
          await page.screenshot({ path: resolve(output, image) });
          runs.push({ path, lang, width, title: await page.title(), tab: name, image });
        } catch (error) {
          console.error({
            path,
            lang,
            width,
            title: await page.title(),
            text: (await page.locator('body').innerText()).slice(0, 300),
            errors,
          });
          throw error;
        } finally {
          await page.close();
        }
      }
    }
  }
  await writeFile(resolve(output, 'layout-results.json'), JSON.stringify(runs, null, 2) + '\n');
  console.log('Verified localized tabs and browser titles in ' + runs.length + ' route/locale/viewport combinations.');
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
