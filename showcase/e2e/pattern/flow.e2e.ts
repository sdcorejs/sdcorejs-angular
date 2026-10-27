import { expect, test, type Page } from '@playwright/test';
import { confirmDialog, openPattern, throttleGap } from './pattern.support';

// Flow pattern: /pattern/import (horizontal steps) and /pattern/partner/create (vertical, branching, draft).

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'asia-bangkok', 'zone-independent'));

/** sd-button ignores a click within 300 ms of its previous one; every step waits that long before "Tiếp tục". */
const next = async (page: Page): Promise<void> => {
  await throttleGap(page);
  await page.getByRole('button', { name: 'Tiếp tục' }).click();
};

test.describe('import', () => {
  test('checks each step, previews conflicts and imports with the chosen duplicate policy', async ({ page }) => {
    await openPattern(page, 'import');
    await next(page);
    await expect(page.locator('sd-textarea')).toContainText('Vui lòng nhập thông tin');
    await page.getByLabel('Nội dung CSV').fill('code,name');
    await next(page);
    await expect(page.locator('sd-textarea')).toContainText('Cần ít nhất một dòng');

    await page.getByRole('button', { name: 'Dùng dữ liệu mẫu' }).click();
    await next(page);
    await expect(page.getByText('Đọc được 6 dòng, 4 cột.')).toBeVisible();
    await expect(page.locator('[data-autoid="forms-select-import-map-code"], mapping-form sd-select').first()).toContainText('Mã');

    await next(page);
    await expect(page.getByText('3 dòng mới · 1 dòng trùng mã · 2 dòng lỗi (bỏ qua)')).toBeVisible();
    await page.getByRole('radio', { name: 'Ghi đè sản phẩm đã có' }).click();

    // Back keeps the data of every step.
    await page.getByRole('button', { name: 'Quay lại' }).click();
    await expect(page.getByText('Đọc được 6 dòng, 4 cột.')).toBeVisible();
    await next(page);
    await expect(page.getByRole('radio', { name: 'Ghi đè sản phẩm đã có' })).toHaveAttribute('aria-checked', 'true');

    await next(page);
    await page.getByRole('button', { name: 'Nhập dữ liệu' }).click();
    await confirmDialog(page).getByRole('button', { name: 'Nhập dữ liệu' }).click();
    await expect(page.locator('sd-inform').filter({ hasText: 'Đã nhập dữ liệu' })).toContainText('3 sản phẩm mới, 1 cập nhật, 2 bỏ qua.');
  });
});

test.describe('partner create', () => {
  test('checks the code when leaving the first step, branches by type and restores the draft after a reload', async ({ page }) => {
    await openPattern(page, 'partner/create');
    await page.getByLabel('Mã đối tác', { exact: true }).fill('DT-001');
    await next(page);
    await expect(page.locator('sd-input').filter({ has: page.getByLabel('Mã đối tác', { exact: true }) })).toContainText('đã được dùng');

    await page.getByRole('radio', { name: 'Doanh nghiệp' }).click();
    await page.getByLabel('Mã đối tác', { exact: true }).fill('DT-500');
    await next(page);
    await expect(page.getByLabel('Mã số thuế', { exact: true })).toBeVisible();
    await page.getByLabel('Tên doanh nghiệp', { exact: true }).fill('Công ty TNHH Thử Nghiệm');
    await page.getByLabel('Mã số thuế', { exact: true }).fill('0312345678');
    await page.getByLabel('Người đại diện', { exact: true }).fill('Nguyễn An');
    await next(page);
    await page.getByLabel('Email', { exact: true }).fill('lienhe@thunghiem.vn');

    await page.reload();
    await expect(page.locator('sd-inform').filter({ hasText: 'Đã khôi phục bản nháp' })).toBeVisible();
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue('lienhe@thunghiem.vn');
    await page.getByLabel('Điện thoại', { exact: true }).fill('0909000111');
    await next(page);
    await expect(page.locator('sd-section').filter({ hasText: 'Kiểm tra lại' })).toContainText('Công ty TNHH Thử Nghiệm');

    await page.getByRole('button', { name: 'Tạo đối tác' }).click();
    await expect(page).toHaveURL(/\/pattern$/);
    expect(await page.evaluate(() => sessionStorage.getItem('pattern.partner.create.draft'))).toBeNull();
  });
});
