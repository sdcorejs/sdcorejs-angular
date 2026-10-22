// sd-operator final checks on the showcase: sizes, readonly, showCode with 17 operators, keyboard, modes, locale en and the
// query-builder rule operator. Usage: node check-operator.mjs <baseUrl> <outDir>
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const report = [];
const errors = [];

async function openPage(path, options = {}, before) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, ...options });
  if (before) await context.addInitScript(before);
  const page = await context.newPage();
  page.on('console', message => {
    const text = message.text();
    if (message.type() === 'error' && !text.includes('versions.json') && !text.includes('404')) errors.push(text.split('\n')[0]);
  });
  await page.goto(base + path, { waitUntil: 'networkidle' });
  return page;
}

async function example(page, slug) {
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const id = ids.find(i => i.includes(slug));
  if (!id) throw new Error('no example ' + slug + ' in ' + ids.join(', '));
  const preview = page.locator(`[id="${id}"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  await page.waitForTimeout(800);
  await preview.evaluate(el => {
    const bar = document.querySelector('.topbar');
    window.scrollBy(0, el.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 0) - 16);
  });
  await page.waitForTimeout(500);
  await page.mouse.move(0, 0);
  return preview;
}

async function shot(page, locator, name, extra) {
  const a = await locator.boundingBox();
  let box = { x: a.x, y: a.y, right: a.x + a.width, bottom: a.y + a.height };
  if (extra && (await extra.count())) {
    const b = await extra.first().boundingBox();
    box = { x: Math.min(box.x, b.x), y: Math.min(box.y, b.y), right: Math.max(box.right, b.x + b.width), bottom: Math.max(box.bottom, b.y + b.height) };
  }
  await page.screenshot({
    path: join(outDir, name + '.png'),
    clip: { x: box.x - 8, y: box.y - 8, width: Math.min(box.right - box.x + 16, 1300), height: box.bottom - box.y + 16 },
  });
}

const menu = page => page.locator('.cdk-overlay-pane .c-op-menu');

// 1. Light: sizes, readonly, showCode with all 17 operators, keyboard.
{
  const page = await openPage('/v/latest/components/operator/examples');
  let preview = await example(page, 'kich-thuoc');
  await shot(page, preview, 'sizes');
  const sizes = await preview.locator('sd-operator').evaluateAll(els =>
    els.slice(0, 9).map(el => {
      const target = el.querySelector('button') ?? el;
      const r = target.getBoundingClientRect();
      return `${Math.round(r.width)}x${Math.round(r.height)}`;
    })
  );
  report.push(`sizes (md, md active, md empty, sm…, xs…): ${sizes.join(' ')}`);

  preview = await example(page, 'chi-xem');
  await shot(page, preview, 'readonly');
  const glyphs = await preview.locator('[role="img"].sd-operator__glyph').evaluateAll(els => els.map(el => el.getAttribute('aria-label')));
  const disabledButtons = await preview.locator('sd-operator button[disabled]').count();
  report.push(`readonly glyphs: ${JSON.stringify(glyphs)}; readonly+disabled renders ${disabledButtons} disabled button`);

  preview = await example(page, 'hien-ma');
  const trigger = preview.locator('button.c-op-trigger').first();
  await trigger.click();
  await page.waitForTimeout(700);
  await shot(page, trigger, 'show-code-17', menu(page));
  const rows = await menu(page).locator('.c-op-row').count();
  const separators = await menu(page).locator('[role="separator"]').count();
  const checked = await menu(page).locator('.c-op-row[aria-checked="true"] .c-op-label').textContent();
  report.push(`showCode menu: ${rows} rows, ${separators} separators, checked "${checked?.trim()}"`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Keyboard: Tab to the trigger, Alt+ArrowDown opens, arrows, Enter picks, focus back on the trigger.
  await trigger.focus();
  const name = await trigger.getAttribute('aria-label');
  await page.keyboard.press('Alt+ArrowDown');
  await page.waitForTimeout(500);
  const opened = await menu(page).count();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const focusBack = await page.evaluate(() => document.activeElement?.classList.contains('c-op-trigger'));
  const after = await trigger.getAttribute('aria-label');
  report.push(`keyboard: name "${name}", Alt+↓ opened ${opened > 0}, after pick "${after}", focus back on trigger ${focusBack}`);
  await page.context().close();
}

// 2. Dark, graphite, forced colors: the sizes example with a menu open.
for (const [mode, setup] of [
  ['dark', async page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'))],
  ['graphite', async (page, preview) => preview.evaluate(el => el.classList.add('layout-demo__preview--graphite'))],
  ['forced', async page => page.emulateMedia({ forcedColors: 'active' })],
]) {
  const page = await openPage('/v/latest/components/operator/examples');
  const preview = await example(page, 'kich-thuoc');
  await setup(page, preview);
  await page.waitForTimeout(300);
  const trigger = preview.locator('button.c-op-trigger').nth(1);
  await trigger.click();
  await page.waitForTimeout(700);
  await shot(page, preview, `mode-${mode}`, menu(page));
  await page.context().close();
}

// 3. Locale en: trigger name and labels.
{
  const page = await openPage('/v/latest/components/operator/examples', {}, () => localStorage.setItem('sd-core.language', 'en'));
  const preview = await example(page, 'kich-thuoc');
  const trigger = preview.locator('button.c-op-trigger').first();
  const name = await trigger.getAttribute('aria-label');
  await trigger.click();
  await page.waitForTimeout(600);
  const labels = await menu(page).locator('.c-op-label').allTextContents();
  report.push(`locale en: name "${name}", labels ${labels.map(l => l.trim()).join(' | ')}`);
  await page.context().close();
}

// 4. Query builder: a rule operator (one operator hides it, several show the md chip).
{
  const page = await openPage('/v/latest/components/query-builder/examples');
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const preview = page.locator(`[id="${ids[0]}"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  await page.waitForTimeout(1500);
  const ops = await preview.locator('sd-operator').count();
  if (ops) {
    const op = preview.locator('sd-operator').first();
    await op.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    const row = op.locator('xpath=ancestor::*[contains(@class,"qb-rule")][1]');
    await shot(page, (await row.count()) ? row : op, 'query-builder');
  }
  report.push(`query-builder: ${ops} sd-operator in the first example`);
  await page.context().close();
}

console.log(report.join('\n'));
console.log(errors.length ? 'console errors: ' + errors.join(' || ') : 'no console errors');
await browser.close();
