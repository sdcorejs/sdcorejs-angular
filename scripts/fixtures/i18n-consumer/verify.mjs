import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { createRequire } from 'node:module';
import { gzipSync } from 'node:zlib';

const [before, after, evidence] = process.argv.slice(2);
if (!evidence) throw new Error('Expected baseline directory, candidate directory, evidence directory');
const { chromium } = createRequire(new URL('../../../showcase/package.json', import.meta.url))('@playwright/test');
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}) });
const result = {
  browser: browser.version(),
  compression: 'gzip level 9, cold HTTP cache, JavaScript response bodies',
  builds: {},
  runs: [],
};
try {
  for (const [label, directory, mode] of [
    ['before', before, 'legacy'],
    ['after-legacy', after, 'legacy'],
    ['after-vi', after, 'vi'],
    ['after-vi-en', after, 'vi-en'],
  ]) {
    const dist = resolve(directory, 'dist', mode);
    const stats = JSON.parse(await readFile(resolve(dist, 'stats.json'), 'utf8'));
    const chunks = new Map();
    for (const [name, output] of Object.entries(stats.outputs)) {
      if (!name.endsWith('.js')) continue;
      const file = basename(name);
      const raw = await readFile(resolve(dist, 'browser', file));
      const gzip = gzipSync(raw, { level: 9 });
      const locales = Object.entries(output.inputs).flatMap(([path, input]) => {
        const locale = path.match(/sdcorejs-angular-i18n-locales-([a-z]+)\.mjs$/)?.[1];
        return locale && input.bytesInOutput > 0 ? [locale] : [];
      });
      chunks.set(file, { raw, gzip, locales });
    }
    result.builds[label] = Object.fromEntries(
      [...chunks].map(([n, c]) => [n, { raw: c.raw.length, gzip: c.gzip.length, locales: c.locales }])
    );
    const scope = mode === 'vi-en' ? ['en', 'vi'] : mode === 'vi' ? ['vi'] : [];
    if (mode !== 'legacy') {
      assert.deepEqual([...chunks.values()].flatMap(c => c.locales).sort(), scope);
      for (const c of chunks.values()) {
        assert.equal(c.raw.toString().split('core.component.window.title').length - 1, c.locales.length);
      }
    }
    const server = createServer(async (req, res) => {
      const file = basename(new URL(req.url, 'http://localhost').pathname) || 'index.html';
      if (chunks.has(file)) {
        const body = chunks.get(file).gzip;
        res.writeHead(200, {
          'Content-Type': 'application/javascript',
          'Content-Encoding': 'gzip',
          'Content-Length': body.length,
          'Cache-Control': 'no-store',
        });
        res.end(body);
      } else if (file === 'index.html') {
        res.setHeader('Content-Type', 'text/html;charset=utf-8');
        res.end(await readFile(resolve(dist, 'browser', file)));
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    await new Promise(done => server.listen(0, '127.0.0.1', done));
    const origin = 'http://127.0.0.1:' + server.address().port;
    try {
      const cases =
        mode === 'legacy'
          ? [['en', 'en', []]]
          : mode === 'vi'
            ? [['ja', 'vi', []]]
            : [
                ['en', 'en', []],
                ['vi', 'vi', []],
                ['en', 'vi', ['en']],
                ['en', null, ['en', 'vi']],
              ];
      for (const [stored, expected, fail] of cases) {
        for (const width of mode === 'vi-en' ? [390, 900, 1280] : [1280]) {
          const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
          const requested = [];
          const failures = [];
          page.on('request', req => {
            const name = basename(new URL(req.url()).pathname);
            if (chunks.has(name)) requested.push(name);
          });
          page.on('pageerror', error => failures.push(error.message));
          await page.addInitScript(lang => {
            if (!sessionStorage.getItem('seeded')) {
              localStorage.setItem('sd-core.language', lang);
              sessionStorage.setItem('seeded', '1');
            }
            new MutationObserver((_, observer) => {
              const heading = document.querySelector('main h1');
              if (heading?.textContent) {
                window.firstHeading = heading.textContent.trim();
                observer.disconnect();
              }
            }).observe(document, { childList: true, characterData: true, subtree: true });
          }, stored);
          if (fail.length)
            await page.route('**/*.js', route => {
              const c = chunks.get(basename(new URL(route.request().url()).pathname));
              return c?.locales.some(lang => fail.includes(lang)) ? route.abort() : route.continue();
            });
          await page.goto(origin);
          if (expected) {
            await page.locator('main[lang="' + expected + '"]').waitFor();
            assert.equal(await page.evaluate(() => window.firstHeading), expected === 'en' ? 'Home' : 'Trang chủ');
            assert.equal(await page.locator('main p').textContent(), expected === 'en' ? 'Cancel' : 'Hủy');
          } else {
            await page.getByText('Language unavailable. Reload to retry.').waitFor();
          }
          const observed = requested.flatMap(n => chunks.get(n).locales).sort();
          if (mode !== 'legacy') assert.deepEqual(observed, [...new Set([...(expected ? [expected] : []), ...fail])].sort());
          const transferred = await page.evaluate(() =>
            performance
              .getEntriesByType('resource')
              .filter(e => new URL(e.name).pathname.endsWith('.js'))
              .reduce((n, e) => n + e.encodedBodySize, 0)
          );
          const jsBytes = requested
            .filter(n => !chunks.get(n).locales.some(l => fail.includes(l)))
            .reduce((sum, n) => sum + chunks.get(n).gzip.length, 0);
          assert.equal(transferred, jsBytes);
          const state = fail.length ? 'failure-' + fail.join('-') : stored;
          const record = { build: label, width, stored, expected, fail, requested, gzipBytes: transferred };
          if (mode === 'vi-en') {
            record.image = label + '-' + state + '-' + width + '.png';
            await page.screenshot({ path: resolve(evidence, record.image) });
            if (stored === 'en' && !fail.length) {
              await Promise.all([page.waitForNavigation(), page.getByRole('button', { name: 'VI', exact: true }).click()]);
              await page.locator('main[lang="vi"]').waitFor();
              assert.equal(await page.locator('main h1').textContent(), 'Trang chủ');
              assert.equal(await page.evaluate(() => localStorage.getItem('sd-core.language')), 'vi');
              record.switchedTo = 'vi';
            }
          }
          if (!expected) {
            await page.unrouteAll({ behavior: 'wait' });
            await page.reload();
            await page.locator('main[lang="en"]').waitFor();
            assert.equal(await page.locator('main h1').textContent(), 'Home');
            record.recoveredAfterReload = true;
          }
          assert.deepEqual(failures, []);
          result.runs.push(record);
          await page.close();
        }
      }
    } finally {
      await new Promise(done => server.close(done));
    }
  }
  await writeFile(resolve(evidence, 'consumer-results.json'), JSON.stringify(result, null, 2) + '\n');
  for (const r of result.runs.filter(r => r.width === 1280)) console.log(r.build, r.stored, r.fail, r.gzipBytes);
} finally {
  await browser.close();
}
