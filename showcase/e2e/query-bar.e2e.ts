import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// QB-E-01…05 of the query bar panels handoff (.sdcorejs/handoff/design-query-bar-panels/query-bar-panels.md, 13.8): the
// examples of the sd-query-bar and sd-table pages, driven like a user.
//
// why: the dev server serves no /docs/**; the doc pages read the published archive, so it is served from the
// committed published-docs (latest → versions.json.latest).
const DOCS = join(__dirname, '..', '..', 'published-docs');
const LATEST: string = JSON.parse(readFileSync(join(DOCS, 'versions.json'), 'utf8')).latest;

async function serveDocs(page: Page): Promise<void> {
  await page.route('**/docs/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const rel = decodeURIComponent(path.slice(path.indexOf('/docs/') + '/docs/'.length)).replace(/^latest\//, `${LATEST}/`);
    const file = join(DOCS, rel);
    if (existsSync(file)) await route.fulfill({ path: file });
    else await route.fulfill({ status: 404, body: '' });
  });
}

/**
 * Opens one example of a component page and waits for its live preview. Each example is an
 * `article#components-<slug>-<section>`; its preview is created once it scrolls into view (@defer on viewport).
 */
async function openExample(page: Page, slug: string, sectionId: string): Promise<Locator> {
  await serveDocs(page);
  await page.goto(`/v/latest/components/${slug}/examples`);
  const example = page.locator(`[id="components-${slug}-${sectionId}"]`);
  const preview = page.locator(`[id="components-${slug}-${sectionId}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.isVisible().catch(() => false)) await load.click();
  await expect(preview.locator('sd-query-bar')).toBeVisible({ timeout: 60_000 });
  return example;
}

const panel = (page: Page, autoId: string): Locator => page.locator(`.cdk-overlay-container [data-autoid="${autoId}"]`);

// The scenarios do not depend on the browser zone; run once.
test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'asia-bangkok', 'zone independent');
  await page.addInitScript(() => {
    for (const key of Object.keys(localStorage)) if (key.startsWith('sd-query-bar:savedFilters:')) localStorage.removeItem(key);
  });
});

test('QB-E-01 popover mode: add with +, edit a chip, save, apply again, delete and undo', async ({ page }) => {
  const example = await openExample(page, 'query-bar', 'example-che-do-popover');
  const bar = example.locator('sd-query-bar');

  await bar.locator('.c-add-filter').click();
  const picker = panel(page, 'query-bar-popover-panel-field-picker');
  await expect(picker).toBeVisible();
  await picker.getByRole('option', { name: /Họ tên/ }).click();

  const chipPanel = panel(page, 'query-bar-popover-panel-chip');
  await expect(chipPanel).toBeVisible();
  await expect(chipPanel).toHaveAttribute('role', 'dialog');
  await page.keyboard.type('An');
  await page.keyboard.press('Escape');
  await expect(chipPanel).toBeHidden();
  const nameChip = bar.locator('.c-chip[data-field="name"]');
  // why: nút × nằm cạnh trigger `.c-chip`, không nằm trong nó (QB-B-11).
  const nameRemove = bar.locator('sd-query-popover-chip:has(.c-chip[data-field="name"]) .c-chip-remove');
  await expect(nameChip).toContainText('An');

  await nameChip.click();
  await expect(chipPanel).toBeVisible();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('Bình');
  await example.locator('h3').first().click();
  await expect(chipPanel).toBeHidden();
  await expect(nameChip).toContainText('Bình');

  // Save the current filter.
  await bar.locator('[data-autoid="query-bar-popover-saved-filters"]').click();
  const saved = panel(page, 'query-bar-popover-panel-saved-filters');
  await expect(saved).toHaveAttribute('role', 'menu');
  await saved.locator('[data-autoid="query-bar-popover-saved-filters-save"]').click();
  const dialog = page.locator('mat-dialog-container');
  await dialog.locator('textarea').fill('Nhân viên Bình');
  await dialog.locator('[data-confirm-accept] button').click();
  await expect(dialog).toBeHidden();

  // Remove the chip, then apply the saved filter again.
  await expect(nameRemove).toHaveAccessibleName('Xoá bộ lọc Họ tên');
  await nameRemove.click();
  await expect(nameChip).toHaveCount(0);
  await bar.locator('[data-autoid="query-bar-popover-saved-filters"]').click();
  await saved.locator('[data-autoid="query-bar-popover-saved-filter-0"]').click();
  await expect(saved).toBeHidden();
  await expect(bar.locator('.c-chip[data-field="name"]')).toContainText('Bình');

  // Delete without a question, then undo from the toast.
  await bar.locator('[data-autoid="query-bar-popover-saved-filters"]').click();
  await saved.locator('.c-sf-row').first().hover();
  await saved.locator('[data-autoid="query-bar-popover-saved-filter-0-delete"]').click();
  await expect(saved.locator('.c-sf-row')).toHaveCount(0);
  await expect(saved.locator('.c-sf-state')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Hoàn tác' }).click();
  await bar.locator('[data-autoid="query-bar-popover-saved-filters"]').click();
  await expect(saved.locator('.c-sf-name')).toHaveText(['Nhân viên Bình']);
});

test('QB-E-02 inline mode: click the bar, type "kh", Enter, pick a value, Backspace twice', async ({ page }) => {
  const example = await openExample(page, 'query-bar', 'example-che-do-inline');
  const bar = example.locator('sd-query-bar');
  const box = bar.locator('[data-autoid="query-bar-inline-add-condition"]');
  await expect(bar.locator('.c-add-filter')).toHaveCount(0);

  // A click on the empty part of the chip row opens the list and puts focus in the box.
  const main = bar.locator('.c-query-bar__main');
  const rect = (await main.boundingBox())!;
  await page.mouse.click(rect.x + rect.width - 4, rect.y + rect.height / 2);
  const picker = panel(page, 'query-bar-inline-panel-field-picker');
  await expect(picker).toBeVisible();
  await expect(box).toBeFocused();
  await expect(box).toHaveAttribute('aria-expanded', 'true');

  await page.keyboard.type('kh');
  await expect(picker.getByRole('option')).toHaveText([/Khu vực/]);
  await page.keyboard.press('Enter');
  await expect(box).toHaveValue('');

  // The value picker of the new chip opens; pick a value and leave it.
  const option = page.locator('.cdk-overlay-container mat-option', { hasText: 'Miền Bắc' });
  await option.click();
  await page.keyboard.press('Escape');
  await expect(bar.locator('sd-query-inline-chip', { hasText: 'Khu vực' })).toContainText('Miền Bắc');

  // Backspace on the empty box: focus the last chip, then remove it.
  await box.focus();
  await page.keyboard.press('Backspace');
  await expect(box).not.toBeFocused();
  await page.keyboard.press('Backspace');
  await expect(bar.locator('sd-query-inline-chip', { hasText: 'Khu vực' })).toHaveCount(0);
  await expect(box).toBeFocused();
});

test('QB-E-03 table with a required quick filter: Clear keeps it; a saved filter without it keeps it too', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'sd-query-bar:savedFilters:sd-table:showcase-table-query-bar',
      JSON.stringify([
        {
          id: 'paid',
          name: 'Đã thanh toán',
          query: { logic: 'AND', filters: [{ field: 'column:payment', operator: 'IN', data: ['paid'] }] },
        },
      ])
    );
  });
  const example = await openExample(page, 'table', 'example-loc-bang-query-bar');
  const bar = example.locator('sd-query-bar');
  const warehouse = bar.locator('sd-query-inline-chip, sd-query-popover-chip', { hasText: 'Kho xuất' });
  await expect(warehouse).toContainText('Hà Nội');

  // Clear (enabled only when something differs from the defaults) never empties the required chip.
  const clear = bar.locator('.c-clear-all');
  if (await clear.isEnabled()) await clear.click();
  await expect(warehouse).toContainText('Hà Nội');

  await bar.locator('[data-autoid$="-query-bar-saved-filters"]').click();
  await page.locator('.cdk-overlay-container .c-sf-apply', { hasText: 'Đã thanh toán' }).click();
  await expect(warehouse).toContainText('Hà Nội');
  await expect(bar.locator('sd-query-inline-chip, sd-query-popover-chip', { hasText: 'Trạng thái TT' })).toContainText('Đã thanh toán');
  await expect(bar.locator('.c-clear-all')).toBeEnabled();
  await bar.locator('.c-clear-all').click();
  await expect(warehouse).toContainText('Hà Nội');
  await expect(bar.locator('.c-clear-all')).toBeDisabled();
});

test('QB-E-04 keyboard only: Tab through the bar and its three panels', async ({ page }) => {
  const example = await openExample(page, 'query-bar', 'example-che-do-popover');
  const bar = example.locator('sd-query-bar');
  const chips = bar.locator('sd-query-popover-chip .c-chip');
  const removeOf = (index: number) => bar.locator('sd-query-popover-chip').nth(index).locator('.c-chip-remove');
  const add = bar.locator('.c-add-filter');
  const clear = bar.locator('.c-clear-all');
  const savedButton = bar.locator('[data-autoid="query-bar-popover-saved-filters"]');
  const searchButton = bar.locator('.c-search-trigger');

  // The search box is the first stop of the bar: Escape with text empties it.
  const search = bar.locator('sd-search-field input');
  await search.focus();
  await page.keyboard.type('nguyen');
  await page.keyboard.press('Escape');
  await expect(search).toHaveValue('');

  // Tab: the chip, its remove button, then +.
  await page.keyboard.press('Tab');
  await expect(chips.first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(removeOf(0)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(add).toBeFocused();

  // + opens the field picker on its first option; arrows move, Enter picks and the chip popover takes focus.
  await page.keyboard.press('Enter');
  const picker = panel(page, 'query-bar-popover-panel-field-picker');
  await expect(picker.getByRole('option').first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(picker).toBeHidden();
  const chipPanel = panel(page, 'query-bar-popover-panel-chip');
  await expect(chipPanel).toBeVisible();
  await expect.poll(() => chipPanel.evaluate(el => el.contains(document.activeElement))).toBeTruthy();
  await page.keyboard.type('a@b');
  await page.keyboard.press('Escape');
  await expect(chipPanel).toBeHidden();

  // Escape gives focus back to the new chip; Tab goes on through its remove button, +, the AND / OR toggle (two chips
  // now) and Clear to saved filters.
  await expect(chips).toHaveCount(2);
  await expect(chips.nth(1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(removeOf(1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(add).toBeFocused();
  const logic = bar.locator('.c-logic-toggle .c-logic-segment');
  await page.keyboard.press('Tab');
  await expect(logic.first()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(logic.nth(1)).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(clear).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(savedButton).toBeFocused();

  // Saved filters: Enter opens the menu on its first item, Escape gives focus back to the button.
  await page.keyboard.press('Enter');
  const saved = panel(page, 'query-bar-popover-panel-saved-filters');
  await expect(saved.locator('[data-autoid="query-bar-popover-saved-filters-save"]')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(saved).toBeHidden();
  await expect(savedButton).toBeFocused();

  // The last stop is Search; the next Tab leaves the bar.
  await page.keyboard.press('Tab');
  await expect(searchButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect.poll(() => bar.evaluate(el => el.contains(document.activeElement))).toBeFalsy();
});

test('QB-E-05 a narrow 700px table: the panel flips above when the bar is at the bottom of the page', async ({ page }) => {
  // why: a 700px window would switch the table to its phone layout, which has no query bar — the table is narrow, the
  // window is not.
  await page.setViewportSize({ width: 1280, height: 720 });
  const example = await openExample(page, 'table', 'example-loc-bang-query-bar');
  await example
    .locator('sd-table')
    .first()
    .evaluate(element => {
      (element as HTMLElement).style.display = 'block';
      (element as HTMLElement).style.width = '700px';
    });
  const bar = example.locator('sd-query-bar');
  await expect(bar).toBeVisible();
  // Bring the bar to the bottom of the viewport.
  await bar.evaluate(element => element.scrollIntoView({ block: 'end' }));
  const box = bar.locator('.c-add-condition input, .c-add-filter').first();
  await box.click();
  const listbox = page.locator('.cdk-overlay-container .c-field-picker-menu');
  await expect(listbox).toBeVisible();
  const trigger = (await box.boundingBox())!;
  const list = (await listbox.boundingBox())!;
  expect(list.y + list.height).toBeLessThanOrEqual(trigger.y + 1);
});
