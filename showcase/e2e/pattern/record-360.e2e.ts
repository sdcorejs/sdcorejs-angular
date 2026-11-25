import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { openPattern } from './pattern.support';

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'asia-bangkok', 'zone-independent'));

const relation = (page: Page, key: string) => page.locator(`[data-autoid="customer-360-card-${key}"]`);
const stat = (page: Page, key: string) => page.locator(`[data-autoid="components-card-customer-360-stat-${key}"]`);
const panel = (page: Page, key: string) => page.locator(`[data-customer-tab="${key}"]`);
const sheet = (page: Page) => page.locator('customer-sheet');
const toc = (page: Page) => sheet(page).locator('nav');

async function capture(page: Page, name: string): Promise<void> {
  const directory = process.env['RECORD_360_EVIDENCE'];
  if (!directory) return;
  await mkdir(directory, { recursive: true });
  await page.screenshot({ path: join(directory, `${name}.png`), animations: 'disabled' });
}

test('opens the overdue table by keyboard and restores filters from its URL', async ({ page }) => {
  await openPattern(page, 'customer/12/360');
  const overview = page.getByRole('tab', { name: 'Tổng quan' });
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  const debtTab = page.getByRole('tab', { name: /Công nợ.*2.*quá hạn/ });
  await expect(debtTab.locator('[data-badge-color="error"]')).toHaveText('2');
  await expect(relation(page, 'orders').locator('sd-section-item')).toHaveCount(5);
  await expect(page.getByRole('tab', { name: /Đơn hàng/ })).toContainText('48');
  const debtLink = stat(page, 'debt').getByRole('link');
  await debtLink.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/tab=debts/);
  await expect(page).toHaveURL(/table-customer-debts=/);
  const rows = panel(page, 'debts').locator('tr.c-row, sd-table-mobile-cards [role="listitem"]');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Quá hạn');
  await page.reload();
  await expect(rows).toHaveCount(2);
  await debtTab.focus();
  await page.keyboard.press('Home');
  await page.keyboard.press('Enter');
  await expect(overview).toHaveAttribute('aria-selected', 'true');
  await expect(page).not.toHaveURL(/tab=/);
  await relation(page, 'orders')
    .getByRole('link', { name: /Xem tất cả/ })
    .click();
  await expect(panel(page, 'orders')).toBeVisible();
});

test('retries one card independently and hides links when relations are empty', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('sd-pattern.e2e', '1');
    sessionStorage.setItem(
      'sd-pattern.mock-api',
      JSON.stringify({
        latencyMs: 1500,
        failure: 'none',
        reads: { 'customers/12/orders': { mode: 'error-once' } },
      })
    );
  });
  await page.goto('/pattern/customer/12/360', { waitUntil: 'commit' });
  const orders = relation(page, 'orders');
  await expect(orders.locator('sd-data-state [data-state="loading"][aria-busy="true"]')).toBeVisible();
  await capture(page, 'loading');
  await expect(orders.getByRole('button', { name: /Thử lại/ })).toBeVisible();
  await expect(orders).toContainText('Không tải được');
  await expect(orders.getByRole('link', { name: /Xem tất cả/ })).toHaveCount(0);
  await expect(relation(page, 'activity').locator('sd-section-item').first()).toBeVisible();
  await capture(page, 'isolated-error');
  await orders.getByRole('button', { name: /Thử lại/ }).click();
  await expect(orders.locator('sd-section-item')).toHaveCount(5);
  await page.goto('/pattern/customer/39/360');
  await expect(relation(page, 'orders').locator('sd-badge').first()).toContainText('0');
  await expect(relation(page, 'orders').getByRole('link', { name: /Xem tất cả/ })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: /Công nợ/ }).locator('.sd-tab__badge')).toHaveCount(0);
  await capture(page, 'empty');
});

test('opens related order details and document previews from the overview', async ({ page }) => {
  await openPattern(page, 'customer/12/360');
  const documentName = 'Hợp đồng nguyên tắc 2026.pdf';
  await relation(page, 'documents').getByRole('button', { name: documentName }).click();
  await expect(page.locator('sd-preview-pdf')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText(documentName);
  await capture(page, 'document-preview');
  await page.keyboard.press('Escape');
  await relation(page, 'orders').getByRole('link', { name: 'DH2408' }).click();
  await expect(page).toHaveURL(/\/pattern\/order\/2408\/detail/);
  const detail = page.locator('.sd-side-drawer-active');
  await expect(detail).toContainText('Đơn hàng DH2408');
  await expect(detail).toContainText('Công ty TNHH Minh Phát');
  await capture(page, 'related-order');
});

test('refreshes recent activity after saving the update drawer', async ({ page }) => {
  await openPattern(page, 'customer/12/360');
  await expect(relation(page, 'activity').locator('sd-section-item')).toHaveCount(5);
  await page.getByRole('button', { name: 'Cập nhật khách hàng' }).click();
  const drawer = page.locator('.sd-side-drawer-active');
  await drawer.getByLabel('Tên khách hàng').fill('Doanh nghiệp mẫu cập nhật');
  await drawer.getByRole('button', { name: 'Lưu' }).click();
  await expect(drawer).toHaveCount(0);
  await expect(page.locator('sd-page-detail > header')).toContainText('Doanh nghiệp mẫu cập nhật');
  await expect(relation(page, 'activity').locator('sd-section-item').first()).toContainText('cập nhật');
  await relation(page, 'activity')
    .getByRole('link', { name: /Xem tất cả/ })
    .click();
  await expect(panel(page, 'activity').locator('sd-timeline')).toContainText('cập nhật');
});

test('enforces the sample debt permission across overview, direct tab and printable sheet', async ({ page }) => {
  await openPattern(page, 'customer/12/360?tab=debts', { role: 'viewer' });
  await expect(page.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tab', { name: /Công nợ/ })).toHaveCount(0);
  await expect(stat(page, 'debt')).toHaveCount(0);
  await expect(relation(page, 'debts')).toHaveCount(0);
  await page.goto('/pattern/customer/12/sheet');
  await expect(toc(page).getByRole('button')).toHaveCount(5);
  await expect(sheet(page).locator('#cong-no')).toHaveCount(0);
});

test('restores a deep link and replaces the fragment without adding history', async ({ page }) => {
  await openPattern(page, 'customer/12/sheet?sample=1#hoat-dong');
  await expect(sheet(page).locator('#hoat-dong sd-section-item').first()).toBeInViewport();
  const before = await page.evaluate(() => history.length);
  await toc(page).getByRole('button', { name: 'Liên hệ' }).click();
  await expect(page).toHaveURL(/sheet\?sample=1#lien-he$/);
  await expect(sheet(page).locator('#lien-he')).toBeInViewport();
  expect(await page.evaluate(() => history.length)).toBe(before);
});

test('loads deferred sections before printing and excludes screen controls from the printed sheet', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      document.body.dataset['printedSections'] = String(
        document.querySelectorAll('customer-sheet customer-relation sd-section-item').length
      );
    };
  });
  await openPattern(page, 'customer/12/sheet', { latencyMs: 120 });
  await expect(sheet(page).locator('#thong-tin')).toBeVisible();
  await expect(sheet(page).locator('#hoat-dong sd-section-item')).toHaveCount(0);
  await sheet(page).getByRole('button', { name: 'In hồ sơ' }).click();
  await expect.poll(() => page.locator('body').getAttribute('data-printed-sections')).toMatch(/^\d+$/);
  expect(Number(await page.locator('body').getAttribute('data-printed-sections'))).toBeGreaterThan(48);
  await expect(sheet(page).locator('#don-hang sd-section-item')).toHaveCount(48);
  await page.emulateMedia({ media: 'print' });
  await expect(toc(page)).toBeHidden();
  await expect(sheet(page).getByRole('button', { name: 'In hồ sơ' })).toBeHidden();
  await expect(page.locator('sd-pattern-toolbar')).toBeHidden();
  await expect(sheet(page).locator('#hoat-dong sd-section-item').last()).toBeVisible();
  await capture(page, 'print');
  if (process.env['RECORD_360_EVIDENCE']) {
    await page.pdf({ path: join(process.env['RECORD_360_EVIDENCE'], 'customer-sheet.pdf'), format: 'A4', printBackground: true });
  }
});

test('holds print on an incomplete sheet and retries the failed section', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('sd-pattern.e2e', '1');
    sessionStorage.setItem(
      'sd-pattern.mock-api',
      JSON.stringify({
        latencyMs: 80,
        failure: 'none',
        reads: { 'customers/12/activities': { mode: 'error-once' } },
      })
    );
    window.print = () => {
      document.body.dataset['printed'] = 'yes';
    };
  });
  await page.goto('/pattern/customer/12/sheet');
  const print = sheet(page).getByRole('button', { name: 'In hồ sơ' });
  await print.click();
  await expect(sheet(page).getByRole('alert').filter({ hasText: 'Chưa thể in' })).toBeVisible();
  await expect(page.locator('body')).not.toHaveAttribute('data-printed', 'yes');
  await expect(sheet(page).locator('#hoat-dong')).toContainText('Không tải được');
  await capture(page, 'print-incomplete');
  await print.click();
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'yes');
});

for (const width of [1280, 900, 390]) {
  for (const theme of ['light', 'dark']) {
    test(`checks the overview and sheet layout at ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 850 });
      await openPattern(page, 'customer/12/360');
      await page.evaluate(theme => document.documentElement.setAttribute('data-sd-theme', theme), theme);
      await expect(relation(page, 'orders').locator('sd-section-item')).toHaveCount(5);
      const orders = (await relation(page, 'orders').boundingBox())!;
      const debts = (await relation(page, 'debts').boundingBox())!;
      if (width >= 1200) expect(Math.abs(orders.y - debts.y)).toBeLessThan(4);
      else expect(debts.y).toBeGreaterThanOrEqual(orders.y + orders.height);
      const aside = (await page.locator('sd-page-detail > .c-page-wrapper > [sdAside]').boundingBox())!;
      if (width < 1200) expect(aside.y).toBeGreaterThan(orders.y);
      else expect(aside.x).toBeGreaterThan(orders.x);
      if (width < 600) {
        const title = (await page.locator('sd-page-detail h1').boundingBox())!;
        expect(title.width).toBeGreaterThan(120);
      }
      await capture(page, `overview-${width}-${theme}`);
      await stat(page, 'debt').getByRole('link').click();
      await expect(panel(page, 'debts').locator('tr.c-row, sd-table-mobile-cards [role="listitem"]')).toHaveCount(2);
      await capture(page, `debts-${width}-${theme}`);
      await page.goto('/pattern/customer/12/sheet');
      await page.evaluate(theme => document.documentElement.setAttribute('data-sd-theme', theme), theme);
      await expect(sheet(page).locator('#lien-he')).toBeVisible();
      await expect(toc(page)).toHaveCount(1);
      if (width >= 1200) await expect(toc(page)).toBeVisible();
      else await expect(toc(page)).toBeHidden();
      if (width < 600) {
        const title = (await sheet(page).locator('h1').boundingBox())!;
        expect(title.width).toBeGreaterThan(120);
      }
      await capture(page, `sheet-${width}-${theme}`);
    });
  }
}
