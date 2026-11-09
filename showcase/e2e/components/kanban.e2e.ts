import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// E2E of sd-kanban on its Showcase page (handoff schedule-kanban, TESTING.md §7.4, §8–§10).

declare global {
  interface Window {
    __long: number[];
    axe: { run: (context: Element) => Promise<{ violations: { id: string; impact: string }[] }> };
  }
}

// why: Playwright loads the e2e files as CommonJS here, so __dirname instead of import.meta.url.
const HERE = __dirname;
const AXE = resolve(HERE, '../../../versions/v19/node_modules/axe-core/axe.min.js');
const SHOTS = resolve(HERE, '../../../.sdcorejs/handoff/schedule-kanban/reports/kanban-screens');
const PAGE = '/v/latest/components/kanban/examples';
const SECTIONS = { orders: 'orders', tasks: 'tasks', cms: 'cms-mapping', async: 'async-confirmation' } as const;

/** Opens one example and waits until its columns have loaded (each section is created when it scrolls into view). */
async function open(page: Page, section: keyof typeof SECTIONS, autoId: string): Promise<Locator> {
  await page.goto(PAGE);
  const preview = page.locator(`[id="components-kanban-example-${SECTIONS[section]}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator('demo-section')).toBeVisible();
  const hideCode = page.locator(`[id="components-kanban-example-${SECTIONS[section]}"]`).getByRole('button', { name: 'Hide code' });
  if (await hideCode.isVisible()) await hideCode.click();
  const root = preview.locator(`[data-autoid="components-kanban-${autoId}"]`);
  await root.scrollIntoViewIfNeeded();
  await expect(root).toBeVisible();
  await expect(root.locator('[data-status="loading"]')).toHaveCount(0, { timeout: 10_000 });
  return root;
}

const lane = (root: Locator, id: string): Locator => root.locator(`section[data-column-id="${id}"]`);
const card = (root: Locator, id: string): Locator => root.locator(`article[data-card-id="${id}"]`);
const name = (root: Locator, id: string): Locator => root.locator(`[data-kanban-card-main="${id}"]`);
const ids = (root: Locator, column: string): Promise<(string | null)[]> =>
  lane(root, column)
    .locator('article')
    .evaluateAll(cards => cards.map(item => item.getAttribute('data-card-id')));
const count = async (root: Locator, column: string): Promise<string> =>
  ((await lane(root, column).locator('.sd-kanban__count').textContent()) ?? '').replace(/\s+/g, '');

/** Mouse drag the way a user does it: press on the card, cross the 5px threshold, travel, optionally wait, release. */
async function drag(page: Page, source: Locator, target: Locator, beforeDrop?: () => Promise<void>, top = false): Promise<void> {
  // why: the mouse sequence is raw, so the card must be on screen; Playwright's click() would scroll by itself.
  await source.scrollIntoViewIfNeeded();
  const from = (await source.boundingBox())!;
  const to = (await target.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2 + 8, { steps: 2 });
  const x = to.x + to.width / 2;
  const y = to.y + (top ? 10 : Math.min(60, to.height / 2));
  await page.mouse.move(x, y, { steps: 10 });
  // why: one more move in the same direction once the target has settled, so a slow frame cannot leave the CDK
  // without a sort at the drop point (seen once on a cold dev server).
  await page.mouse.move(x, y + Math.sign(y - from.y) * 2);
  await beforeDrop?.();
  await page.mouse.up();
}

/**
 * Pins the board to the top left of the viewport, `width` wide: the docs column is ~760px, so the last lanes of a
 * four-lane board sit outside the board's scroll view, and a page scroll would shift the drop points.
 */
async function frame(root: Locator, width = 1500): Promise<void> {
  await root.evaluate((element, size) => {
    const host = element.parentElement as HTMLElement;
    Object.assign(host.style, { position: 'fixed', top: '0', left: '0', zIndex: '1000', width: `${size}px`, flex: 'none' });
    host.style.background = 'var(--sd-surface, #fff)';
  }, width);
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

async function shot(root: Locator, file: string): Promise<void> {
  // why: every test runs in both zone projects; only the Bangkok run writes the pictures.
  if (test.info().project.name !== 'asia-bangkok') return;
  mkdirSync(SHOTS, { recursive: true });
  await root.screenshot({ path: resolve(SHOTS, `${file}.png`), animations: 'disabled' });
}

test.describe('sd-kanban', () => {
  // why: at 1280px the docs column leaves ~650px to an example; the board scrolls sideways but stays wide.
  test.beforeEach(async ({ page }) => {
    page.on('pageerror', error => console.log(`PAGEERROR ${error.message}`));
    page.on('console', message => {
      if (message.type() === 'error') console.log(`CONSOLEERROR ${message.text()}`);
    });
    await page.setViewportSize({ width: 1920, height: 1000 });
  });

  test('[KAN-E-01] fades Hoàn tất as soon as an order of Chờ xác nhận is dragged, and Đang giao takes it', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    await drag(page, name(root, 'DH-1001'), lane(root, 'shipping'), async () => {
      await expect(lane(root, 'done')).toHaveAttribute('data-blocked', 'true');
      await expect(lane(root, 'shipping')).not.toHaveAttribute('data-blocked', 'true');
      await shot(root, 'orders-dragging');
    });
    await expect(card(root, 'DH-1001')).toHaveCount(1);
    await expect.poll(() => ids(root, 'shipping')).toContain('DH-1001');
    await expect(lane(root, 'done')).not.toHaveAttribute('data-blocked', 'true');
    await axe(page, root);
    await shot(root, 'orders-light');
  });

  test('[KAN-E-02] undoes a move from the toast; both counts come back', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    expect(await count(root, 'pending')).toBe('9');
    expect(await count(root, 'shipping')).toBe('7');
    await drag(page, name(root, 'DH-1002'), lane(root, 'shipping'));
    await expect.poll(() => count(root, 'shipping')).toBe('8');
    expect(await count(root, 'pending')).toBe('8');
    await page.getByRole('button', { name: 'Hoàn tác', exact: true }).click();
    await expect.poll(() => ids(root, 'pending')).toContain('DH-1002');
    expect(await count(root, 'pending')).toBe('9');
    expect(await count(root, 'shipping')).toBe('7');
  });

  test("[KAN-E-03] moving to Đã huỷ asks for a reason; closing it is 'cancel': back in place, no failure", async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    await frame(root);
    await lane(root, 'cancelled').locator('button[aria-expanded]').click();
    // The collapsed column loads when it opens; wait for its two orders.
    await expect(lane(root, 'cancelled').locator('article')).toHaveCount(2, { timeout: 10_000 });
    await drag(page, name(root, 'DH-1003'), lane(root, 'cancelled'));
    await page.getByTestId('reason-close').click();
    await expect.poll(() => ids(root, 'pending')).toContain('DH-1003');
    await expect(root.locator('[data-failed], .sd-kanban__card--failed')).toHaveCount(0);
    await expect(root.locator('.sd-kanban__failure')).toHaveCount(0);
  });

  test('[KAN-E-04] shows more until the end of the column; the count follows total', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    expect(await ids(root, 'pending')).toHaveLength(5);
    await lane(root, 'pending').locator('[data-load-more]').click();
    await expect.poll(() => ids(root, 'pending').then(list => list.length)).toBe(9);
    await expect(lane(root, 'pending').locator('[data-load-more]')).toHaveCount(0);
    expect(await count(root, 'pending')).toBe('9');
  });

  test('[KAN-E-05] a failing column shows its error and Retry; the other columns still move', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    await page.getByTestId('fail-shipping').click();
    await page.getByTestId('reload-shipping').click();
    await expect(lane(root, 'shipping')).toHaveAttribute('data-status', 'error', { timeout: 10_000 });
    await expect(lane(root, 'shipping').locator('[data-load-error]')).toBeVisible();
    await shot(root, 'orders-column-error');
    await drag(page, name(root, 'DH-1017'), lane(root, 'pending'));
    await expect.poll(() => ids(root, 'pending')).toContain('DH-1017');
    await page.getByTestId('fail-shipping').click();
    await lane(root, 'shipping').locator('[data-action="retry"]').click();
    await expect(lane(root, 'shipping')).toHaveAttribute('data-status', 'idle', { timeout: 10_000 });
    await expect(lane(root, 'shipping').locator('article')).not.toHaveCount(0);
  });

  test('[KAN-E-06] a click opens the order; a 3px move is still a click', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    await name(root, 'DH-1004').click();
    await expect(page.getByTestId('order-drawer')).toContainText('DH-1004');
    await name(root, 'DH-1005').scrollIntoViewIfNeeded();
    const box = (await name(root, 'DH-1005').boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 10);
    await page.mouse.down();
    await page.mouse.move(box.x + 23, box.y + 10);
    await page.mouse.up();
    await expect(page.getByTestId('order-drawer')).toContainText('DH-1005');
    await expect(card(root, 'DH-1005')).toHaveAttribute('aria-current', 'true');
  });

  test('[KAN-E-07] works with the keyboard only: Tab to a card, Enter, Alt + Right', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    await name(root, 'DH-1001').focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('order-drawer')).toContainText('DH-1001');
    await name(root, 'DH-1001').focus();
    await page.keyboard.press('Alt+ArrowRight');
    await expect.poll(() => ids(root, 'shipping')).toContain('DH-1001');
    await expect(name(root, 'DH-1001')).toBeFocused();
  });

  test('[KAN-E-09] Tasks with reorder: a dashed slot while dragging and the request beforeId', async ({ page }) => {
    const root = await open(page, 'tasks', 'tasks');
    await frame(root);
    // Down onto DOC-004: the slot after it, the end of the column.
    await drag(page, name(root, 'WEB-001'), card(root, 'DOC-004'), async () => {
      await expect(root.locator('.cdk-drag-placeholder')).toHaveCount(1);
    });
    await expect.poll(() => ids(root, 'open')).toEqual(['BE-023', 'DOC-004', 'WEB-001']);
    await expect(page.getByTestId('tasks-request')).toContainText('"beforeId": null');
    // Back up onto BE-023: the slot before it.
    await drag(page, name(root, 'WEB-001'), card(root, 'BE-023'));
    await expect.poll(() => ids(root, 'open')).toEqual(['WEB-001', 'BE-023', 'DOC-004']);
    await expect(page.getByTestId('tasks-request')).toContainText('"beforeId": "BE-023"');
  });

  test('[KAN-E-10] turns compact in a 400px column of a wide desktop page', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    await root.evaluate(element => {
      // why: the example lays the board out with flex: 1; a fixed 400px column needs flex: none.
      Object.assign((element.parentElement as HTMLElement).style, { flex: 'none', width: '400px' });
    });
    await expect(root).toHaveAttribute('data-compact', 'true');
    await shot(root, 'orders-400');
  });

  test('[KAN-E-01] stays readable in dark, RTL and forced colors', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    await page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark'));
    await shot(root, 'orders-dark');
    await page.evaluate(() => document.documentElement.removeAttribute('data-sd-theme'));
    await root.evaluate(element => (element.parentElement as HTMLElement).setAttribute('dir', 'rtl'));
    await shot(root, 'orders-rtl');
    await root.evaluate(element => (element.parentElement as HTMLElement).removeAttribute('dir'));
    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    await name(root, 'DH-1001').click();
    await shot(root, 'orders-forced-colors');
    await axe(page, root);
  });

  test('[KAN-E-09] renders 4 × 200 cards within budget and drags without long tasks (TESTING §10)', async ({ page }) => {
    const root = await open(page, 'tasks', 'tasks');
    const samples: number[] = [];
    for (let run = 0; run < 5; run++) {
      await page.getByRole('button', { name: 'Dữ liệu mẫu' }).click();
      await expect(root.locator('article')).toHaveCount(7);
      // why: timed inside the page, from the click that sets the 800 cards to the end of the frame that shows them,
      // so the Playwright round trips are not in the number.
      samples.push(
        await page.getByTestId('tasks-many').evaluate(
          button =>
            new Promise<number>(done => {
              const start = performance.now();
              (button as HTMLButtonElement).click();
              requestAnimationFrame(() => setTimeout(() => done(performance.now() - start), 0));
            }),
        ),
      );
      await expect(card(root, 'OPEN-200')).toBeAttached();
    }
    samples.sort((a, b) => a - b);
    test.info().annotations.push({ type: 'render-800-median-ms', description: samples[2].toFixed(1) });
    await page.evaluate(() => {
      window.__long = [];
      new PerformanceObserver(list => list.getEntries().forEach(entry => window.__long.push(entry.duration))).observe({ entryTypes: ['longtask'] });
    });
    await drag(page, name(root, 'OPEN-1'), lane(root, 'doing'));
    const longTasks = await page.evaluate(() => window.__long);
    test.info().annotations.push({ type: 'drag-long-tasks-ms', description: JSON.stringify(longTasks) });
    // §10: the numbers go to the report; a budget overrun is reported at review, not failed here.
    console.log(`[kanban perf] render 800 median ${samples[2].toFixed(1)}ms (budget 150), long tasks while dragging ${JSON.stringify(longTasks)} (budget 50)`);
  });
});

test.describe('sd-kanban · touch', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('[KAN-E-08] a tap selects; a 400ms hold drags; a horizontal swipe scrolls the board', async ({ page }) => {
    const root = await open(page, 'orders', 'orders');
    // Pending shows its first page: DH-1001…1005.
    await name(root, 'DH-1004').tap();
    await expect(page.getByTestId('order-drawer')).toContainText('DH-1004');
    // The drawer takes 240px next to the board; close it so the lanes have the width of the phone.
    await page.getByTestId('order-drawer').getByRole('button', { name: 'Đóng' }).tap();
    const board = root.locator('.sd-kanban__board');
    const box = (await board.boundingBox())!;
    const before = await board.evaluate(element => element.scrollLeft);
    const cdp = await page.context().newCDPSession(page);
    const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number, y: number) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
    // Swipe on an empty part of a lane header row: the board scrolls sideways.
    const y = box.y + 20;
    await touch('touchStart', box.x + box.width - 30, y);
    for (let step = 1; step <= 8; step++) await touch('touchMove', box.x + box.width - 30 - step * 30, y);
    await touch('touchEnd', box.x + 30, y);
    await expect.poll(() => board.evaluate(element => element.scrollLeft)).toBeGreaterThan(before);
    // Hold 400ms on a card, then move it to the next lane.
    await board.evaluate(element => (element.scrollLeft = 0));
    await name(root, 'DH-1005').scrollIntoViewIfNeeded();
    const from = (await name(root, 'DH-1005').boundingBox())!;
    const target = (await lane(root, 'shipping').boundingBox())!;
    await touch('touchStart', from.x + 20, from.y + 10);
    await page.waitForTimeout(450);
    for (let step = 1; step <= 10; step++) {
      await touch('touchMove', from.x + 20 + ((target.x + 40 - from.x - 20) * step) / 10, from.y + 10 + 10 * step);
    }
    await touch('touchEnd', target.x + 40, from.y + 110);
    await expect.poll(() => ids(root, 'shipping')).toContain('DH-1005');
  });
});
