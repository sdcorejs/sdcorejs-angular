// sd-chip-calendar final checks on the showcase: screenshots of the examples in several modes plus a keyboard walk.
// Usage: node check-chip-calendar.mjs <baseUrl> <outDir>
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

async function openPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2, ...options });
  const page = await context.newPage();
  page.on('console', message => {
    const text = message.text();
    if (message.type() === 'error' && !text.includes('versions.json') && !text.includes('404')) errors.push(text.split('\n')[0]);
  });
  await page.goto(base + '/v/latest/forms/chip-calendar/examples', { waitUntil: 'networkidle' });
  return page;
}

/** Loads one example (by heading slug) and returns its preview locator. */
async function example(page, slug) {
  const ids = await page.$$eval('[id$="-preview"]', els => els.map(e => e.id));
  const id = ids.find(i => i.includes(slug));
  if (!id) throw new Error('no example ' + slug + ' in ' + ids.join(', '));
  const preview = page.locator(`[id="${id}"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.count()) await load.first().click();
  await preview.locator('sd-chip-calendar').first().waitFor({ timeout: 30000 });
  await preview.evaluate(el => {
    const bar = document.querySelector('.topbar');
    window.scrollBy(0, el.getBoundingClientRect().top - (bar ? bar.getBoundingClientRect().bottom : 0) - 16);
  });
  await page.waitForTimeout(600);
  await page.mouse.move(0, 0);
  return preview;
}

async function shot(page, locator, name) {
  const box = await locator.boundingBox();
  await page.screenshot({ path: join(outDir, name + '.png'), clip: { x: box.x - 8, y: box.y - 8, width: box.width + 16, height: box.height + 16 } });
}

async function shotWithPanel(page, preview, name) {
  const panel = page.locator('.cdk-overlay-pane .sd-chip-calendar-panel').first();
  await panel.waitFor({ timeout: 5000 });
  // The panel fades in; wait for the end of the animation.
  await page.waitForTimeout(500);
  const a = await preview.locator('sd-chip-calendar').first().boundingBox();
  const b = await panel.boundingBox();
  const x = Math.min(a.x, b.x) - 8;
  const y = Math.min(a.y, b.y) - 8;
  await page.screenshot({
    path: join(outDir, name + '.png'),
    clip: { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x + 8, height: Math.max(a.y + a.height, b.y + b.height) - y + 8 },
  });
}

// 1. Light, default preset: every new example, closed; popups of the limit and table examples.
{
  const page = await openPage();
  for (const slug of ['kich-thuoc', 'khoa-ngay-da-qua', 'gon-trong-bo-loc-bang', 'kieu-model-va-transform', 'gioi-han-ngay-va-so-luong']) {
    const preview = await example(page, slug);
    await shot(page, preview, `light-${slug}`);
  }

  // “+N” folds while closed and shows all chips once open.
  let preview = await example(page, 'gon-trong-bo-loc-bang');
  const chipsClosed = await preview.locator('mat-chip-row').count();
  const more = (await preview.locator('.sd-chip-calendar__more').textContent())?.trim();
  await preview.locator('.sd-chip-calendar__more').click();
  await page.waitForTimeout(500);
  const chipsOpen = await preview.locator('mat-chip-row').count();
  await shotWithPanel(page, preview, 'light-table-open');
  report.push(`maxVisible=2: closed ${chipsClosed} chips + "${more}", open ${chipsOpen} chips`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Limits: past days and weekends disabled; filling maxCount disables the rest.
  preview = await example(page, 'gioi-han-ngay-va-so-luong');
  await preview.locator('[data-chip-calendar-open]').click();
  await page.waitForTimeout(500);
  const enabled = page.locator('.sd-chip-calendar-panel .mat-calendar-body-cell:not(.mat-calendar-body-disabled)');
  const before = await enabled.count();
  const unchosen = page.locator('.sd-chip-calendar-panel .mat-calendar-body-cell:not(.mat-calendar-body-disabled):not(.sd-chip-calendar-selected)');
  for (let i = 0; i < 3; i++) {
    await unchosen.nth(0).click();
    await page.waitForTimeout(250);
  }
  const disabledAfter = await page.locator('.sd-chip-calendar-panel .mat-calendar-body-disabled').count();
  const live = (await page.locator('.sd-chip-calendar-panel__full').textContent())?.trim();
  const weekendEnabled = await page.$$eval('.sd-chip-calendar-panel .mat-calendar-body-cell:not(.mat-calendar-body-disabled)', cells =>
    cells.filter(cell => {
      const label = cell.getAttribute('aria-label') || '';
      const date = new Date(label);
      return !Number.isNaN(date.getTime()) && (date.getDay() === 0 || date.getDay() === 6);
    }).length
  );
  await shotWithPanel(page, preview, 'light-limit-full');
  report.push(`limits: ${before} pickable cells before, ${disabledAfter} disabled after 3 picks, live "${live}", weekend pickable ${weekendEnabled}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);

  // Locked chips: the past days show a lock and survive Backspace.
  preview = await example(page, 'khoa-ngay-da-qua');
  const locks = await preview.locator('.sd-chip-calendar__lock').count();
  const lockedChip = preview.locator('mat-chip-row.sd-chip-calendar__chip--locked').first();
  const countBefore = await preview.locator('mat-chip-row').count();
  await lockedChip.locator('.mdc-evolution-chip__action--primary').focus();
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(300);
  const countAfter = await preview.locator('mat-chip-row').count();
  report.push(`removable: ${locks} locks; Backspace on a locked chip ${countBefore} -> ${countAfter} chips`);

  // Model types and transform: the output after one pick.
  preview = await example(page, 'kieu-model-va-transform');
  const chips = await preview.locator('.sd-chip-calendar__chip-text').allTextContents();
  await preview.locator('[data-chip-calendar-open]').click();
  await page.waitForTimeout(500);
  await page.locator('.sd-chip-calendar-panel .mat-calendar-body-cell:not(.mat-calendar-body-disabled):not(.sd-chip-calendar-selected)').first().click();
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const output = (await preview.locator('pre').textContent())?.replace(/\s+/g, ' ');
  report.push(`model types: chips ${chips.join(' | ')}; output after a pick ${output}`);

  // Keyboard: Enter opens, focus in the grid, Tab stays inside, Esc closes and returns focus.
  preview = await example(page, 'lien-ket-hai-chieu');
  await preview.locator('input').first().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const inGrid = await page.evaluate(() => !!document.activeElement?.closest('.mat-calendar-body'));
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  const stillInside = await page.evaluate(() => !!document.activeElement?.closest('.sd-chip-calendar-panel'));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  const back = await page.evaluate(() => document.activeElement?.tagName + '.' + document.activeElement?.className);
  report.push(`keyboard: focus in grid ${inGrid}, after 8 Tabs inside ${stillInside}, after Esc ${back.slice(0, 60)}`);
  await page.context().close();
}

// 2. Dark mode, graphite preset, forced colors.
for (const [mode, setup] of [
  ['dark', async page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'))],
  ['graphite', async (page, preview) => preview.evaluate(el => el.classList.add('layout-demo__preview--graphite'))],
  ['forced', async page => page.emulateMedia({ forcedColors: 'active' })],
]) {
  const page = await openPage();
  const preview = await example(page, 'khoa-ngay-da-qua');
  await setup(page, preview);
  await page.waitForTimeout(400);
  await preview.locator('[data-chip-calendar-open]').click();
  await shotWithPanel(page, preview, `${mode}-locked-open`);
  await page.context().close();
}

// 3. Narrow (≤ 600px) with a coarse pointer.
{
  const page = await openPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const coarse = await page.evaluate(() => matchMedia('(pointer: coarse)').matches);
  const preview = await example(page, 'kich-thuoc');
  await shot(page, preview.locator('sd-chip-calendar').first(), 'mobile-sm');
  const hit = await preview.locator('.mat-mdc-chip-remove').first().evaluate(el => {
    const after = getComputedStyle(el, '::after');
    return `${after.width} x ${after.height}`;
  });
  await preview.locator('[data-chip-calendar-open]').first().click();
  await shotWithPanel(page, preview, 'mobile-open');
  const panel = await page.locator('.sd-chip-calendar-panel').boundingBox();
  report.push(`mobile: pointer coarse ${coarse}, ✕ hit area ${hit}, panel ${Math.round(panel.width)}px wide at x ${Math.round(panel.x)}`);
  await page.context().close();
}

console.log(report.join('\n'));
console.log(errors.length ? 'console errors: ' + errors.join(' || ') : 'no console errors');
await browser.close();
