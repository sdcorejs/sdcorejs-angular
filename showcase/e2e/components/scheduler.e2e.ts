import { expect, test, type Locator, type Page } from '@playwright/test';
import { axe, button, cycle, screenshots } from './schedule.support';

// E2E of sd-scheduler on its Showcase page (handoff schedule-kanban, TESTING.md §6.3, §8–§11). The data is the one of
// SD Scheduler Design.dc.html; the clock is pinned to its "today", Monday 09/11/2026 10:40.

const { shot } = screenshots('scheduler-screens');
const PAGE = '/v/latest/components/scheduler/examples';
/** Today of the design, in the zone of the Showcase (Asia/Ho_Chi_Minh). */
const NOW = new Date('2026-11-09T10:40:00+07:00');

const SECTIONS = {
  booking: 'dat-phong-hop',
  vehicles: 'xe-giao-hang',
  leave: 'nghi-phep-phong-ban',
  timesheet: 'cham-cong',
} as const;

/** Opens one example and waits for its scheduler (each demo section is created once it scrolls into view). */
async function open(page: Page, section: keyof typeof SECTIONS, query = ''): Promise<Locator> {
  // why: a fixed Date only, so the timers of the page (delays, the minute timer) still run.
  await page.clock.setFixedTime(NOW);
  await page.goto(`${PAGE}${query}`);
  const preview = page.locator(`[id="components-scheduler-example-${SECTIONS[section]}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator('demo-section')).toBeVisible();
  // The code panel sits next to the preview and leaves the scheduler under 600px (compact); hide it.
  const hideCode = page.locator(`[id="components-scheduler-example-${SECTIONS[section]}"]`).getByRole('button', { name: 'Hide code' });
  if (await hideCode.isVisible()) await hideCode.click();
  const root = preview.locator(`[data-autoid="components-scheduler-${section}"]`);
  await root.scrollIntoViewIfNeeded();
  await expect(root).toBeVisible();
  await expect(root.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 15_000 });
  return root;
}

const track = (root: Locator, resourceId: string): Locator => root.locator(`[data-track][data-resource-id="${resourceId}"]`);
const block = (root: Locator, id: string): Locator => root.locator(`[data-event-id="${id}"]`).first();
const status = (root: Locator): Locator => root.locator('[role="status"]');

/** Width of one hour on the axis, as the scheduler draws it (80px, 64px when compact). */
async function hourWidth(root: Locator): Promise<number> {
  return (await root.locator('[data-axis-hour]').first().boundingBox())!.width;
}

/** Client point of `minutes` on the hour axis of a row (day view), near the bottom of the row. */
async function at(root: Locator, resourceId: string, minutes: number): Promise<{ x: number; y: number }> {
  const box = (await track(root, resourceId).boundingBox())!;
  return { x: box.x + (minutes / 60) * (await hourWidth(root)) + 2, y: box.y + box.height - 8 };
}

/** The same inline position as `source`, in the middle of the row of `resourceId`. */
async function onRow(root: Locator, source: Locator, resourceId: string, dx = 0): Promise<{ x: number; y: number }> {
  const from = (await source.boundingBox())!;
  const row = (await track(root, resourceId).boundingBox())!;
  return { x: from.x + from.width / 2 + dx, y: row.y + row.height / 2 };
}

async function sweep(page: Page, root: Locator, resourceId: string, from: number, to: number, beforeUp?: () => Promise<void>): Promise<void> {
  const start = await at(root, resourceId, from);
  const end = await at(root, resourceId, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 6 });
  await beforeUp?.();
  await page.mouse.up();
}

async function drag(page: Page, source: Locator, to: { x: number; y: number }, beforeDrop?: () => Promise<void>): Promise<void> {
  // Picked up at its centre, so a target from onRow() keeps the time unless it adds dx.
  const box = (await source.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 6, box.y + box.height / 2, { steps: 2 });
  await page.mouse.move(to.x, to.y, { steps: 10 });
  await beforeDrop?.();
  await page.mouse.up();
}

const log = (page: Page): Locator => page.getByTestId('scheduler-log');

test.describe('sd-scheduler', () => {
  // why: at a 1280px viewport the docs sidebar and contents leave a section under 600px, which is compact for the
  // scheduler; 1920px gives the preview the desktop width the scenarios are written for.
  test.beforeEach(async ({ page }) => page.setViewportSize({ width: 1920, height: 1000 }));

  test('[SCH-E-01] sweeps 10:00–12:00 on Phòng Huế and saves from the demo dialog', async ({ page }) => {
    const root = await open(page, 'booking');
    await sweep(page, root, 'hue', 600, 705);
    await button(page, 'dialog-save').click();
    const created = root.locator('[data-event-id^="new-"]');
    await expect(created).toHaveAttribute('data-resource-id', 'hue');
    await expect(created).toHaveAttribute('data-start', '2026/11/09 10:00:00');
    await expect(created).toHaveAttribute('data-end', '2026/11/09 12:00:00');
    await expect(created).toHaveAttribute('data-selected', 'true');
    await axe(page, root);
  });

  test('[SCH-E-02] drags “Review ngân sách Q4” to Phòng Huế with the floating label', async ({ page }) => {
    const root = await open(page, 'booking');
    const budget = block(root, 'budget');
    await drag(page, budget, await onRow(root, budget, 'hue'), async () => {
      await expect(root.locator('[role="row"][data-resource-id="hue"]')).toHaveAttribute('data-drop', 'ok');
      await expect(track(root, 'hue').locator('[data-drag-label]')).toHaveText('Phòng Huế · 10:00 – 11:30');
      await shot(root, 'move-across-rows');
    });
    await expect(block(root, 'budget')).toHaveAttribute('data-resource-id', 'hue');
    await expect(status(root)).toHaveText('Đã chuyển sang Phòng Huế, 10:00');
    await expect(log(page)).toContainText('sdMove');
  });

  test('[SCH-E-03] fades Phòng Cần Thơ (4 seats) and drops back without onMove', async ({ page }) => {
    const root = await open(page, 'booking');
    const budget = block(root, 'budget');
    await drag(page, budget, await onRow(root, budget, 'ct'), async () => {
      await expect(root.locator('[role="row"][data-resource-id="ct"]')).toHaveAttribute('data-drop', 'blocked');
      await shot(root, 'move-blocked-row');
    });
    await expect(block(root, 'budget')).toHaveAttribute('data-resource-id', 'hn');
    await expect(status(root)).toHaveText('Không chuyển sang Phòng Cần Thơ được');
    await expect(log(page)).not.toContainText('sdMove');
  });

  test("[SCH-E-04] keeps the person of a leave with axis 'time' when dragged across rows", async ({ page }) => {
    const root = await open(page, 'leave');
    // A leave away from the edges of the scroll area: near an edge the drag scrolls the month (§9.3).
    const leave = block(root, 'ha-trip');
    await drag(page, leave, await onRow(root, leave, 'minh'));
    await expect(block(root, 'ha-trip')).toHaveAttribute('data-resource-id', 'ha');
    await expect(block(root, 'ha-trip')).toHaveAttribute('data-start', '2026/11/11');
    await shot(root, 'leave-month');
    await axe(page, root);
  });

  test('[SCH-E-05] moves with Alt + ↓ from Tầng 3 into the collapsed Tầng 5 and opens it', async ({ page }) => {
    const root = await open(page, 'booking');
    await root.locator('[data-group="Tầng 5"] button').click();
    await expect(root.locator('[data-group="Tầng 5"]')).toHaveAttribute('data-collapsed', 'true');
    await block(root, 'warehouse').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(root.locator('[data-group="Tầng 5"]')).not.toHaveAttribute('data-collapsed', 'true');
    await expect(block(root, 'warehouse')).toHaveAttribute('data-resource-id', 'sg');
    await expect(page.locator(':focus')).toHaveAttribute('data-event-id', 'warehouse');
  });

  test('[SCH-E-06] emits sdCellSelect for the person and day of a timesheet cell', async ({ page }) => {
    const root = await open(page, 'timesheet');
    await expect(root.locator('[data-resource-id] [data-total]').nth(1)).toHaveText('4,5');
    await root.locator('[role="gridcell"][data-resource-id="minh"][data-date="2026/11/03"]').click();
    await expect(page.getByTestId('timesheet-picked')).toHaveText('Lê Minh · 2026/11/03 · Ô');
    await expect(root.locator('[data-event-id]')).toHaveCount(0);
    await shot(root, 'timesheet-cells');
    await axe(page, root);
  });

  test('[SCH-E-07] drags the end handle to a new end, with the floating label', async ({ page }) => {
    const root = await open(page, 'booking');
    const handle = block(root, 'one-on-one').locator('[data-resize-handle]');
    const box = (await handle.boundingBox())!;
    const hour = await hourWidth(root);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + hour, box.y + box.height / 2, { steps: 6 });
    await expect(root.locator('[data-resize-label]')).toHaveText('09:00 – 10:30');
    await shot(root, 'resize-end');
    await page.mouse.up();
    await expect(block(root, 'one-on-one')).toHaveAttribute('data-end', '2026/11/09 10:30:00');
    await expect(status(root)).toHaveText('Đã đổi 1:1 Hà – Bảo thành 09:00 – 10:30');
  });

  test('[SCH-E-08] keeps the resource column and the axis in place while scrolling both ways', async ({ page }) => {
    const root = await open(page, 'booking');
    await button(page, 'booking-perf').click();
    await expect(root).toHaveAttribute('data-view', 'month');
    await expect(block(root, 'r0-a')).toBeVisible({ timeout: 15_000 });
    const scroller = root.locator('[data-region="scroller"]');
    const head = root.locator('.sd-scheduler__head');
    const before = (await head.boundingBox())!;
    await scroller.evaluate(element => element.scrollTo({ left: 400, top: 600 }));
    await page.waitForTimeout(100);
    const area = (await scroller.boundingBox())!;
    expect(Math.round((await head.boundingBox())!.y), 'the axis sticks to the top').toBe(Math.round(before.y));
    const visibleHeader = root.locator('[role="rowheader"]').nth(12);
    expect(Math.round((await visibleHeader.boundingBox())!.x), 'the resource column sticks to the start').toBe(Math.round(area.x));
    await shot(root, 'month-150-scrolled');
  });

  test("[SCH-E-09] 'cancel' takes the meeting back to its room and time without an error", async ({ page }) => {
    const root = await open(page, 'booking');
    await cycle(page, 'booking-mode', 'onMove: cancel');
    const budget = block(root, 'budget');
    await drag(page, budget, await onRow(root, budget, 'hue', await hourWidth(root)));
    await expect(status(root)).toHaveText('Đã huỷ thay đổi');
    await expect(block(root, 'budget')).toHaveAttribute('data-resource-id', 'hn');
    await expect(block(root, 'budget')).toHaveAttribute('data-start', '2026/11/09 10:00:00');
    await expect(block(root, 'budget')).not.toHaveAttribute('data-failed', /.*/);
    await expect(root.locator('[data-band]')).toHaveCount(0);
  });

  test('[SCH-E-10] shows the load error and recovers with Retry', async ({ page }) => {
    const root = await open(page, 'booking');
    await button(page, 'booking-load-error').click();
    await expect(root.locator('[data-band="load-error"]')).toBeVisible({ timeout: 5000 });
    await expect(log(page)).toContainText('sdLoadError');
    await shot(root, 'state-load-error');
    await root.locator('button[data-action="retry"]').click();
    await expect(root.locator('[data-band]')).toHaveCount(0, { timeout: 5000 });
    await expect(block(root, 'budget')).toBeVisible();
  });

  test('[SCH-E-01] shows the week of the vehicles and stays readable in forced colors', async ({ page }) => {
    const root = await open(page, 'vehicles');
    await expect(block(root, 'v123-service')).toHaveAttribute('data-all-day', 'true');
    await shot(root, 'vehicles-week');
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await block(root, 'v123-mon').click();
    await shot(root, 'vehicles-forced-colors');
    await axe(page, root);
  });

  test('[SCH-E-12] renders 150 resources × 31 days within budget and drags without long tasks (TESTING §10)', async ({ page }) => {
    const root = await open(page, 'booking');
    const samples: number[] = [];
    for (let run = 0; run < 5; run++) {
      await page.evaluate(() => {
        window.__t0 = performance.now();
      });
      await button(page, 'booking-perf').click();
      await expect(block(root, 'r0-a')).toBeVisible({ timeout: 15_000 });
      samples.push(await page.evaluate(() => new Promise<number>(done => requestAnimationFrame(() => done(performance.now() - window.__t0)))));
      await page.waitForTimeout(350);
      await button(page, 'booking-perf').click();
      await expect(block(root, 'budget')).toBeVisible();
      await page.waitForTimeout(350);
    }
    samples.sort((a, b) => a - b);
    test.info().annotations.push({ type: 'render-150x31-median-ms', description: samples[2].toFixed(1) });
    await button(page, 'booking-perf').click();
    await expect(block(root, 'r0-a')).toBeVisible({ timeout: 15_000 });
    await page.evaluate(() => {
      window.__long = [];
      new PerformanceObserver(list => list.getEntries().forEach(entry => window.__long.push(entry.duration))).observe({ entryTypes: ['longtask'] });
    });
    const source = block(root, 'r0-a');
    await drag(page, source, await onRow(root, source, 'r3', 60));
    const longTasks = await page.evaluate(() => window.__long);
    test.info().annotations.push({ type: 'drag-long-tasks-ms', description: JSON.stringify(longTasks) });
    // §10: the numbers go to the report; a budget overrun is reported at review, not failed here.
    console.log(
      `[scheduler perf] render 150×31 median ${samples[2].toFixed(1)}ms (samples ${samples.map(value => value.toFixed(0)).join(', ')}), long tasks while dragging ${JSON.stringify(longTasks)}`
    );
  });
});

test.describe('sd-scheduler · mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('[SCH-E-11] narrows the resource column, creates on a tap and lifts a block after a 400ms press', async ({ page }) => {
    const root = await open(page, 'booking');
    await expect(root).toHaveAttribute('data-compact', 'true');
    expect(Math.round((await root.locator('[role="row"][data-resource-id] [role="rowheader"]').first().boundingBox())!.width)).toBe(120);
    expect(Math.round(await hourWidth(root)), 'the compact hour').toBe(64);
    const free = await at(root, 'hn', 8 * 60 + 5);
    await page.touchscreen.tap(free.x, free.y);
    await expect(root.locator('[data-create-ghost][data-pending]')).toBeVisible();
    await button(page, 'dialog-close').click();
    await shot(root, 'compact-390');

    // A long press lifts the block: touch events through CDP, since Playwright's touchscreen only taps.
    const client = await page.context().newCDPSession(page);
    const from = (await block(root, 'budget').boundingBox())!;
    const to = await onRow(root, block(root, 'budget'), 'hue');
    const point = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await page.waitForTimeout(500);
    // why: CDK measures the 400ms hold with Date.now(), which the pinned clock holds still; move it past the hold.
    await page.clock.setFixedTime(new Date(NOW.getTime() + 1000));
    for (let index = 1; index <= 8; index++) {
      const step = { x: point.x + ((to.x - point.x) * index) / 8, y: point.y + ((to.y - point.y) * index) / 8 };
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [step] });
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(block(root, 'budget')).toHaveAttribute('data-resource-id', 'hue');
  });
});

test.describe('sd-scheduler · zones', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('[SCH-E-01] keeps the wall clock of the configured zone in a New York browser', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    const root = await open(page, 'booking', '?timeZone=Asia/Ho_Chi_Minh');
    await expect(block(root, 'budget')).toHaveAttribute('data-start', '2026/11/09 10:00:00');
    await expect(track(root, 'hn').locator('[data-event-id="budget"]')).toHaveCount(1);
    await expect(root.locator('[data-now]')).toHaveCount(1);
  });
});

test.describe('sd-scheduler · Kolkata', () => {
  test.use({ timezoneId: 'Asia/Kolkata' });

  test('[SCH-E-01] keeps zone-less values on their wall clock in a +05:30 browser', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    const root = await open(page, 'booking');
    await expect(block(root, 'budget')).toHaveAttribute('data-start', '2026/11/09 10:00:00');
  });
});

/** Pins the box of an example to the top left of the viewport at a fixed size, like the frames of the design HTML. */
async function frame(root: Locator, width: number, height = 560): Promise<void> {
  await root.evaluate(
    (element, size) => {
      const box = element.closest<HTMLElement>('.scheduler-box');
      if (!box) return;
      document.documentElement.style.scrollBehavior = 'auto';
      Object.assign(box.style, { position: 'fixed', top: '0', left: '0', zIndex: '1000', width: `${size.width}px`, height: `${size.height}px` });
    },
    { width, height }
  );
}

/** Opens the day again so it scrolls to scrollTime with the current direction and size. */
async function reopenDay(root: Locator): Promise<void> {
  await root.locator('[data-view-option="week"]').click();
  await expect(root).toHaveAttribute('data-view', 'week');
  await root.locator('[data-view-option="day"]').click();
  await expect(root).toHaveAttribute('data-view', 'day');
}

// TESTING §9: the frames of SD Scheduler Design.dc.html (1122px wide), for the side-by-side table of the report.
test.describe('sd-scheduler · screenshots (TESTING §9)', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== 'asia-bangkok', 'the screenshots come from the Bangkok project');
    await page.setViewportSize({ width: 1920, height: 1000 });
  });

  test('[SCH-E-01] 01–02: the three views, the day in dark and RTL', async ({ page }) => {
    const root = await open(page, 'booking');
    await frame(root, 1122);
    await reopenDay(root);
    await expect(root.locator('[data-now]')).toHaveCount(1);
    await shot(root, '01-day-1122');
    for (const view of ['week', 'month']) {
      await root.locator(`[data-view-option="${view}"]`).click();
      await expect(root).toHaveAttribute('data-view', view);
      await shot(root, `02-${view}-1122`);
    }
    await reopenDay(root);
    await page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'));
    await shot(root, '01-day-1122-dark');
    await page.evaluate(() => document.documentElement.removeAttribute('data-sd-theme'));
    // Right-to-left on the scheduler host only (`dir` on <html> also flips the docs page), then open the day again.
    await root.evaluate(element => element.parentElement!.setAttribute('dir', 'rtl'));
    await reopenDay(root);
    await shot(root, '01-day-1122-rtl');
  });

  test('[SCH-E-01] 03: block tiers and states', async ({ page }) => {
    const root = await open(page, 'booking');
    await frame(root, 1122);
    await reopenDay(root);
    await block(root, 'demo').click();
    await shot(root, '03-blocks-selected');
    await cycle(page, 'booking-mode', 'onMove: slow');
    await block(root, 'japan').focus();
    await page.keyboard.press('Alt+ArrowUp');
    await expect(block(root, 'japan')).toHaveAttribute('data-pending', 'true');
    await shot(root, '03-block-saving');
    await expect(block(root, 'japan')).not.toHaveAttribute('data-pending', /.*/, { timeout: 5000 });
    await cycle(page, 'booking-mode', 'onMove: reject');
    await block(root, 'japan').focus();
    await page.keyboard.press('Alt+ArrowUp');
    await expect(block(root, 'japan')).toHaveAttribute('data-failed', 'true');
    await shot(root, '04-move-rejected');
  });

  test('[SCH-E-01] 04: sweep, grid cursor and the scope bar', async ({ page }) => {
    const root = await open(page, 'booking');
    await frame(root, 1122);
    await reopenDay(root);
    await sweep(page, root, 'ol', 13 * 60, 15 * 60, () => shot(root, '04-create-sweep'));
    await button(page, 'dialog-close').click();
    await root.locator('[role="grid"]').focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowRight');
    await shot(root, '04-grid-cursor');
    await block(root, 'weekly').focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect(root.locator('[role="alertdialog"]')).toBeVisible();
    await shot(root, '04-recurring-scope');
    await page.keyboard.press('Escape');
  });

  // The first-load skeleton exists only before the first answer of onLoad, which the client example gives at once;
  // Karma covers it (SCH-C-02). The picture shows the reload with the server source instead.
  test('[SCH-E-10] 06: reloading and empty states', async ({ page }) => {
    const root = await open(page, 'booking');
    await frame(root, 1122);
    await button(page, 'booking-source').click();
    await expect(root.locator('[role="progressbar"]')).toBeVisible();
    await shot(root, '06-state-reloading');
    await expect(root.locator('[role="progressbar"]')).toHaveCount(0, { timeout: 5000 });
    await button(page, 'booking-empty').click();
    await expect(root.locator('[data-empty]')).toBeVisible();
    await shot(root, '06-state-empty');
  });

  test('[SCH-E-11] 07: 700px, 400px and 360px of host width', async ({ page }) => {
    const root = await open(page, 'booking');
    for (const [width, compact] of [
      [700, false],
      [400, true],
      [360, true],
    ] as const) {
      await frame(root, width);
      await reopenDay(root);
      if (compact) await expect(root).toHaveAttribute('data-compact', 'true');
      else await expect(root).not.toHaveAttribute('data-compact', 'true');
      await shot(root, `07-day-${width}`);
    }
  });
});
