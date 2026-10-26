import { expect, test, type Page } from '@playwright/test';
import { confirmDialog, openPattern, quickSearch, simulateFailure, switchRole, tableRows, throttleGap } from './pattern.support';

// /pattern/product: CRUD on pages (doc 07). Detail, create and update are child routes of the list.

// why: none of these flows depends on the browser zone; run once instead of once per zone project.
test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'asia-bangkok', 'zone-independent'));

// The visible h1: a list stays mounted (hidden) under its detail, create and update pages.
const title = (page: Page) => page.getByRole('heading', { level: 1 });

test.describe('product list', () => {
  test('lists the seeded products, searches on Enter and opens a detail from the code link', async ({ page }) => {
    await openPattern(page, 'product');
    const rows = await tableRows(page);
    await expect(rows).toHaveCount(20);
    await expect(page.locator('sd-table .c-paginator')).toContainText('36');

    await quickSearch(page, 'Sữa');
    await expect(rows.first()).toContainText('Sữa');
    const matches = await rows.count();
    expect(matches).toBeLessThan(20);

    await rows.first().getByRole('link').click();
    await expect(page).toHaveURL(/\/pattern\/product\/\d+\/detail$/);
    await expect(title(page)).toContainText('Chi tiết sản phẩm #SP-');
    await expect(page.locator('sd-page-detail sd-badge')).toHaveCount(1);

    // Back keeps the list as it was: same search, same rows.
    await page.goBack({ waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/pattern\/product$/);
    await expect(rows).toHaveCount(matches);
    await expect(page.locator('sd-table').getByPlaceholder(/Tìm theo/)).toHaveValue('Sữa');
  });

  test('hides create and shows the code as text for a role without the permissions', async ({ page }) => {
    await openPattern(page, 'product', { role: 'viewer' });
    const rows = await tableRows(page);
    await expect(page.getByRole('button', { name: 'Tạo mới' })).toHaveCount(0);
    // The viewer still reads details, so the code stays a link; the update button is hidden there.
    await rows.first().getByRole('link').click();
    await expect(title(page)).toContainText('#SP-001');
    await expect(page.getByRole('button', { name: 'Cập nhật' })).toHaveCount(0);

    await page.goto('/pattern/product/create');
    await expect(page).toHaveURL(/\/pattern-error\/forbidden$/);
  });

  test('re-runs the guards when the role changes on the current screen', async ({ page }) => {
    await openPattern(page, 'product/create');
    await expect(title(page)).toHaveText('Tạo mới sản phẩm');
    await switchRole(page, 'Chỉ xem');
    await expect(page).toHaveURL(/\/pattern-error\/forbidden$/);
  });
});

test.describe('product detail before activation', () => {
  test('sends an unknown id to the not-found page of the host', async ({ page }) => {
    await openPattern(page, 'product/999/detail');
    await expect(page).toHaveURL(/\/pattern-error\/not-found$/);
    await expect(page.getByRole('heading', { name: 'Không tìm thấy' })).toBeVisible();
  });

  test('sends a simulated 403 and a timeout to the matching error pages', async ({ page }) => {
    await openPattern(page, 'product/1/detail', { failure: '403' });
    await expect(page).toHaveURL(/\/pattern-error\/forbidden$/);

    await openPattern(page, 'product');
    await simulateFailure(page, 'Timeout');
    await page.goto('/pattern/product/1/detail');
    await expect(page).toHaveURL(/\/pattern-error\/unavailable$/, { timeout: 15_000 });
  });
});

test.describe('product create', () => {
  test('focuses the first invalid field, shows an API field error and opens the detail after saving', async ({ page }) => {
    await openPattern(page, 'product');
    await tableRows(page);
    await page.getByRole('button', { name: 'Tạo mới' }).click();
    await expect(title(page)).toHaveText('Tạo mới sản phẩm');
    const save = page.getByRole('button', { name: 'Lưu' });

    await save.click();
    await expect(page.getByLabel('Mã sản phẩm')).toBeFocused();

    await page.getByLabel('Mã sản phẩm').fill('SP-001');
    await page.getByLabel('Tên sản phẩm').fill('Sản phẩm thử');
    await throttleGap(page);
    await save.click();
    await expect(page.locator('sd-input').filter({ has: page.getByLabel('Mã sản phẩm') })).toContainText('đã được dùng');
    await expect(page.getByLabel('Mã sản phẩm')).toBeFocused();

    await page.getByLabel('Mã sản phẩm').fill('SP-900');
    await throttleGap(page);
    await save.click();
    await expect(page).toHaveURL(/\/pattern\/product\/37\/detail$/);
    await expect(title(page)).toContainText('Chi tiết sản phẩm #SP-900');

    // replaceUrl: Back from the new detail goes to the list, not to the create form, and the list shows the product.
    await page.goBack({ waitUntil: 'commit' });
    await expect(page).toHaveURL(/\/pattern\/product$/);
    await quickSearch(page, 'SP-900');
    await expect((await tableRows(page)).first()).toContainText('Sản phẩm thử');
  });
});

test.describe('product update', () => {
  test('locks the code, counts changes by value and asks before leaving a dirty form', async ({ page }) => {
    await openPattern(page, 'product/1/update');
    await expect(page.getByLabel('Mã sản phẩm')).toBeDisabled();
    const name = page.getByLabel('Tên sản phẩm');
    await expect(name).toHaveValue('Nước suối 500ml');

    // Typed back to what it was: no change, no question.
    await name.fill('Nước suối');
    await name.fill('Nước suối 500ml');
    await page.getByRole('button', { name: 'Huỷ' }).click();
    await expect(page).toHaveURL(/\/pattern\/product\/1\/detail$/);

    await page.getByRole('button', { name: 'Cập nhật' }).click();
    await name.fill('Nước suối 1,5L');
    await page.getByRole('button', { name: 'Huỷ' }).click();
    await expect(confirmDialog(page)).toContainText('Rời trang khi chưa lưu?');
    await confirmDialog(page).getByRole('button', { name: 'Ở lại' }).click();
    // A leave request while the dialog is still closing gets the same answer: one prompt per exit.
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/pattern\/product\/1\/update$/);
    await expect(name).toHaveValue('Nước suối 1,5L');

    // Browser Back goes through the same guard.
    await page.goBack({ waitUntil: 'commit' });
    await confirmDialog(page).getByRole('button', { name: 'Rời trang' }).click();
    await expect(page).toHaveURL(/\/pattern\/product\/1\/detail$/);
  });

  test('keeps the draft when saving fails and saves it on retry', async ({ page }) => {
    await openPattern(page, 'product/2/update');
    const name = page.getByLabel('Tên sản phẩm');
    await name.fill('Sữa tươi không đường 1L');

    await simulateFailure(page, '500');
    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.locator('toast').filter({ hasText: 'Máy chủ gặp lỗi' }).first()).toBeVisible();
    await expect(page).toHaveURL(/\/pattern\/product\/2\/update$/);
    await expect(name).toHaveValue('Sữa tươi không đường 1L');

    await simulateFailure(page, 'Không');
    await throttleGap(page);
    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(page).toHaveURL(/\/pattern\/product\/2\/detail$/);
    await expect(page.locator('sd-page-detail')).toContainText('Sữa tươi không đường 1L');
  });
});
