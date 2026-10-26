import { expect, test, type Page } from '@playwright/test';
import { initPattern } from './pattern/pattern.support';

// E1 acceptance of sd-page-list (docs/10 of the page-layouts handoff) on /pattern/order of @sdcorejs/angular/modules/pattern.
// Its parts are switched with ?cfg=<json>: the settings of its "Tuỳ chỉnh hiển thị" drawer (PatternOrderSettings in
// modules/pattern/core/pattern-shell/settings/pattern-settings.store.ts).

const BASE = '/pattern/order';
const VIEWPORTS = [
  { width: 1440, height: 960 },
  { width: 1440, height: 800 },
  { width: 1280, height: 768 },
  { width: 1440, height: 650 },
] as const;
const ROW = 36;

type Cfg = Record<string, unknown>;

interface Layout {
  readonly scrollHeight: number;
  readonly clientHeight: number;
  readonly footerTop: number;
  readonly footerBottom: number;
  readonly tableHeight: number;
  readonly dataHeight: number;
  readonly headHeight: number;
  readonly viewport: number;
}

// why: the layout does not depend on the browser zone; run once instead of once per zone project.
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'asia-bangkok', 'layout only');
  // Mock API without latency, so a state is measured once its rows are in.
  await initPattern(page);
});

const url = (cfg: Cfg = {}): string => `${BASE}?cfg=${encodeURIComponent(JSON.stringify(cfg))}`;

/** Viewport height each test asked for: the height of the screen under test. */
const screenHeights = new WeakMap<Page, number>();

/** Opens the screen and waits until the main table is in fill mode and has measured its minimum. */
async function open(page: Page, cfg: Cfg = {}, rows = true): Promise<void> {
  await page.goto(url(cfg));
  await fitScreen(page);
  await settle(page, rows);
}

/**
 * why: /pattern puts its sample toolbar under the screen; that toolbar is not part of the screen E1 measures. Grow
 * the viewport by its height so the screen itself gets the height the test names, as a portal page would.
 */
async function fitScreen(page: Page): Promise<void> {
  const size = page.viewportSize()!;
  const screen = screenHeights.get(page) ?? size.height;
  screenHeights.set(page, screen);
  const body = page.locator('.sd-pattern-shell__body');
  await expect(body).toBeVisible();
  const chrome = await body.evaluate(element => innerHeight - element.getBoundingClientRect().height);
  if (size.height !== screen + chrome) await page.setViewportSize({ width: size.width, height: screen + chrome });
}

async function settle(page: Page, rows = true): Promise<void> {
  const table = page.locator('sd-page-list sd-table.sd-table--fill');
  await expect(table).toBeVisible();
  await expect(table.locator('.c-paginator')).toBeVisible();
  if (rows) await expect(table.locator('tr.c-row').first()).toBeVisible();
  // why: the fill minimum is measured after render (MutationObserver/ResizeObserver); give layout one more frame.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

const measure = (page: Page): Promise<Layout> =>
  page.evaluate(() => {
    const list = document.querySelector('sd-page-list')!;
    const wrapper = list.querySelector(':scope > sd-page > .c-page-wrapper') as HTMLElement;
    const table = list.querySelector('sd-table') as HTMLElement;
    const data = table.querySelector('.c-table') as HTMLElement;
    const footer = table.querySelector('.c-paginator')!.getBoundingClientRect();
    return {
      scrollHeight: wrapper.scrollHeight,
      clientHeight: wrapper.clientHeight,
      footerTop: footer.top,
      footerBottom: footer.bottom,
      tableHeight: table.getBoundingClientRect().height,
      dataHeight: data.getBoundingClientRect().height,
      headHeight: data.querySelector('thead')?.getBoundingClientRect().height ?? 0,
      viewport: innerHeight,
    };
  });

/** E1-1 and the "visible" half of E1-2. */
function expectFits(layout: Layout, label: string): void {
  expect.soft(layout.scrollHeight, `${label}: no scrollbar on the page body`).toBe(layout.clientHeight);
  expect.soft(layout.footerBottom, `${label}: footer inside the viewport`).toBeLessThanOrEqual(layout.viewport);
}

/** The "still" half of E1-2 and E1-3. */
function expectSamePlace(layout: Layout, base: Layout, label: string): void {
  expect.soft(Math.abs(layout.footerTop - base.footerTop), `${label}: footer y`).toBeLessThanOrEqual(1);
  expect.soft(Math.abs(layout.tableHeight - base.tableHeight), `${label}: table height`).toBeLessThanOrEqual(1);
}

const quickSearch = (page: Page) => page.locator('sd-page-list sd-table-quick-search input').last();
const rowCode = (page: Page, index: number) => page.locator('sd-page-list sd-table tr.c-row').nth(index).locator('a').first();

for (const viewport of VIEWPORTS) {
  test.describe(`E1 at ${viewport.width}×${viewport.height}`, () => {
    test.use({ viewport });

    test('E1-1/2/3: the page fits and the footer stays put for every record count, page size and read state', async ({ page }) => {
      // why: every state is a full page load of the app; eight of them pass 60 s on a busy runner.
      test.slow();
      const states: readonly [string, Cfg, boolean][] = [
        ['128 records', {}, true],
        ['0 records', { records: 0 }, false],
        ['3 records', { records: 3 }, true],
        ['20 records', { records: 20 }, true],
        ['page size 10', { pageSize: 10 }, true],
        ['page size 50', { pageSize: 50 }, true],
        ['loading', { read: 'loading' }, false],
        ['error', { read: 'error' }, false],
      ];
      let base: Layout | undefined;
      for (const [label, cfg, rows] of states) {
        await open(page, cfg, rows);
        const layout = await measure(page);
        expectFits(layout, label);
        if (base) expectSamePlace(layout, base, label);
        else base = layout;
      }
    });

    // why: doc 10 also asks for a bare screen with only sd-table (no quick search, no filter row, no footer buttons),
    // where the footer holds only the paginator or the "Đang hiển thị" line.
    test('E1-1/2/3 on a screen with only sd-table', async ({ page }) => {
      // why: every state is a full page load of the app; eight of them pass 60 s on a busy runner.
      test.slow();
      const bare = { quickSearch: false, inlineFilter: false, footerButtons: false };
      const states: readonly [string, Cfg, boolean][] = [
        ['bare, 128 records', bare, true],
        ['bare, 0 records', { ...bare, records: 0 }, false],
        ['bare, 3 records', { ...bare, records: 3 }, true],
        ['bare, 20 records', { ...bare, records: 20 }, true],
        ['bare, loading', { ...bare, read: 'loading' }, false],
        ['bare, error', { ...bare, read: 'error' }, false],
      ];
      let base: Layout | undefined;
      for (const [label, cfg, rows] of states) {
        await open(page, cfg, rows);
        const layout = await measure(page);
        expectFits(layout, label);
        if (base) expectSamePlace(layout, base, label);
        else base = layout;
      }
    });

    test('E1-2/3: the footer stays put on a tab change, a quick search and a selection', async ({ page }) => {
      await open(page, { tabs: true, selector: true });
      const base = await measure(page);
      expectFits(base, 'tabs + selector');

      await page.locator('sd-page-list [sdSubheader] [role="tab"]').nth(2).click();
      await settle(page);
      expectSamePlace(await measure(page), base, 'tab "Đang giao"');

      await quickSearch(page).fill('ĐH-23');
      await quickSearch(page).press('Enter');
      await settle(page);
      expectSamePlace(await measure(page), base, 'quick search with results');

      await quickSearch(page).fill('không có đơn nào');
      await quickSearch(page).press('Enter');
      await settle(page, false);
      expectSamePlace(await measure(page), base, 'quick search without results');

      await quickSearch(page).fill('');
      await quickSearch(page).press('Enter');
      await settle(page);
      const boxes = page.locator('sd-page-list sd-table tr.c-row input[type="checkbox"]');
      for (const index of [0, 1, 2]) await boxes.nth(index).check();
      await expect(page.locator('sd-page-list sd-table selector-action').first()).toBeVisible();
      await settle(page);
      const selected = await measure(page);
      expectFits(selected, '3 rows selected');
      expectSamePlace(selected, base, '3 rows selected');
    });

    if (viewport.height >= 720) {
      // why: the external filter lives inside sd-table, so the table host keeps its height and its data area gives
      // way; the data area is what every secondary area must take room from.
      test('E1-4: secondary areas take room from the data area, never from the footer', async ({ page }) => {
        await open(page, { quickSearch: false });
        const plain = await measure(page);
        const variants: readonly [string, Cfg][] = [
          ['score card', { quickSearch: false, score: true }],
          ['tabs', { quickSearch: false, tabs: true }],
          ['external filter', { quickSearch: false, externalFilter: true }],
        ];
        for (const [label, cfg] of variants) {
          await open(page, cfg);
          const layout = await measure(page);
          expectFits(layout, label);
          expect.soft(layout.dataHeight, `${label}: data area shrinks`).toBeLessThan(plain.dataHeight);
        }

        await open(page, { quickSearch: false, externalFilter: true });
        const open_ = await measure(page);
        await page.locator('sd-page-list external-filter .sd-section-collapse-toggle').click();
        await settle(page);
        const collapsed = await measure(page);
        expectFits(collapsed, 'external filter collapsed');
        expect.soft(collapsed.dataHeight, 'collapsing the external filter gives the data area room').toBeGreaterThan(open_.dataHeight);
      });
    }
  });
}

test.describe('E1-5 at 1440×650', () => {
  test.use({ viewport: { width: 1440, height: 650 } });
  const crowded = { tabs: true, score: true, externalFilter: true, quickSearch: false };

  test('compact folds the score card and the external filter so the page still fits', async ({ page }) => {
    await open(page, crowded);
    await expect(page.locator('[data-autoid="components-card-group-order-summary"]')).toHaveClass(/summary--compact/);
    expect(Math.round((await page.locator('[data-autoid="components-card-group-order-summary"]').boundingBox())!.height)).toBe(36);
    await expect(page.locator('sd-page-list external-filter .sd-external-filter-body')).toHaveCount(0);
    expectFits(await measure(page), 'compact');
  });

  test('without autoCompact the data area keeps header + 5 rows and the body scrolls to the footer', async ({ page }) => {
    await open(page, { ...crowded, autoCompact: false });
    await expect(page.locator('sd-page-list external-filter .sd-external-filter-body')).toHaveCount(1);
    const layout = await measure(page);
    expect(layout.dataHeight).toBeGreaterThanOrEqual(layout.headHeight + 5 * ROW - 1);
    expect(layout.scrollHeight).toBeGreaterThan(layout.clientHeight);

    await page.locator('sd-page-list > sd-page > .c-page-wrapper').evaluate(wrapper => (wrapper.scrollTop = wrapper.scrollHeight));
    const scrolled = await measure(page);
    expect(scrolled.footerBottom).toBeLessThanOrEqual(scrolled.viewport);
  });
});

test.describe('E1-6 detail as a child route', () => {
  test.use({ viewport: { width: 1440, height: 800 } });

  test('detail="page": Back restores the filter, page, selection and scroll of the list', async ({ page }) => {
    await open(page, { detail: 'page', selector: true });
    await quickSearch(page).fill('ĐH-2');
    await quickSearch(page).press('Enter');
    await settle(page);
    await page.locator('sd-page-list .mat-mdc-paginator-navigation-next').click();
    await settle(page);
    await expect(page.locator('sd-page-list .mat-mdc-paginator-range-label')).toContainText('21');
    // why: the range label changes on click, the rows only when the delayed read lands; on a slow runner the
    // first row was still ĐH-2400 of page 1 when it was checked. Wait for the first row of page 2.
    await expect(rowCode(page, 0)).toHaveText('ĐH-2380');
    await page.locator('sd-page-list sd-table tr.c-row input[type="checkbox"]').first().check();
    const data = page.locator('sd-page-list sd-table .c-table');
    await data.evaluate(element => (element.scrollTop = 100));
    // why: open a row that is visible at scrollTop 100; clicking a hidden one makes Playwright scroll it into view first.
    const opened = 6;
    const code = (await rowCode(page, opened).textContent())?.trim();

    await rowCode(page, opened).click();
    await expect(page).toHaveURL(/\/pattern\/order\/\d+\/detail/);
    await expect(page.locator('sd-page-detail')).toBeVisible();
    await expect(page.locator('sd-page-list > sd-page')).toBeHidden();

    await page.goBack();
    await expect(page.locator('sd-page-list > sd-page')).toBeVisible();
    await expect(quickSearch(page)).toHaveValue('ĐH-2');
    await expect(page.locator('sd-page-list .mat-mdc-paginator-range-label')).toContainText('21');
    await expect(page.locator('sd-page-list sd-table tr.c-row input[type="checkbox"]').first()).toBeChecked();
    await expect.poll(() => data.evaluate(element => element.scrollTop)).toBe(100);
    await expect(rowCode(page, opened)).toHaveText(code!);
  });

  const closers: readonly [string, (page: Page) => Promise<void>][] = [
    ['X', page => page.locator('.sd-side-drawer-active .sd-side-drawer-close-btn').click()],
    ['Esc', page => page.keyboard.press('Escape')],
    ['the backdrop', page => page.locator('.sd-side-drawer-backdrop').click({ position: { x: 20, y: 20 } })],
    ['browser Back', page => page.goBack()],
  ];
  for (const [label, closeDrawer] of closers) {
    test(`detail="drawer": closing with ${label} returns to the list and focuses the code that opened it`, async ({ page }) => {
      await open(page, { detail: 'drawer' });
      const opener = rowCode(page, 2);
      const code = (await opener.textContent())?.trim();
      await opener.focus();
      await opener.click();
      await expect(page).toHaveURL(/\/pattern\/order\/\d+\/detail/);
      await expect(page.locator('.sd-side-drawer-active')).toBeVisible();
      await expect(page.locator('sd-page-list > sd-page')).toBeVisible();

      await closeDrawer(page);
      // why: closing navigates to the list route ('..'), which drops ?cfg= (the settings were read when the screen
      // opened); browser Back returns to the URL that still has it.
      await expect(page).toHaveURL(/\/pattern\/order(\?cfg=[^/]*)?$/);
      await expect(page.locator('.sd-side-drawer-active')).toHaveCount(0);
      await expect.poll(() => page.evaluate(() => document.activeElement?.textContent?.trim())).toBe(code);
    });
  }
});
