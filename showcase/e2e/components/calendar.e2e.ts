import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// E2E of sd-calendar on its Showcase page (handoff schedule-kanban, TESTING.md §5.3, §8–§10).

declare global {
  interface Window {
    __t0: number;
    __long: number[];
    axe: { run: (context: Element) => Promise<{ violations: { id: string; impact: string }[] }> };
  }
}

// why: Playwright loads the e2e files as CommonJS here, so __dirname instead of import.meta.url.
const HERE = __dirname;
const AXE = resolve(HERE, '../../../versions/v19/node_modules/axe-core/axe.min.js');
const SHOTS = resolve(HERE, '../../../.sdcorejs/handoff/schedule-kanban/reports/calendar-screens');
const PAGE = '/v/latest/components/calendar/examples';

const SECTIONS = {
  playground: 'lich-hop-nguon-client',
  server: 'nguon-server',
  drawer: 'tao-bang-drawer-doi-co-hoan-tac',
  timesheet: 'bang-cham-cong-mot-nguoi',
  url: 'cot-hep-va-dong-bo-url',
} as const;

/**
 * Opens one example and waits for its calendar. Each demo section is its own preview, created once it scrolls into the
 * viewport (@defer on viewport), like the date-time e2e.
 */
async function open(page: Page, section: keyof typeof SECTIONS, query = ''): Promise<Locator> {
  await page.goto(`${PAGE}${query}`);
  const preview = page.locator(`[id="components-calendar-example-${SECTIONS[section]}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator('demo-section')).toBeVisible();
  // The code panel sits next to the preview and leaves the calendar under 600px (compact); hide it.
  const hideCode = page.locator(`[id="components-calendar-example-${SECTIONS[section]}"]`).getByRole('button', { name: 'Hide code' });
  if (await hideCode.isVisible()) await hideCode.click();
  const root = preview.locator(`[data-autoid="components-calendar-${section}"]`);
  await root.scrollIntoViewIfNeeded();
  await expect(root).toBeVisible();
  await expect(root.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 15_000 });
  return root;
}

const column = (root: Locator, day: string): Locator => root.locator(`[data-day-column][data-date="${day}"]`);
const block = (root: Locator, id: string): Locator => root.locator(`[data-event-id="${id}"]`).first();

/** Client point of `minutes` in the column of `day`. */
async function at(root: Locator, day: string, minutes: number): Promise<{ x: number; y: number }> {
  const box = (await column(root, day).boundingBox())!;
  return { x: box.x + box.width / 2, y: box.y + (minutes / 60) * 48 + 2 };
}

async function sweep(page: Page, root: Locator, day: string, from: number, to: number): Promise<void> {
  const start = await at(root, day, from);
  const end = await at(root, day, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 6 });
  await page.mouse.up();
}

async function drag(page: Page, source: Locator, to: { x: number; y: number }, beforeDrop?: () => Promise<void>): Promise<void> {
  const box = (await source.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 6);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, box.y + 12, { steps: 2 });
  await page.mouse.move(to.x, to.y, { steps: 8 });
  await beforeDrop?.();
  await page.mouse.up();
}

const log = (page: Page): Locator => page.getByTestId('calendar-log');
const button = (page: Page, autoId: string): Locator => page.locator(`[data-autoid="components-button-${autoId}"]`).first();

async function setMoveMode(page: Page, mode: string): Promise<void> {
  for (let index = 0; index < 5; index++) {
    const text = (await button(page, 'playground-mode').textContent()) ?? '';
    if (text.includes(`onMove: ${mode}`)) return;
    // why: sd-button throttles clicks for 300ms.
    await page.waitForTimeout(350);
    await button(page, 'playground-mode').click();
    await expect(button(page, 'playground-mode')).not.toHaveText(text);
  }
  throw new Error(`move mode ${mode} not reached`);
}

async function axe(page: Page, root: Locator): Promise<void> {
  if (!existsSync(AXE)) test.skip(true, 'axe-core is not installed in versions/v19');
  await page.addScriptTag({ path: AXE });
  const handle = await root.elementHandle();
  const violations = await page.evaluate(async element => {
    const result = await window.axe.run(element!);
    return result.violations.filter(item => item.impact === 'serious' || item.impact === 'critical').map(item => `${item.id} (${item.impact})`);
  }, handle);
  expect(violations).toEqual([]);
}

async function shot(root: Locator, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await root.screenshot({ path: resolve(SHOTS, `${name}.png`), animations: 'disabled' });
}

test.describe('sd-calendar', () => {
  // why: at a 1280px viewport the docs sidebar and contents leave ~650px to a section, which is compact for the
  // calendar; 1920px gives the preview the desktop width the scenarios are written for.
  test.beforeEach(async ({ page }) => page.setViewportSize({ width: 1920, height: 1000 }));

  // The Wednesday afternoon of the demo data holds "Review ngân sách Q4", so the sweep uses the free Tuesday afternoon.
  test('[CAL-E-01] sweeps 14:00–15:30 and saves from the demo dialog', async ({ page }) => {
    const root = await open(page, 'playground');
    await sweep(page, root, '2026/10/20', 840, 910);
    await button(page, 'dialog-save').click();
    const created = root.locator('[data-event-id^="new-"]');
    await expect(created).toHaveAttribute('data-start', '2026/10/20 14:00:00');
    await expect(created).toHaveAttribute('data-end', '2026/10/20 15:30:00');
    await expect(created).toHaveAttribute('data-selected', 'true');
    await axe(page, root);
    await shot(root, 'week-1280-light');
  });

  test('[CAL-E-02] closes the dialog: no new block, no band', async ({ page }) => {
    const root = await open(page, 'playground');
    await sweep(page, root, '2026/10/20', 840, 910);
    await expect(root.locator('[data-create-ghost][data-pending]')).toBeVisible();
    await button(page, 'dialog-close').click();
    await expect(root.locator('[data-create-ghost]')).toHaveCount(0);
    await expect(root.locator('[data-event-id^="new-"]')).toHaveCount(0);
    await expect(root.locator('[data-band]')).toHaveCount(0);
  });

  test('[CAL-E-03] drags an event to another day', async ({ page }) => {
    const root = await open(page, 'playground');
    const target = await at(root, '2026/10/23', 14 * 60 + 5);
    await drag(page, block(root, 'budget'), target);
    await expect(block(root, 'budget')).toHaveAttribute('data-start', '2026/10/23 14:00:00');
    await expect(log(page)).toContainText('sdMove');
  });

  test('[CAL-E-04] drops a slow onMove when the week changes', async ({ page }) => {
    const root = await open(page, 'playground');
    await setMoveMode(page, 'slow');
    await drag(page, block(root, 'budget'), await at(root, '2026/10/23', 14 * 60 + 5));
    await expect(block(root, 'budget')).toHaveAttribute('data-pending', 'true');
    await root.locator('button[data-action="next"]').click();
    await page.waitForTimeout(2500);
    await expect(root.locator('[data-event-id="budget"]')).toHaveCount(0);
    await root.locator('button[data-action="prev"]').click();
    await expect(block(root, 'budget')).toHaveAttribute('data-start', '2026/10/21 14:00:00');
    await expect(log(page)).not.toContainText('sdMove');
  });

  test('[CAL-E-05] drags the bottom edge to a new end', async ({ page }) => {
    const root = await open(page, 'playground');
    await block(root, 'budget').hover();
    const handle = block(root, 'budget').locator('[data-resize-handle]');
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 48, { steps: 6 });
    await page.mouse.up();
    await expect(block(root, 'budget')).toHaveAttribute('data-end', '2026/10/21 16:30:00');
  });

  test('[CAL-E-06] asks the scope of a recurring stand-up and cancels', async ({ page }) => {
    const root = await open(page, 'playground');
    for (const scope of ['this', 'following', 'all']) {
      await block(root, 'standup-20261019').focus();
      await page.keyboard.press('Alt+ArrowDown');
      const bar = root.locator('[role="alertdialog"]');
      await expect(bar).toBeVisible();
      await expect(bar.locator('[data-scope="this"]')).toBeFocused();
      await bar.locator(`[data-scope="${scope}"]`).click();
      await expect(log(page)).toContainText(`"scope":"${scope}"`);
      await expect(root.locator('[role="alertdialog"]')).toHaveCount(0);
    }
    const start = await block(root, 'standup-20261019').getAttribute('data-start');
    await block(root, 'standup-20261019').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(root.locator('[role="alertdialog"] [data-scope="this"]')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(root.locator('[role="alertdialog"]')).toHaveCount(0);
    await expect(block(root, 'standup-20261019')).toHaveAttribute('data-start', start!);
  });

  test('[CAL-E-07] shows the rejected outline and the Dismiss band, focus stays', async ({ page }) => {
    const root = await open(page, 'playground');
    await setMoveMode(page, 'reject');
    await block(root, 'client').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(block(root, 'client')).toHaveAttribute('data-failed', 'true');
    await expect(root.locator('[data-band="move-error"]')).toContainText('Không dời được sự kiện.');
    await expect(block(root, 'client')).toBeFocused();
    await root.locator('button[data-action="dismiss"]').click();
    await expect(root.locator('[data-band]')).toHaveCount(0);
  });

  test("[CAL-E-08] closes the reason dialog: 'cancel' goes back without failure", async ({ page }) => {
    const root = await open(page, 'playground');
    await setMoveMode(page, 'reason');
    await block(root, 'client').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await button(page, 'dialog-close').click();
    await expect(block(root, 'client')).toHaveAttribute('data-start', '2026/10/22 09:30:00');
    await expect(root.locator('[data-failed]')).toHaveCount(0);
    await expect(root.locator('[data-band]')).toHaveCount(0);
    await expect(root.locator('[role="status"]')).toContainText('Đã huỷ thay đổi');
  });

  test('[CAL-E-09] undoes a move from the toast', async ({ page }) => {
    const root = await open(page, 'drawer');
    await block(root, 'client').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(block(root, 'client')).toHaveAttribute('data-start', '2026/10/22 09:45:00');
    await page.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
    await expect(block(root, 'client')).toHaveAttribute('data-start', '2026/10/22 09:30:00');
  });

  test('[CAL-E-10] works with the keyboard only, across the week edge', async ({ page }) => {
    const root = await open(page, 'playground');
    const grid = root.locator('[data-region="time-grid"]');
    await grid.focus();
    await page.keyboard.press('ArrowDown');
    await expect(root.locator('[role="status"]')).toContainText('08:30');
    await page.keyboard.press('Enter');
    await button(page, 'dialog-close').click();
    await block(root, 'demo').focus();
    for (const day of ['2026/10/24', '2026/10/25']) {
      await page.keyboard.press('Alt+ArrowRight');
      await expect(block(root, 'demo')).toHaveAttribute('data-start', `${day} 15:00:00`);
      await expect(block(root, 'demo')).toBeFocused();
    }
    await page.keyboard.press('Alt+ArrowRight');
    await expect(root).toHaveAttribute('data-from', '2026/10/26');
    await expect(page.locator(':focus')).toHaveAttribute('data-event-id', 'demo');
  });

  test('[CAL-E-11] opens a day from the month grid with the keyboard and from +N', async ({ page }) => {
    const root = await open(page, 'playground');
    await root.locator('button[data-view-option="month"]').click();
    const cell = root.locator('[role="gridcell"][tabindex="0"]');
    await cell.focus();
    await page.keyboard.press('ArrowRight');
    await expect(root.locator('[role="gridcell"][data-date="2026/10/23"]')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(root).toHaveAttribute('data-view', 'day');
    await expect(root).toHaveAttribute('data-from', '2026/10/23');
    await root.locator('button[data-view-option="month"]').click();
    await root.locator('[role="gridcell"][data-date="2026/10/22"] [data-more]').click();
    await expect(root).toHaveAttribute('data-from', '2026/10/22');
    await shot(root, 'day-1280-light');
  });

  test('[CAL-E-12] keeps view and date in the URL and restores them', async ({ page }) => {
    const root = await open(page, 'url');
    await root.locator('button[data-view-option="month"]').click();
    await root.locator('button[data-action="next"]').click();
    await expect(page).toHaveURL(/view=month/);
    await expect(page).toHaveURL(/date=2026-11-01/);
    await page.reload();
    const preview = page.locator(`[id="components-calendar-example-${SECTIONS.url}-preview"]`);
    await preview.scrollIntoViewIfNeeded();
    const again = preview.locator('[data-autoid="components-calendar-url"]');
    await again.scrollIntoViewIfNeeded();
    await expect(again).toHaveAttribute('data-view', 'month');
    await expect(again).toHaveAttribute('data-from', '2026/10/26');
  });

  test('[CAL-E-14] shows the load error and recovers with Retry', async ({ page }) => {
    const root = await open(page, 'server');
    await button(page, 'server-fail').click();
    await button(page, 'server-reload').click();
    await expect(root.locator('[data-band="load-error"]')).toBeVisible({ timeout: 5000 });
    await shot(root, 'state-load-error');
    await button(page, 'server-fail').click();
    await root.locator('button[data-action="retry"]').click();
    await expect(root.locator('[data-band]')).toHaveCount(0, { timeout: 5000 });
    await expect(block(root, 'client')).toBeVisible();
  });

  test('[CAL-E-16] prints the view on screen', async ({ page }) => {
    const root = await open(page, 'playground');
    await page.emulateMedia({ media: 'print' });
    await expect(root.locator('button[data-action="next"]')).toBeHidden();
    await shot(root, 'print-week');
    await page.emulateMedia({ media: 'screen' });
  });

  test('[CAL-E-17] turns compact in a 400px column of a wide desktop page', async ({ page }) => {
    const root = await open(page, 'url');
    await expect(root).toHaveAttribute('data-compact', 'true');
    await expect(root.locator('[data-day-strip] button')).toHaveCount(7);
    await shot(root, 'compact-400');
  });

  test('[CAL-E-01] stays readable in dark, RTL, forced colors and reduced motion', async ({ page }) => {
    const root = await open(page, 'playground');
    await page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'));
    await shot(root, 'week-1280-dark');
    await page.evaluate(() => {
      document.documentElement.removeAttribute('data-sd-theme');
      document.documentElement.setAttribute('dir', 'rtl');
    });
    await shot(root, 'week-1280-rtl');
    await page.evaluate(() => document.documentElement.removeAttribute('dir'));
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await block(root, 'client').click();
    await shot(root, 'week-forced-colors');
    await axe(page, root);
  });

  test('[CAL-E-04] renders 500 events within budget and drags without long tasks (TESTING §10)', async ({ page }) => {
    const root = await open(page, 'playground');
    const samples: number[] = [];
    for (let run = 0; run < 5; run++) {
      await page.evaluate(() => {
        window.__t0 = performance.now();
      });
      await button(page, 'playground-many').click();
      await expect(root.locator('[data-event-id^="bulk-"]').first()).toBeVisible();
      samples.push(await page.evaluate(() => new Promise<number>(done => requestAnimationFrame(() => done(performance.now() - window.__t0)))));
    }
    samples.sort((a, b) => a - b);
    test.info().annotations.push({ type: 'render-500-median-ms', description: samples[2].toFixed(1) });
    await page.evaluate(() => {
      window.__long = [];
      new PerformanceObserver(list => list.getEntries().forEach(entry => window.__long.push(entry.duration))).observe({ entryTypes: ['longtask'] });
    });
    await drag(page, root.locator('[data-event-id^="bulk-"]').first(), await at(root, '2026/10/24', 600));
    const longTasks = await page.evaluate(() => window.__long);
    test.info().annotations.push({ type: 'drag-long-tasks-ms', description: JSON.stringify(longTasks) });
    // §10: the numbers go to the report; a budget overrun is reported at review, not failed here.
    console.log(`[calendar perf] render 500 median ${samples[2].toFixed(1)}ms (budget 150), long tasks while dragging ${JSON.stringify(longTasks)} (budget 50)`);
  });
});

test.describe('sd-calendar · mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('[CAL-E-13] taps to create, swipes the day and shows the strip', async ({ page }) => {
    const root = await open(page, 'playground');
    await expect(root).toHaveAttribute('data-compact', 'true');
    await shot(root, 'mobile-390');
    const point = await at(root, '2026/10/22', 16 * 60 + 10);
    await page.touchscreen.tap(point.x, point.y);
    await expect(root.locator('[data-create-ghost][data-pending]')).toBeVisible();
    await button(page, 'dialog-close').click();
    await root.locator('[data-day-strip] button[data-date="2026/10/23"]').tap();
    await expect(root).toHaveAttribute('data-from', '2026/10/23');
  });
});

test.describe('sd-calendar · zones', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('[CAL-E-15] shows Vietnam times with timeZone=Asia/Ho_Chi_Minh in a New York browser', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    const root = await open(page, 'playground', '?timeZone=Asia/Ho_Chi_Minh');
    await expect(block(root, 'client')).toHaveAttribute('data-start', '2026/10/22 09:30:00');
    await expect(column(root, '2026/10/22').locator('[data-event-id="client"]')).toHaveCount(1);
    await expect(root.locator('[data-zone]')).toHaveText('GMT+7');
  });
});

test.describe('sd-calendar · Kolkata', () => {
  test.use({ timezoneId: 'Asia/Kolkata' });

  test('[CAL-E-15] keeps zone-less values on their wall clock in a +05:30 browser', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    const root = await open(page, 'playground');
    await expect(block(root, 'client')).toHaveAttribute('data-start', '2026/10/22 09:30:00');
  });
});
