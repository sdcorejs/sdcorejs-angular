import { expect, test, type Page } from '@playwright/test';
import { confirmDialog, openPattern, tableRows, throttleGap } from './pattern.support';

// /pattern/order: tabs and score cards on one state, bulk actions with partial results, detail with the approval
// workflow, form with lines, and the "Tuỳ chỉnh hiển thị" drawer (doc 08). The E1 layout suite is page-list.e2e.ts.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'asia-bangkok', 'zone-independent'));

const cfg = (value: Record<string, unknown>) => `order?cfg=${encodeURIComponent(JSON.stringify(value))}`;
const tabs = (page: Page) => page.locator('sd-page-list [sdSubheader] [role="tab"]');
const card = (page: Page, key: string) => page.locator(`[data-autoid="components-card-order-summary-${key}"]`);
const bulkResult = (page: Page) => page.locator('bulk-result');

test.describe('order list', () => {
  test('keeps tabs, score cards and the request on one status', async ({ page }) => {
    await openPattern(page, cfg({ tabs: true, score: true }));
    const rows = await tableRows(page);
    await expect(tabs(page).nth(1)).toContainText('Chờ xác nhận');

    await tabs(page).nth(1).click();
    await expect(card(page, 'pending')).toHaveAttribute('aria-pressed', 'true');
    for (const text of await rows.allInnerTexts()) expect(text).toContain('Chờ xác nhận');

    await card(page, 'shipping').click();
    await expect(tabs(page).nth(2)).toHaveAttribute('aria-selected', 'true');
    await expect(rows.first()).toContainText('Đang giao');
    await expect(page.locator('sd-page-list .mat-mdc-paginator-range-label')).toContainText(/^\s*1 ?[-–]/);
  });

  test('reports a bulk confirmation per order, keeps the failed rows selected and retries them', async ({ page }) => {
    await openPattern(page, cfg({ selector: true }));
    const rows = await tableRows(page);
    // ĐH-2400 waits for confirmation; ĐH-2399 ships already; ĐH-2398 is done.
    for (let index = 0; index < 3; index++) await rows.nth(index).locator('input[type="checkbox"]').check();
    await page.locator('sd-table selector-action').getByRole('button', { name: 'Xác nhận' }).click();
    await confirmDialog(page).getByRole('button', { name: 'Xác nhận' }).click();

    await expect(bulkResult(page)).toContainText('Đã xác nhận 1/3. 2 đơn lỗi.');
    await expect(bulkResult(page)).toContainText('ĐH-2399');
    await expect(rows.nth(0)).toContainText('Đang giao');
    await expect(rows.nth(0).locator('input[type="checkbox"]')).not.toBeChecked();
    await expect(rows.nth(1).locator('input[type="checkbox"]')).toBeChecked();
    await expect(rows.nth(2).locator('input[type="checkbox"]')).toBeChecked();

    await bulkResult(page).getByRole('button', { name: 'Thử lại phần lỗi' }).click();
    await expect(bulkResult(page)).toContainText('Đã xác nhận 0/2. 2 đơn lỗi.');
  });

  test('asks for a reason before cancelling orders', async ({ page }) => {
    await openPattern(page, cfg({ selector: true }));
    const rows = await tableRows(page);
    await rows.nth(0).locator('input[type="checkbox"]').check();
    // sd-table shows two selection actions inline; the third one is in the "Thêm" menu.
    await page.locator('sd-table selector-action').getByRole('button', { name: 'Thêm' }).click();
    await page.getByRole('menuitem', { name: 'Huỷ đơn' }).click();
    await expect(confirmDialog(page)).toContainText('Lý do huỷ');
    await confirmDialog(page).getByRole('textbox').fill('Khách đổi địa chỉ, tạo đơn mới.');
    await confirmDialog(page).getByRole('button', { name: 'Huỷ đơn' }).click();
    await expect(bulkResult(page)).toContainText('Đã huỷ 1/1.');
    await expect(rows.nth(0)).toContainText('Đã huỷ');
  });

  test('switches parts of the screen from the settings drawer and back to the defaults', async ({ page }) => {
    await openPattern(page, 'order');
    await tableRows(page);
    await expect(tabs(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'Tuỳ chỉnh hiển thị' }).click();
    const settings = page.locator('.sd-side-drawer-active');
    await expect(settings).toContainText('Vùng của trang');
    await settings.getByRole('switch').first().click();
    await expect(tabs(page)).toHaveCount(5);

    await settings.getByRole('button', { name: 'Mặc định' }).click();
    await expect(tabs(page)).toHaveCount(0);
  });
});

test.describe('order detail and workflow', () => {
  test('submits, then rejects with a required reason, on the detail page', async ({ page }) => {
    await openPattern(page, `${cfg({ detail: 'page' }).replace('order?', 'order/2400/detail?')}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Chi tiết đơn hàng #ĐH-2400');
    await expect(page.locator('approval-steps')).toContainText('Chưa gửi duyệt');

    await page.getByRole('button', { name: 'Gửi duyệt' }).click();
    await confirmDialog(page).getByRole('button', { name: 'Gửi duyệt' }).click();
    await expect(page.locator('sd-page-detail sd-badge').nth(1)).toContainText('Chờ duyệt');

    await throttleGap(page);
    await page.getByRole('button', { name: 'Từ chối' }).click();
    await confirmDialog(page).getByRole('textbox').fill('Sai đơn giá dòng 1.');
    await confirmDialog(page).getByRole('button', { name: 'Từ chối' }).click();
    await expect(page.locator('sd-page-detail sd-badge').nth(1)).toContainText('Bị từ chối');
    await expect(page.locator('approval-steps')).toContainText('Sai đơn giá dòng 1.');
  });

  test('opens the detail instead of the form of an order that can no longer change', async ({ page }) => {
    // ĐH-2399 ships already.
    await openPattern(page, 'order/2399/update');
    await expect(page).toHaveURL(/\/pattern\/order\/2399\/detail$/);
    await expect(page.locator('toast').filter({ hasText: 'không còn sửa được' }).first()).toBeVisible();
  });

  test('update keeps the stopped customer and shows the API error on the line', async ({ page }) => {
    await openPattern(page, 'order/2400/update');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Cập nhật đơn hàng #ĐH-2400');
    await expect(page.locator('customer-select')).toContainText('Phạm Dũng');

    const quantity = page.locator('[data-line="0"] sd-input-number').first().locator('input');
    await quantity.fill('60');
    await page.getByRole('button', { name: 'Lưu' }).click();
    await expect(page.locator('[data-line="0"]')).toContainText('Vượt tồn kho');
    await expect(page).toHaveURL(/\/pattern\/order\/2400\/update$/);
  });
});
