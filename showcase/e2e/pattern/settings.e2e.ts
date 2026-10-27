import { expect, test, type Page } from '@playwright/test';
import { confirmDialog, openPattern, throttleGap } from './pattern.support';

// /pattern/settings: one record, form with a table of contents, save state in the footer, leave guard.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'asia-bangkok', 'zone-independent'));

const state = (page: Page) => page.locator('[data-autoid="settings-save-state"]');

test('shows the save state, asks before leaving with changes and stays on the page after saving', async ({ page }) => {
  await openPattern(page, 'settings');
  await expect(state(page)).toContainText('Đã lưu lúc');
  await expect(page.getByRole('navigation', { name: 'Mục lục' })).toContainText('Bảo mật');

  await page.getByLabel('Tên cửa hàng').fill('Cửa hàng mẫu (đổi tên)');
  await expect(state(page)).toContainText('Có thay đổi chưa lưu');

  await page.locator('sd-pattern-toolbar').getByRole('link', { name: 'Pattern' }).click();
  await confirmDialog(page).getByRole('button', { name: 'Ở lại' }).click();
  await expect(page).toHaveURL(/\/pattern\/settings$/);

  await throttleGap(page);
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(state(page)).toContainText('Đã lưu lúc');
  await page.locator('sd-pattern-toolbar').getByRole('link', { name: 'Pattern' }).click();
  await expect(page).toHaveURL(/\/pattern$/);
});

// why: <sd-input-number> writes a typed number without marking its control dirty; the save state compares values.
test('shows a changed number as unsaved, also after a save', async ({ page }) => {
  await openPattern(page, 'settings');
  const minutes = page.getByLabel('Hết phiên sau (phút)');
  await minutes.fill('45');
  await expect(state(page)).toContainText('Có thay đổi chưa lưu');
  await minutes.fill('30');
  await expect(state(page)).toContainText('Đã lưu lúc');

  await minutes.fill('60');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(state(page)).toContainText('Đã lưu lúc');
  await minutes.fill('90');
  await expect(state(page)).toContainText('Có thay đổi chưa lưu');
});

test('shows the API error on the field and focuses it', async ({ page }) => {
  await openPattern(page, 'settings');
  const minutes = page.locator('sd-input-number').filter({ hasText: 'Hết phiên sau' }).locator('input');
  await minutes.fill('3');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await expect(page.locator('sd-input-number').filter({ hasText: 'Hết phiên sau' })).toContainText('Từ 5 đến 480 phút.');
  await expect(minutes).toBeFocused();
});

test('shows the settings read-only to a role that cannot update them', async ({ page }) => {
  await openPattern(page, 'settings', { role: 'viewer' });
  await expect(state(page)).toContainText('Đã lưu lúc');
  await expect(page.getByRole('button', { name: 'Lưu' })).toHaveCount(0);
  await expect(page.getByLabel('Tên cửa hàng')).toHaveCount(0);
});
