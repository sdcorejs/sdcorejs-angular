import { expect, test, type Page } from '@playwright/test';
import { confirmDialog, openPattern, quickSearch, tableRows, throttleGap } from './pattern.support';

// /pattern/customer: CRUD in drawers (child routes of the list), score cards that filter, 360° profile with tabs.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'asia-bangkok', 'zone-independent'));

const drawer = (page: Page) => page.locator('.sd-side-drawer-active');
const card = (page: Page, key: string) => page.locator(`[data-autoid="components-card-customer-segment-${key}"]`);

test.describe('customer list', () => {
  test('filters by the score card it shares one state with, from the first page', async ({ page }) => {
    await openPattern(page, 'customer');
    const rows = await tableRows(page);
    await expect(card(page, 'all')).toHaveAttribute('aria-pressed', 'true');
    await expect(card(page, 'business')).toContainText('8');

    await card(page, 'business').click();
    await expect(card(page, 'business')).toHaveAttribute('aria-pressed', 'true');
    await expect(rows).toHaveCount(8);
    for (const text of await rows.allInnerTexts()) expect(text).toContain('Doanh nghiệp');

    // Clicking the selected card again clears the filter back to "Tất cả" (sd-card ignores a second click within 300 ms).
    await throttleGap(page);
    await card(page, 'business').click();
    await expect(card(page, 'all')).toHaveAttribute('aria-pressed', 'true');
    await expect(rows).toHaveCount(20);
  });

  test('opens the detail in a drawer that only closes with X, then gives focus back to the row', async ({ page }) => {
    await openPattern(page, 'customer');
    const link = (await tableRows(page)).first().getByRole('link');
    await link.click();
    await expect(page).toHaveURL(/\/pattern\/customer\/1\/detail$/);
    await expect(drawer(page)).toContainText('Chi tiết khách hàng #KH-0001');
    // The X of the drawer is labelled "Đóng"; the footer has no Close/Cancel button besides it.
    await expect(
      drawer(page)
        .locator('button:not(.sd-side-drawer-close-btn)')
        .filter({ hasText: /^\s*(Đóng|Huỷ)\s*$/ })
    ).toHaveCount(0);

    await drawer(page).locator('.sd-side-drawer-close-btn').click();
    await expect(page).toHaveURL(/\/pattern\/customer$/);
    await expect(drawer(page)).toHaveCount(0);
    await expect(link).toBeFocused();
  });

  test('keeps delete as a red icon next to X and opens the 360° profile from a button', async ({ page }) => {
    await openPattern(page, 'customer/1/detail');
    const remove = drawer(page).locator('.sd-side-drawer-header-right').getByRole('button', { name: 'Xoá khách hàng' });
    await expect(remove).toBeVisible();
    await expect(remove).not.toContainText('Xoá');

    await remove.click();
    await expect(confirmDialog(page)).toContainText('Xoá khách hàng');
    await confirmDialog(page).getByRole('button', { name: 'Không xoá' }).click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/pattern\/customer\/1\/detail$/);

    await drawer(page).getByRole('button', { name: 'Hồ sơ 360°' }).click();
    await expect(page).toHaveURL(/\/pattern\/customer\/1\/360$/);
  });
});

test.describe('customer drawers', () => {
  test('update: asks before dropping changes, saves, refreshes the list and returns focus to the row', async ({ page }) => {
    await openPattern(page, 'customer');
    const link = (await tableRows(page)).nth(1).getByRole('link');
    await link.click();
    await drawer(page).getByRole('button', { name: 'Cập nhật khách hàng' }).click();
    await expect(page).toHaveURL(/\/pattern\/customer\/2\/update$/);
    const name = drawer(page).getByLabel('Tên khách hàng');
    await name.fill('Trần Bình (VIP)');

    await page.keyboard.press('Escape');
    await expect(confirmDialog(page)).toContainText('Đóng khi chưa lưu?');
    await confirmDialog(page).getByRole('button', { name: 'Tiếp tục sửa' }).click();
    await expect(confirmDialog(page)).toHaveCount(0);
    await expect(name).toHaveValue('Trần Bình (VIP)');

    await throttleGap(page);
    await drawer(page).getByRole('button', { name: 'Lưu' }).click();
    await expect(page).toHaveURL(/\/pattern\/customer$/);
    await expect((await tableRows(page)).nth(1)).toContainText('Trần Bình (VIP)');
    await expect(link).toBeFocused();
  });

  test('create: warns per group, shows the duplicate e-mail on its field, then saves', async ({ page }) => {
    await openPattern(page, 'customer');
    await tableRows(page);
    await page.getByRole('button', { name: 'Tạo khách hàng' }).click();
    const save = drawer(page).getByRole('button', { name: 'Tạo khách hàng' });
    await save.click();
    await expect(drawer(page).locator('sd-inform')).toHaveCount(2);
    await expect(drawer(page).getByLabel('Tên khách hàng')).toBeFocused();

    await drawer(page).getByLabel('Tên khách hàng').fill('Khách thử nghiệm');
    await drawer(page).getByLabel('Email').fill('nguyen.an@mail.vn');
    await drawer(page).getByLabel('Điện thoại').fill('0901234567');
    await throttleGap(page);
    await save.click();
    await expect(
      drawer(page)
        .locator('sd-input')
        .filter({ has: page.getByLabel('Email') })
    ).toContainText('khách hàng khác');

    await drawer(page).getByLabel('Email').fill('khach.thu@mail.vn');
    await throttleGap(page);
    await save.click();
    await expect(drawer(page)).toHaveCount(0);
    await quickSearch(page, 'Khách thử nghiệm');
    await expect((await tableRows(page)).first()).toContainText('Khách thử nghiệm');
  });
});

test.describe('customer 360', () => {
  test('loads a tab only when it opens, keeps the tab in the URL and shows the empty state of a tab', async ({ page }) => {
    await openPattern(page, 'customer/3/360');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Hồ sơ khách hàng #KH-0003');
    await expect(page.locator('[data-customer-tab]')).toHaveCount(1);

    await page.getByRole('tab', { name: 'Đơn hàng' }).click();
    await expect(page).toHaveURL(/tab=orders/);
    await expect(page.locator('[data-customer-tab="orders"] sd-table')).toBeVisible();

    await page.getByRole('tab', { name: 'Tài liệu' }).click();
    await expect(page.locator('[data-customer-tab="documents"]')).toContainText('Khách hàng chưa có tài liệu.');
    await expect(page.locator('[data-customer-tab]')).toHaveCount(3);

    await page.reload();
    await expect(page.locator('[data-customer-tab="documents"]')).toBeVisible();
  });
});
