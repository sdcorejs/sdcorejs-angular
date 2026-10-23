import { expect, test, type Locator, type Page } from '@playwright/test';

// ISdCoreConfiguration.timeZone through the real UI of the services/date-time demo.
// Asia/Ho_Chi_Minh was UTC+08 from 1959-12-31 to 1975-06-13 and 1975-06-12 lasted 25 hours, so 1960
// and 1975 values tell a zoned result from a browser-zone one. playwright.config.ts runs every test
// with the browser in Asia/Bangkok and in UTC; the zoned expectations are the same in both.

const DEMO = '/v/latest/services/date-time/examples';
const VN = 'Asia/Ho_Chi_Minh';
const ZONE = 'example-mui-gio-dang-dung';
const FORM = 'example-form-ngay-gio';
const TABLE = 'example-bang-va-bo-loc-server';

/**
 * Brings one example into view and waits for its live preview. The Examples tab renders each demo
 * section as its own preview, created only once it scrolls into the viewport (@defer on viewport).
 */
const reveal = async (page: Page, sectionId: string): Promise<Locator> => {
  const preview = page.locator(`[id="services-date-time-${sectionId}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator('demo-section')).toBeVisible();
  return preview;
};

const open = async (page: Page, timeZone?: string): Promise<void> => {
  await page.goto(timeZone === undefined ? DEMO : `${DEMO}?timeZone=${timeZone}`);
  await reveal(page, ZONE);
};

const zoneLabel = (page: Page): Locator => page.locator('[data-e2e="zone"]');

const formValue = async (page: Page): Promise<Record<string, unknown>> =>
  JSON.parse((await page.locator('[data-e2e="form-value"]').textContent()) ?? '{}');

const pagingFilters = async (page: Page): Promise<unknown[]> =>
  JSON.parse((await page.locator('[data-e2e="paging-filters"]').textContent()) ?? '[]');

/** The calendar of an open picker. */
const calendar = (page: Page): Locator => page.locator('.mat-datepicker-content');

/**
 * Navigates an open calendar to a past month through the year and multi-year views.
 * why: reads the page range from the period label and waits for it to change after each "Previous 24 years". Checking
 * `isVisible()` right after a click raced the re-render on a slow runner: the loop paged past the target and never found it.
 */
const goToMonth = async (page: Page, year: number, month: string): Promise<void> => {
  const panel = calendar(page);
  await panel.getByRole('button', { name: 'Choose month and year' }).click();
  await expect(panel.locator('mat-multi-year-view')).toBeVisible();
  const period = panel.locator('.mat-calendar-period-button');
  for (let step = 0; step < 6; step++) {
    const label = (await period.textContent()) ?? '';
    const start = Number(label.match(/\d{4}/)?.[0]);
    if (!start || start <= year) break;
    await panel.getByRole('button', { name: 'Previous 24 years' }).click();
    await expect(period).not.toHaveText(label);
  }
  const yearCell = panel.getByRole('button', { name: String(year), exact: true });
  await yearCell.click();
  await panel.getByRole('button', { name: new RegExp(`^${month} ${year}$`) }).click();
};

/** Opens the picker of a control and clicks a day. */
const pick = async (page: Page, host: Locator, year: number, month: string, day: RegExp): Promise<void> => {
  await host.getByRole('button', { name: 'Mở lịch' }).click();
  await goToMonth(page, year, month);
  await calendar(page).getByRole('button', { name: day }).first().click();
};

const host = (page: Page, autoId: string, tag: string): Locator =>
  page.locator(tag, { has: page.locator(`[data-autoid="${autoId}"]`) });

test.describe('services/date-time demo with ?timeZone=Asia/Ho_Chi_Minh', () => {
  test('AC-001 picking 20/05/1960 in sd-date commits the day of the zone', async ({ page }) => {
    await open(page, VN);
    await expect(zoneLabel(page)).toHaveText(VN);
    await reveal(page, FORM);

    await pick(page, host(page, 'forms-date-tz-date', 'sd-date'), 1960, 'May', /^May 20, 1960$/);
    await expect(page.locator('[data-autoid="forms-date-tz-date"]')).toHaveValue('20/05/1960');
    await pick(page, host(page, 'forms-date-tz-date-iso', 'sd-date'), 1960, 'May', /^May 20, 1960$/);

    await expect.poll(async () => (await formValue(page))['date']).toBe('1960/05/20');
    await expect.poll(async () => (await formValue(page))['dateIso']).toBe('1960-05-19T16:00:00.000Z');
  });

  test('AC-002 typing 20/05/1960 08:00 in sd-datetime reads it as wall clock in the zone', async ({ page }) => {
    await open(page, VN);
    await reveal(page, FORM);
    for (const autoId of ['forms-datetime-tz-datetime', 'forms-datetime-tz-datetime-iso']) {
      const input = page.locator(`[data-autoid="${autoId}"]`);
      await input.fill('20/05/1960 08:00');
      await input.press('Tab');
      await expect(input).toHaveValue('20/05/1960 08:00');
    }
    await expect.poll(async () => (await formValue(page))['datetime']).toBe('1960/05/20 08:00:00');
    await expect.poll(async () => (await formValue(page))['datetimeIso']).toBe('1960-05-20T00:00:00.000Z');
  });

  test('AC-003 a 1975/06/12 range bounds the 25-hour day in the form and in the table filter', async ({ page }) => {
    await open(page, VN);
    const day = /^Jun 12, 1975$/;

    await reveal(page, FORM);
    await pick(page, host(page, 'forms-date-range-tz-range', 'sd-date-range'), 1975, 'June', day);
    await calendar(page).getByRole('button', { name: day }).first().click();
    await expect.poll(async () => (await formValue(page))['range']).toEqual({ from: '1975/06/12', to: '1975/06/12' });

    await reveal(page, TABLE);
    await pick(page, host(page, 'forms-date-range-components-table-tz-table-external-period', 'sd-date-range'), 1975, 'June', day);
    await calendar(page).getByRole('button', { name: day }).first().click();
    await expect
      .poll(() => pagingFilters(page))
      .toEqual([
        { field: 'period', operator: 'GREATER_OR_EQUAL', data: '1975-06-11T16:00:00.000Z' },
        { field: 'period', operator: 'LESS_THAN', data: '1975-06-12T17:00:00.000Z' },
      ]);
  });

  test('AC-004 the table shows the 1960 instant in the zone', async ({ page }) => {
    await open(page, VN);
    const table = (await reveal(page, TABLE)).locator('[data-e2e="table"]');
    await expect(table).toContainText('20/05/1960');
    await expect(table).toContainText('00:00:00');
    await expect(table).not.toContainText('19/05/1960');
  });

  test('AC-005 today and Now come from the clock of the zone', async ({ page }) => {
    // 2026-08-14T17:30:00Z is 15/08/2026 00:30 in Asia/Ho_Chi_Minh (UTC+07 in 2026).
    await page.clock.setFixedTime(new Date('2026-08-14T17:30:00Z'));
    await open(page, VN);
    await reveal(page, FORM);

    await host(page, 'forms-date-tz-date', 'sd-date').getByRole('button', { name: 'Mở lịch' }).click();
    await expect(calendar(page).getByRole('button', { name: 'Choose month and year' })).toHaveText(/AUG 2026/i);
    await expect(calendar(page).locator('.mat-calendar-body-today')).toHaveText('15');

    // why: with a fixed clock the close animation of the picker never ends, so its backdrop stays;
    // a fresh page (same fixed clock) opens the second picker.
    await page.reload();
    await reveal(page, FORM);
    await host(page, 'forms-datetime-tz-datetime', 'sd-datetime').getByRole('button', { name: 'Mở lịch' }).click();
    await page.getByRole('button', { name: 'Bây giờ' }).click();
    const confirm = page.getByRole('button', { name: 'Xác nhận' });
    if (await confirm.isVisible()) await confirm.click();
    await expect(page.locator('[data-autoid="forms-datetime-tz-datetime"]')).toHaveValue('15/08/2026 00:30');
  });

  test('AC-007 an invalid ?timeZone falls back to local with a warning', async ({ page }) => {
    const warnings: string[] = [];
    page.on('console', message => {
      if (message.type() === 'warning') warnings.push(message.text());
    });
    await open(page, '%2B07:00');
    await expect(zoneLabel(page)).toHaveText('local');
    expect(warnings.some(text => text.includes('+07:00'))).toBe(true);
  });
});

test.describe('services/date-time demo without ?timeZone', () => {
  test('AC-006 the 1960 instant shows in the browser zone', async ({ page }, testInfo) => {
    await open(page);
    await expect(zoneLabel(page)).toHaveText('local');
    const table = (await reveal(page, TABLE)).locator('[data-e2e="table"]');
    await expect(table).toContainText('19/05/1960');
    // Bangkok was UTC+07 in 1960; the UTC browser keeps the instant's own clock.
    await expect(table).toContainText(testInfo.project.name === 'utc' ? '16:00:00' : '23:00:00');
  });
});
