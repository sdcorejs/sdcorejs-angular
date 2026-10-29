import { expect, test, type Page } from '@playwright/test';
import { confirmDialog, openPattern, tableRows } from './pattern.support';

// /pattern/category: three-level tree table with row commands; a child category is created in a drawer.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'asia-bangkok', 'zone-independent'));

const row = (page: Page, name: string) => page.locator('sd-table tr.c-row').filter({ hasText: name }).first();
const drawer = (page: Page) => page.locator('.sd-side-drawer-active');

test('adds a child category from the row command, in a drawer', async ({ page }) => {
  await openPattern(page, 'category');
  await tableRows(page);
  await expect(row(page, 'Nước giải khát')).toBeVisible();

  await row(page, 'Nước giải khát').getByRole('button', { name: 'Thêm danh mục con' }).click();
  await expect(page).toHaveURL(/\/pattern\/category\/create\?parent=\d+$/);
  await expect(drawer(page)).toContainText('Thêm danh mục con của Nước giải khát');
  await drawer(page).getByLabel('Mã danh mục').fill('DU-NUOC-9');
  await drawer(page).getByLabel('Tên danh mục').fill('Nước khoáng có ga');
  await drawer(page).getByRole('button', { name: 'Tạo danh mục' }).click();

  await expect(drawer(page)).toHaveCount(0);
  await expect(page).toHaveURL(/\/pattern\/category$/);
  await expect(row(page, 'Nước khoáng có ga')).toBeAttached();
});

test('refuses to delete a category that still has children', async ({ page }) => {
  await openPattern(page, 'category');
  await tableRows(page);
  await row(page, 'Đồ uống').getByRole('button', { name: 'Xoá' }).click();
  await confirmDialog(page).getByRole('button', { name: 'Xoá', exact: true }).click();
  await expect(page.locator('toast').filter({ hasText: 'còn danh mục con' }).first()).toBeVisible();
});
