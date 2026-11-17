import { devices, expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Desktop Chromium with a mobile UA/touch profile exercises mobile presentation, then resizes the viewport.
// This does not simulate mobile toolbars, a virtual keyboard or nonzero safe areas.
// Physical-device acceptance is documented in assets/STYLE-GUIDE.md, section 8.3.
const DOCS = join(__dirname, '..', '..', 'published-docs');
const LATEST: string = JSON.parse(readFileSync(join(DOCS, 'versions.json'), 'utf8')).latest;
const SIZES = [
  { width: 390, height: 664 },
  { width: 390, height: 844 },
  { width: 390, height: 350 },
  { width: 844, height: 390 },
  { width: 844, height: 260 },
];

// Confirm/modal choose their presentation from BrowserUtilities.isMobile(), not viewport width alone.
test.use({ userAgent: devices['Pixel 7'].userAgent, isMobile: true, hasTouch: true });

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'asia-bangkok', 'viewport geometry is zone independent');
  await page.setViewportSize(SIZES[0]);
  await page.addInitScript(() => {
    localStorage.setItem('sdcorejs.docs.lang', 'en');
    localStorage.setItem('sd-core.language', 'vi');
  });
  // The dev server serves the fresh local library; only documentation text comes from the published archive.
  await page.route('**/docs/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const rel = decodeURIComponent(path.slice(path.indexOf('/docs/') + 6)).replace(/^latest\//, `${LATEST}/`);
    const file = join(DOCS, rel);
    if (existsSync(file)) await route.fulfill({ path: file });
    else await route.fulfill({ status: 404, body: '' });
  });
});

async function example(page: Page, category: string, slug: string, section: string): Promise<Locator> {
  await page.goto(`/v/latest/${category}/${slug}/examples`);
  const article = page.locator(`[id="${category}-${slug}-${section}"]`);
  const preview = article.locator('.example__preview');
  await article.scrollIntoViewIfNeeded();
  const load = article.locator('.example__load');
  if (await load.isVisible().catch(() => false)) await load.click();
  // Wait for the deferred live component, without relying on a fixed timeout.
  await expect(preview).toBeVisible();
  return article;
}

async function insideViewport(element: Locator): Promise<void> {
  await expect(element).toBeVisible();
  await expect.poll(() => element.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return rect.top >= -1 && rect.left >= -1 && rect.bottom <= innerHeight + 1 && rect.right <= innerWidth + 1;
  })).toBe(true);
}

test('upload viewer keeps its toolbar and filmstrip reachable through portrait and landscape resizes', async ({ page }) => {
  // Zoom controls are intentionally hidden below 600px; set explicit zoom in landscape before shrinking.
  await page.setViewportSize({ width: 844, height: 390 });
  const article = await example(page, 'components', 'upload-file', 'example-anh-va-tai-lieu-xem-truoc');
  await article.getByRole('button', { name: 'hien-truong-1.jpg', exact: true }).click();
  const viewer = page.locator('.sd-upload-file-viewer');
  await expect(viewer.locator('.sd-upload-file-viewer__percent')).toBeVisible();
  await viewer.locator('.sd-upload-file-viewer__stage').press('+');
  const zoom = await viewer.locator('.sd-upload-file-viewer__percent').innerText();

  for (const size of SIZES) {
    await page.setViewportSize(size);
    await insideViewport(viewer);
    await insideViewport(viewer.locator('.sd-upload-file-viewer__bar'));
    await insideViewport(viewer.locator('.sd-upload-file-viewer__strip'));
    await expect(viewer.locator('.sd-upload-file-viewer__percent')).toHaveText(zoom);
  }
  const last = viewer.locator('.sd-upload-file-viewer__thumb').last();
  await last.click();
  await expect(last).toHaveAttribute('aria-current', 'true');
  await viewer.locator('.sd-upload-file-viewer__stage').press('Escape');
  await expect(viewer).toBeHidden();
});

test('confirm sheet keeps actions outside its scrolling choices at small heights', async ({ page }) => {
  const article = await example(page, 'services', 'confirm', 'example-chon-radio-dang-doc');
  await article.getByRole('button', { name: 'Chọn phòng ban dạng dọc', exact: true }).click();
  const sheet = page.locator('.sd-confirm-bottom-sheet mat-bottom-sheet-container');
  const content = sheet.locator('.sd-dialog-confirm__content--sheet');
  for (const size of SIZES) {
    await page.setViewportSize(size);
    await insideViewport(sheet);
    await insideViewport(sheet.locator('[data-confirm-accept] button'));
    await insideViewport(sheet.locator('[data-confirm-cancel] button'));
    await expect.poll(() => sheet.evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
  }
  await expect.poll(() => content.evaluate(node => node.scrollHeight - node.clientHeight)).toBeGreaterThan(0);
  await sheet.getByRole('radio', { name: 'Tài chính', exact: true }).check();
  await expect(sheet.getByRole('radio', { name: 'Tài chính', exact: true })).toBeChecked();
  await sheet.locator('[data-confirm-accept] button').click();
  await expect(sheet).toBeHidden();
});

test('docs search keeps its footer visible when resizing across the mobile breakpoint', async ({ page }) => {
  await page.goto('/v/latest');
  await page.getByRole('button', { name: 'Search docs', exact: true }).click();
  const dialog = page.locator('.search-dialog');
  await dialog.locator('input').fill('table');
  await expect(dialog.getByRole('option').first()).toBeVisible();
  for (const size of SIZES) {
    await page.setViewportSize(size);
    await insideViewport(dialog);
    await insideViewport(dialog.locator('footer button'));
    await insideViewport(dialog.locator('.search-dialog__field button'));
    await expect.poll(() => dialog.evaluate(node => node.scrollHeight - node.clientHeight)).toBeLessThanOrEqual(1);
  }
  await dialog.locator('footer button').click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/search\?q=table/);
});
