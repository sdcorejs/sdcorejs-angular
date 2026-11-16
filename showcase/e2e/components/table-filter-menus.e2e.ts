import { expect, test, type Locator, type Page } from '@playwright/test';

// E2E of the two sd-table menus that moved from mat-menu to the sd-button Action Popover (handoff
// design-tree-selection, tree-selection.md §13 and §15): the settings menu of the external filters on a desktop
// table, and the operator menu of the phone filter sheet, with the callbacks that run once on Áp dụng.

const PAGE = '/v/latest/components/table/examples';

/** Opens one example of the table page and returns its preview (each section is created when it scrolls into view). */
async function open(page: Page, section: string): Promise<Locator> {
  await page.goto(PAGE);
  const preview = page.locator(`[id="components-table-${section}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.isVisible().catch(() => false)) await load.click();
  await expect(preview.locator('sd-table').first()).toBeVisible();
  return preview;
}

const popover = (page: Page): Locator => page.locator('.cdk-overlay-container .sd-action-popover');

test.describe('sd-table external filter settings (MM-01)', () => {
  const T = 'components-table-external-filters';

  test('the settings menu is an Action Popover of toggles: the mouse, Space and Enter keep it open, Escape closes it', async ({ page }) => {
    const root = await open(page, 'example-external-filters');
    const salary = root.locator(`.sd-external-filter-body [data-autoid*="${T}-external-salary"]`).first();
    await expect(salary).toBeVisible();

    const trigger = root.locator(`[data-autoid="components-button-${T}-external-setting"]`);
    await trigger.click();
    const menu = popover(page);
    await expect(menu).toBeVisible();
    await expect(menu.locator('.sd-action-label')).toHaveText(['Họ và tên', 'Phòng ban', 'Lương', 'Ngày vào làm']);

    const entry = menu.locator(`[data-autoid="${T}-external-setting-salary"]`);
    await expect(entry).toHaveRole('menuitemcheckbox');
    // The check box is aria-hidden: the entry is named by its label only.
    await expect(entry).toHaveAccessibleName('Lương');
    await expect(entry).toHaveAttribute('aria-checked', 'true');

    await entry.click();
    await expect(salary).toBeHidden();
    await expect(entry).toHaveAttribute('aria-checked', 'false');
    await expect(menu).toBeVisible();

    // R2 N3: the keyboard toggles without closing the menu, and focus stays on the entry.
    await entry.focus();
    await page.keyboard.press('Space');
    await expect(salary).toBeVisible();
    await expect(entry).toHaveAttribute('aria-checked', 'true');
    await expect(entry).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(salary).toBeHidden();
    await expect(menu).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(salary).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(trigger).toBeFocused();
  });
});

test.describe('sd-table phone filter sheet (MM-02)', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const T = 'components-table-mobile-orders';

  const openSheet = async (page: Page, root: Locator, field: string) => {
    await root.locator(`[data-autoid="${T}-mobile-filter"]`).click();
    await page.locator(`[data-autoid="${T}-mobile-filter-row-${field}"]`).click();
  };
  const button = (page: Page, name: string) => page.locator(`[data-autoid="components-button-${T}-mobile-filter-${name}"]`);
  /** Xong on the page of one filter, back to the list, then Áp dụng or Huỷ of the sheet. */
  const close = async (page: Page, action: 'apply' | 'cancel') => {
    await button(page, 'done').click();
    await button(page, action).click();
  };

  test('the operator menu is an Action Popover with a check on the current operator; Áp dụng runs operatorChange once', async ({
    page,
  }) => {
    const root = await open(page, 'example-loc-va-sap-xep-tren-dien-thoai');
    const status = root.locator('app-table-mobile-data-demo > p[role="status"]');
    await openSheet(page, root, 'code');

    const operator = page.locator(`[data-autoid="${T}-mobile-filter-code-operator"]`);
    const before = (await operator.innerText()).trim();
    await operator.locator('button').click();
    const items = popover(page).locator('.sd-action-item');
    await expect(items).toHaveCount(2);
    // The current operator carries a check; the other does not.
    await expect(items.nth(0).locator('.sd-action-label ~ sd-icon')).toHaveText('check');
    await expect(items.nth(1).locator('.sd-action-label ~ sd-icon')).toHaveCount(0);

    await items.nth(1).click();
    await expect(popover(page)).toBeHidden();
    await expect(operator).not.toHaveText(before);
    // The sheet edits a draft: nothing has run yet.
    await expect(status).toHaveText('');

    await close(page, 'apply');
    await expect(status).toHaveText('Toán tử của Mã đơn: EQUAL');
  });

  test('an external filter onChange runs on Áp dụng, not while the draft is edited, and not after Huỷ', async ({ page }) => {
    const root = await open(page, 'example-loc-va-sap-xep-tren-dien-thoai');
    const status = root.locator('app-table-mobile-data-demo > p[role="status"]');
    const online = page.locator(`[data-autoid*="${T}-mobile-filter-channel-option-0"]`).first();

    await openSheet(page, root, 'channel');
    await online.click();
    await expect(status).toHaveText('');
    await close(page, 'apply');
    await expect(status).toHaveText('Kênh bán: online');

    await openSheet(page, root, 'channel');
    await online.click();
    await close(page, 'cancel');
    await expect(status).toHaveText('Kênh bán: online');
  });
});
