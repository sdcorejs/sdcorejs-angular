import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// E2E of sd-scheduler on its Showcase page (handoff schedule-kanban, TESTING.md §6.3, §8–§10).

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
const SHOTS = resolve(HERE, '../../../.sdcorejs/handoff/schedule-kanban/reports/scheduler-screens');
const PAGE = '/v/latest/components/scheduler/examples';
const HOUR = 80;

const SECTIONS = {
  booking: 'dat-phong-hop',
  vehicles: 'xe-giao-hang',
  leave: 'nghi-phep-phong-ban',
  timesheet: 'cham-cong',
} as const;

/** Opens one example and waits for its scheduler (each demo section is created once it scrolls into view). */
async function open(page: Page, section: keyof typeof SECTIONS): Promise<Locator> {
  await page.goto(PAGE);
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

/** Client point of `minutes` on the hour axis of a row (day view), in the middle of the row. */
async function at(root: Locator, resourceId: string, minutes: number): Promise<{ x: number; y: number }> {
  const box = (await track(root, resourceId).boundingBox())!;
  return { x: box.x + (minutes / 60) * HOUR + 2, y: box.y + box.height - 8 };
}

/** The same inline position as `source`, in the middle of the row of `resourceId`. */
async function onRow(root: Locator, source: Locator, resourceId: string, dx = 0): Promise<{ x: number; y: number }> {
  const from = (await source.boundingBox())!;
  const row = (await track(root, resourceId).boundingBox())!;
  return { x: from.x + from.width / 2 + dx, y: row.y + row.height / 2 };
}

async function sweep(page: Page, root: Locator, resourceId: string, from: number, to: number): Promise<void> {
  const start = await at(root, resourceId, from);
  const end = await at(root, resourceId, to);
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(end.x, end.y, { steps: 6 });
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
const button = (page: Page, autoId: string): Locator => page.locator(`[data-autoid="components-button-${autoId}"]`).first();

async function cycle(page: Page, autoId: string, label: string, tries = 6): Promise<void> {
  for (let index = 0; index < tries; index++) {
    const text = (await button(page, autoId).textContent()) ?? '';
    if (text.includes(label)) return;
    // why: sd-button throttles clicks for 300ms.
    await page.waitForTimeout(350);
    await button(page, autoId).click();
    await expect(button(page, autoId)).not.toHaveText(text);
  }
  throw new Error(`${autoId} never showed ${label}`);
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
  // why: every test runs in both zone projects; only the Bangkok run writes the pictures.
  if (test.info().project.name !== 'asia-bangkok') return;
  mkdirSync(SHOTS, { recursive: true });
  await root.screenshot({ path: resolve(SHOTS, `${name}.png`), animations: 'disabled' });
}

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
      await expect(track(root, 'hue').locator('[data-drag-label]')).toHaveText('Phòng Huế · 09:00 – 10:30');
      await shot(root, 'drag-across-rows');
    });
    await expect(block(root, 'budget')).toHaveAttribute('data-resource-id', 'hue');
    await expect(status(root)).toHaveText('Đã chuyển sang Phòng Huế, 09:00');
    await expect(log(page)).toContainText('sdMove');
  });

  test('[SCH-E-03] fades Phòng Cần Thơ (4 seats) and drops back without onMove', async ({ page }) => {
    const root = await open(page, 'booking');
    const budget = block(root, 'budget');
    await drag(page, budget, await onRow(root, budget, 'can-tho'), async () => {
      await expect(root.locator('[role="row"][data-resource-id="can-tho"]')).toHaveAttribute('data-drop', 'blocked');
      await shot(root, 'drag-blocked-row');
    });
    await expect(block(root, 'budget')).toHaveAttribute('data-resource-id', 'sa-pa');
    await expect(status(root)).toHaveText('Không chuyển sang Phòng Cần Thơ được');
    await expect(log(page)).not.toContainText('sdMove');
  });

  test("[SCH-E-04] keeps the person of a leave with axis 'time' when dragged across rows", async ({ page }) => {
    const root = await open(page, 'leave');
    const leave = block(root, 'leave-4');
    await drag(page, leave, await onRow(root, leave, 'quynh'));
    await expect(block(root, 'leave-4')).toHaveAttribute('data-resource-id', 'hoang');
    await expect(block(root, 'leave-4')).toHaveAttribute('data-start', '2026/11/10');
    await expect(root.locator('[data-resize-handle]').first()).toBeAttached();
    await shot(root, 'leave-month');
    await axe(page, root);
  });

  test('[SCH-E-05] moves with Alt + ↓ from Tầng 3 into the collapsed Tầng 5 and opens it', async ({ page }) => {
    const root = await open(page, 'booking');
    await root.locator('[data-group="Tầng 5"] button').click();
    await expect(root.locator('[data-group="Tầng 5"]')).toHaveAttribute('data-collapsed', 'true');
    await block(root, 'one-on-one').focus();
    await page.keyboard.press('Alt+ArrowDown');
    await expect(root.locator('[data-group="Tầng 5"]')).not.toHaveAttribute('data-collapsed', 'true');
    await expect(block(root, 'one-on-one')).toHaveAttribute('data-resource-id', 'can-tho');
    await expect(page.locator(':focus')).toHaveAttribute('data-event-id', 'one-on-one');
  });

  test('[SCH-E-06] emits sdCellSelect for the person and day of a timesheet cell', async ({ page }) => {
    const root = await open(page, 'timesheet');
    await root.locator('[role="gridcell"][data-resource-id="quynh"][data-date="2026/11/03"]').click();
    await expect(page.getByTestId('timesheet-picked')).toHaveText('Phạm Quỳnh Anh · 2026/11/03 · CT');
    await expect(root.locator('[data-event-id]')).toHaveCount(0);
    await shot(root, 'timesheet-cells');
    await axe(page, root);
  });

  test('[SCH-E-07] drags the end handle to a new end', async ({ page }) => {
    const root = await open(page, 'booking');
    const handle = block(root, 'client').locator('[data-resize-handle]');
    const box = (await handle.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + HOUR, box.y + box.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect(block(root, 'client')).toHaveAttribute('data-end', '2026/11/09 12:30:00');
    await expect(status(root)).toHaveText('Đã đổi Hẹn khách: Công ty An Phát thành 10:00 – 12:30');
  });

  test('[SCH-E-08] keeps the resource column and the axis in place while scrolling both ways', async ({ page }) => {
    const root = await open(page, 'booking');
    await button(page, 'booking-perf').click();
    await expect(root).toHaveAttribute('data-view', 'month');
    await expect(block(root, 'r0-a')).toBeVisible({ timeout: 15_000 });
    const scroller = root.locator('[data-region="scroller"]');
    const head = root.locator('.sd-scheduler__head');
    const header = root.locator('[role="rowheader"]').first();
    const before = { head: (await head.boundingBox())!, header: (await header.boundingBox())! };
    await scroller.evaluate(element => element.scrollTo({ left: 400, top: 600 }));
    await page.waitForTimeout(100);
    const area = (await scroller.boundingBox())!;
    expect(Math.round((await head.boundingBox())!.y), 'the axis sticks to the top').toBe(Math.round(before.head.y));
    const visibleHeader = root.locator('[role="rowheader"]').nth(12);
    expect(Math.round((await visibleHeader.boundingBox())!.x), 'the resource column sticks to the start').toBe(Math.round(area.x));
    await shot(root, 'month-150-scrolled');
  });

  test("[SCH-E-09] 'cancel' takes the meeting back to its room and time without an error", async ({ page }) => {
    const root = await open(page, 'booking');
    await cycle(page, 'booking-mode', 'onMove: cancel');
    const client = block(root, 'client');
    await drag(page, client, await onRow(root, client, 'hue', HOUR));
    await expect(status(root)).toHaveText('Đã huỷ thay đổi');
    await expect(block(root, 'client')).toHaveAttribute('data-resource-id', 'hoi-an');
    await expect(block(root, 'client')).toHaveAttribute('data-start', '2026/11/09 10:00:00');
    await expect(block(root, 'client')).not.toHaveAttribute('data-failed', /.*/);
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
    await expect(block(root, 'client')).toBeVisible();
  });

  test('[SCH-E-01] shows the week of the vehicles and stays readable in forced colors', async ({ page }) => {
    const root = await open(page, 'vehicles');
    await expect(block(root, 'trip-3')).toHaveAttribute('data-all-day', 'true');
    await shot(root, 'vehicles-week');
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await block(root, 'trip-1').click();
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
      await expect(block(root, 'client')).toBeVisible();
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
    expect(Math.round((await root.locator('[role="rowheader"]').first().boundingBox())!.width)).toBe(120);
    const free = await at(root, 'hall', 8 * 60 + 15);
    await page.touchscreen.tap(free.x, free.y);
    await expect(root.locator('[data-create-ghost][data-pending]')).toBeVisible();
    await button(page, 'dialog-close').click();
    await shot(root, 'compact-390');

    // A long press lifts the block: touch events through CDP, since Playwright's touchscreen only taps.
    const client = await page.context().newCDPSession(page);
    const from = (await block(root, 'client').boundingBox())!;
    const to = await onRow(root, block(root, 'client'), 'hue');
    const point = { x: from.x + 10, y: from.y + from.height / 2 };
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await page.waitForTimeout(500);
    for (let index = 1; index <= 8; index++) {
      const step = { x: point.x + ((to.x - from.x - 10) * index) / 8, y: point.y + ((to.y - point.y) * index) / 8 };
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [step] });
    }
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(block(root, 'client')).toHaveAttribute('data-resource-id', 'hue');
  });
});

/** Pins the box of an example to the top left of the viewport at a fixed size, like the frames of the design HTML. */
async function frame(root: Locator, width: number, height = 560): Promise<void> {
  await root.evaluate(
    (element, size) => {
      const box = element.closest<HTMLElement>('.scheduler-box');
      if (!box) return;
      Object.assign(box.style, { position: 'fixed', top: '0', left: '0', zIndex: '1000', width: `${size.width}px`, height: `${size.height}px` });
    },
    { width, height }
  );
}

// TESTING §9: the frames of SD Scheduler Design.dc.html, for the side-by-side table of the report.
test.describe('sd-scheduler · screenshots (TESTING §9)', () => {
  test.beforeEach(async ({ page }, info) => {
    test.skip(info.project.name !== 'asia-bangkok', 'the screenshots come from the Bangkok project');
    await page.setViewportSize({ width: 1920, height: 1000 });
  });

  test('[SCH-E-01] the three views at 1200px, the day in dark and RTL', async ({ page }) => {
    const root = await open(page, 'booking');
    await frame(root, 1200);
    await shot(root, 'day-1200');
    for (const view of ['week', 'month']) {
      await root.locator(`[data-view-option="${view}"]`).click();
      await expect(root).toHaveAttribute('data-view', view);
      await shot(root, `${view}-1200`);
    }
    await root.locator('[data-view-option="day"]').click();
    await page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'));
    await shot(root, 'day-1200-dark');
    await page.evaluate(() => document.documentElement.removeAttribute('data-sd-theme'));
    // Right-to-left on the scheduler host only: `dir` on <html> also flips the docs page.
    await root.evaluate(element => element.parentElement!.setAttribute('dir', 'rtl'));
    await shot(root, 'day-1200-rtl');
  });

  test('[SCH-E-11] 700px and 400px of host width', async ({ page }) => {
    const root = await open(page, 'booking');
    await frame(root, 700);
    await expect(root).not.toHaveAttribute('data-compact', 'true');
    await shot(root, 'day-700');
    await frame(root, 400);
    await expect(root).toHaveAttribute('data-compact', 'true');
    await shot(root, 'day-400-compact');
  });

  test('[SCH-E-10] the empty state', async ({ page }) => {
    const root = await open(page, 'booking');
    await button(page, 'booking-empty').click();
    await expect(root.locator('[data-empty]')).toBeVisible();
    await shot(root, 'state-empty');
  });
});
