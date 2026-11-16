import { expect, test, type Locator, type Page } from '@playwright/test';

// E2E of sd-tree on its Showcase page (handoff design-tree-selection, tree-selection.md §15): the tree-detail
// example (open a node, open a link with ?category=, search, add a child) and the selection bar at 640px and 360px.

const PAGE = '/v/latest/components/tree/examples';

/** Opens one example of the tree page and returns its preview (each section is created when it scrolls into view). */
async function open(page: Page, section: string, query = ''): Promise<Locator> {
  await page.goto(PAGE + query);
  const preview = page.locator(`[id="components-tree-example-${section}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator('demo-section')).toBeVisible();
  const hideCode = page.locator(`[id="components-tree-example-${section}"]`).getByRole('button', { name: 'Hide code' });
  if (await hideCode.isVisible()) await hideCode.click();
  return preview;
}

const row = (root: Locator, id: string): Locator => root.locator(`[data-autoid="components-tree-showcase-detail-row-${id}"]`);
const rowIds = (root: Locator): Promise<(string | null)[]> =>
  root.locator('[role="treeitem"]').evaluateAll(rows => rows.map(item => item.getAttribute('data-tree-node')));

test.describe('sd-tree tree-detail', () => {
  test('opening a node fills the detail side and writes ?category=', async ({ page }) => {
    const root = await open(page, 'tree-detail');
    const panel = root.locator('[data-autoid="showcase-tree-detail-panel"]');
    await expect(row(root, 'dien-tu')).toBeVisible();
    await expect(row(root, 'dien-tu').locator('.sd-tree__count')).toHaveText('1.284');

    await row(root, 'gia-dung').click();
    await expect(row(root, 'gia-dung')).toHaveAttribute('aria-selected', 'true');
    await expect(panel).toContainText('Gia dụng');
    await expect(page).toHaveURL(/[?&]category=gia-dung/);

    // The chevron only expands; the open node stays.
    await root.locator('[data-autoid="components-tree-showcase-detail-toggle-dien-tu"]').click();
    await expect(row(root, 'laptop')).toBeVisible();
    await expect(row(root, 'gia-dung')).toHaveAttribute('aria-selected', 'true');

    // Enter opens the focused node.
    await row(root, 'laptop').focus();
    await page.keyboard.press('Enter');
    await expect(panel).toContainText('Laptop');
    await expect(page).toHaveURL(/[?&]category=laptop/);
  });

  test('a link with ?category= reveals the node inside the scroll area without taking focus', async ({ page }) => {
    const root = await open(page, 'tree-detail', '?category=noi-chien');
    const target = row(root, 'noi-chien');
    await expect(target).toBeVisible();
    await expect(target).toHaveAttribute('aria-selected', 'true');
    await expect(root.locator('[data-autoid="showcase-tree-detail-panel"]')).toContainText('Nồi chiên không dầu');

    const scroller = root.locator('.tree-detail__scroll');
    const box = (await scroller.boundingBox())!;
    const rect = (await target.boundingBox())!;
    expect(rect.y).toBeGreaterThanOrEqual(box.y - 1);
    expect(rect.y + rect.height).toBeLessThanOrEqual(box.y + box.height + 1);
    expect(await target.evaluate(element => element === document.activeElement)).toBe(false);
  });

  test('searching shows the server results with the match marked, and clearing restores the tree', async ({ page }) => {
    const root = await open(page, 'tree-detail');
    await expect(row(root, 'dien-tu')).toBeVisible();
    const before = await rowIds(root);
    const search = root.locator('[data-autoid="showcase-tree-detail-search"]');

    await search.fill('dien thoai');
    await expect(row(root, 'op-lung')).toBeVisible();
    expect(await rowIds(root)).toEqual(['dien-tu', 'dien-thoai', 'dien-thoai-gap', 'op-lung']);
    await expect(row(root, 'op-lung').locator('mark')).toHaveText('điện thoại');
    await expect(row(root, 'dien-tu')).toHaveClass(/sd-tree__row--context/);

    await search.fill('khong co gi');
    await expect(root.locator('.sd-tree__root-empty')).toContainText('Không có danh mục nào khớp “khong co gi”');

    await search.fill('');
    await expect(row(root, 'gia-dung')).toBeVisible();
    expect(await rowIds(root)).toEqual(before);
  });

  test('adding a child reloads the parent, opens it and activates the new node', async ({ page }) => {
    const root = await open(page, 'tree-detail');
    await row(root, 'sach').click();
    await root.locator('[data-autoid="showcase-tree-detail-add"]').click();

    const child = row(root, 'sach-moi-1');
    await expect(child).toBeVisible();
    await expect(child).toHaveAttribute('aria-selected', 'true');
    await expect(row(root, 'sach')).toHaveAttribute('aria-expanded', 'true');
    await expect(page).toHaveURL(/[?&]category=sach-moi-1/);
  });
});

test.describe('sd-tree selection bar', () => {
  for (const width of [640, 360]) {
    test(`sits inside the tree and fits a ${width}px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      const root = await open(page, 'selection-va-command');
      const tree = root.locator('sd-tree');
      await tree.locator('[data-autoid="components-tree-showcase-select-checkbox-payable"] input').check();
      await tree.locator('[data-autoid="components-tree-showcase-select-checkbox-contract"] input').check();

      const bar = tree.locator('sd-selection-bar');
      const frame = bar.locator('.c-quick-action.contained');
      await expect(frame).toBeVisible();
      await expect(bar.locator('.sd-selection-message')).toContainText('Đã chọn 2 mục');
      await expect(bar.locator('.sd-selection-direct')).toHaveCount(2);
      await expect(bar.locator('.sd-selection-more')).toHaveCount(1);

      // The bar belongs to the tree: inside its box, never wider than the viewport.
      const treeBox = (await tree.boundingBox())!;
      const frameBox = (await frame.boundingBox())!;
      expect(frameBox.x).toBeGreaterThanOrEqual(treeBox.x);
      expect(frameBox.x + frameBox.width).toBeLessThanOrEqual(treeBox.x + treeBox.width + 0.5);
      expect(frameBox.x + frameBox.width).toBeLessThanOrEqual(width);
      await expect(bar).toHaveClass(/sd-selection-bar--narrow/);

      await bar.locator('.sd-selection-clear').click();
      await expect(frame).toHaveCount(0);
    });
  }
});
