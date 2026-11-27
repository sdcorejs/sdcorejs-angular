import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const [consumer, output] = process.argv.slice(2);
const cwd = resolve(consumer);
const requireConsumer = createRequire(resolve(cwd, 'package.json'));
const { chromium } = createRequire(new URL('../../../showcase/package.json', import.meta.url))('@playwright/test');
const { build } = requireConsumer('esbuild');
const app = resolve(cwd, 'ssr-app.mjs');
await copyFile(new URL('./ssr-app.mjs', import.meta.url), app);
const { bootstrapLocale } = await import(pathToFileURL(app));
const { renderApplication, provideServerRendering } = await import(pathToFileURL(requireConsumer.resolve('@angular/platform-server')));
const bundle = await build({
  stdin: {
    contents: "import { bootstrapLocale } from './ssr-app.mjs'; bootstrapLocale('vi').then(() => { window.fixtureReady = true; });",
    resolveDir: cwd,
  },
  bundle: true,
  write: false,
  format: 'esm',
  platform: 'browser',
});
const labels = { vi: 'Trang chủ', en: 'Home' };
const document =
  '<!doctype html><html><head><base href="/"></head><body><fixture-app></fixture-app>' +
  '<script>window.serverHeading = document.querySelector("h1")</script><script type="module" src="/client.js"></script></body></html>';
// Release both loaders only once both requests have reached their own application initializer.
const barrier = Promise.withResolvers();
let requests = 0;
const beforeLoad = () => {
  if (++requests === 2) barrier.resolve();
  return barrier.promise;
};
const server = createServer(async (req, res) => {
  if (req.url === '/client.js') {
    res.setHeader('Content-Type', 'application/javascript');
    res.end(bundle.outputFiles[0].contents);
    return;
  }
  const lang = req.url.slice(1);
  if (!Object.hasOwn(labels, lang)) {
    res.writeHead(404);
    res.end();
    return;
  }
  try {
    const html = await renderApplication(context => bootstrapLocale(lang, context, [provideServerRendering()], beforeLoad), {
      document,
      url: req.url,
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(html);
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end();
  }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const browser = await chromium.launch({ ...(process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {}) });
try {
  const results = await Promise.all(
    Object.entries(labels).map(async ([lang, label]) => {
      const page = await browser.newPage();
      try {
        await page.addInitScript(value => localStorage.setItem('sd-core.language', value), lang === 'vi' ? 'en' : 'vi');
        const response = await page.goto('http://127.0.0.1:' + server.address().port + '/' + lang);
        assert.equal(response.status(), 200);
        const html = await response.text();
        assert.ok(html.includes('sd-core.i18n.language'), 'server serialized the selected locale');
        assert.ok(html.includes('>' + label + '</h1>'), 'server rendered the selected translation');
        await page.waitForFunction(() => window.fixtureReady);
        const actual = await page.evaluate(() => ({
          language: document.querySelector('h1').lang,
          text: document.querySelector('h1').textContent,
          retainedServerNode: document.querySelector('h1') === window.serverHeading,
        }));
        assert.deepEqual(actual, { language: lang, text: label, retainedServerNode: true });
        return actual;
      } finally {
        await page.close();
      }
    })
  );
  assert.equal(requests, 2);
  await mkdir(output, { recursive: true });
  await writeFile(resolve(output, 'ssr-results.json'), JSON.stringify({ concurrentRequests: requests, results }, null, 2) + '\n');
  console.log('Both simultaneous server renders retained their locale and original heading through browser hydration.');
} finally {
  await browser.close();
  await new Promise(done => server.close(done));
}
