import { expect, test, type Page } from '@playwright/test';
import { confirmDialog, openPattern, tableRows } from './pattern.support';

// /pattern/approval: split pattern — list and detail side by side, ↑ ↓ to move, auto-next after a decision.

test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'asia-bangkok', 'zone-independent'));

const panel = (page: Page) => page.locator('sd-splitter-panel').last();

test('shows an empty detail panel, opens an item and moves with the arrow keys', async ({ page }) => {
  await openPattern(page, 'approval');
  const rows = await tableRows(page);
  await expect(panel(page)).toContainText('Chọn một mục');

  await rows.nth(0).getByRole('link').click();
  await expect(page).toHaveURL(/\/pattern\/approval\/1$/);
  await expect(panel(page)).toContainText('ĐN-0130');

  await page.keyboard.press('ArrowDown');
  await expect(page).toHaveURL(/\/pattern\/approval\/2$/);
  await page.keyboard.press('ArrowUp');
  await expect(page).toHaveURL(/\/pattern\/approval\/1$/);
});

test('opens the next item after an approval and keeps the filtered list in place', async ({ page }) => {
  await openPattern(page, 'approval/1');
  const rows = await tableRows(page);
  await expect(rows).toHaveCount(18);
  await panel(page).getByRole('button', { name: 'Duyệt' }).click();
  await confirmDialog(page).getByRole('button', { name: 'Duyệt' }).click();

  await expect(page).toHaveURL(/\/pattern\/approval\/2$/);
  await expect(rows).toHaveCount(17);
  await expect(panel(page)).toContainText('ĐN-0129');
});

test('replaces the list with the detail on a narrow screen, with a way back', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await openPattern(page, 'approval');
  const rows = await tableRows(page);
  await rows.nth(0).getByRole('link').click();
  await expect(rows.first()).toBeHidden();
  await panel(page).getByRole('link', { name: '← Danh sách' }).click();
  await expect(page).toHaveURL(/\/pattern\/approval$/);
  await expect(rows.first()).toBeVisible();
});

test('resizes the list by dragging the splitter and keeps its paginator in view', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openPattern(page, 'approval');
  await tableRows(page);
  const list = page.locator('sd-splitter-panel').first();
  const handle = page.locator('sd-splitter').getByRole('separator');
  const before = (await list.boundingBox())!.width;
  const box = (await handle.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 120, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  await expect.poll(async () => Math.round((await list.boundingBox())!.width)).toBe(Math.round(before) + 120);
  await expect(list.locator('sd-table .c-paginator')).toBeInViewport();
});
