// Wave 3 · 4b–4d screenshots of the Upload File examples page. Usage: node shots-wave3-4.mjs <baseUrl> <outDir>
// Field (images + documents, hover badge), drop zone with the required error and while files are dragged over, uploading
// and failed rows, refused files, the inline variant in a table, read-only "+N", and the viewer (image fitted and zoomed,
// PDF inline, a file without preview), in light, dark, forced colours and a 390px touch viewport.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
// why: PW_EXECUTABLE cho máy có bản Chromium của Playwright khác bản showcase đang ghim.
const browser = await chromium.launch(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {});

async function shootBox(page, locator, name, pad = 12) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const box = await locator.boundingBox();
  await page.screenshot({ path: join(outDir, `${name}.png`), clip: { x: box.x - pad, y: box.y - pad, width: box.width + pad * 2, height: box.height + pad * 2 } });
  console.log('ok', name);
}

async function shootPage(page, name) {
  await page.screenshot({ path: join(outDir, `${name}.png`) });
  console.log('ok', name);
}

const pdf = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');

async function run(mode, options, prepare) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(base + '/v/latest/components/upload-file/examples', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (prepare) await prepare(page);
  // why: mỗi lần bấm, nút đó biến mất — luôn bấm nút đầu còn lại.
  const loadButtons = page.getByRole('button', { name: 'Load live preview' });
  while ((await loadButtons.count()) > 0) {
    await loadButtons.first().click();
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(2000);
  const fields = page.locator('sd-upload-file');
  const mixed = fields.nth(2);
  const phone = !!options.hasTouch;

  // 1. Ảnh + tài liệu, rê chuột vào ô ảnh đầu (scrim + badge xoá).
  if (!phone) await mixed.locator('.sd-upload-file__tile').first().hover();
  await shootBox(page, mixed, `${mode}-1-field-images-and-documents`);

  // 2. Tài liệu + required: bấm Kiểm tra.
  const documents = fields.nth(1);
  await page.getByRole('button', { name: 'Kiểm tra' }).click();
  await page.waitForTimeout(300);
  await shootBox(page, documents, `${mode}-2-dropzone-required-error`);

  if (mode === 'light') {
    // 3. Đang kéo tệp vào vùng thả.
    await documents.evaluate(el => {
      const data = new DataTransfer();
      data.items.add(new File(['x'], 'a.pdf', { type: 'application/pdf' }));
      el.dispatchEvent(new DragEvent('dragenter', { dataTransfer: data, bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(200);
    await shootBox(page, documents, `${mode}-3-dropzone-dragging`);
    await documents.evaluate(el => el.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true })));

    // 4. Chọn tệp: một PDF hợp lệ và một tệp quá 5 MB (nằm lại với lý do), rồi upload() đang chạy.
    const chooser = page.waitForEvent('filechooser');
    await mixed.locator('.sd-upload-file__add').click();
    await (await chooser).setFiles([
      { name: 'bien-ban-nghiem-thu.pdf', mimeType: 'application/pdf', buffer: pdf },
      { name: 'video-hien-truong.zip', mimeType: 'application/zip', buffer: Buffer.alloc(6 * 1024 * 1024) },
    ]);
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: 'Gọi upload()' }).click();
    await page.waitForTimeout(400);
    await shootBox(page, mixed, `${mode}-4-uploading-and-refused`);
    await page.waitForTimeout(1800);

    // 5. Lỗi tải lên: bật mô phỏng lỗi, thêm tệp, upload().
    await page.getByLabel('Mô phỏng lỗi tải lên').check();
    const chooser2 = page.waitForEvent('filechooser');
    await mixed.locator('.sd-upload-file__add').click();
    await (await chooser2).setFiles([{ name: 'phu-luc-02.pdf', mimeType: 'application/pdf', buffer: pdf }]);
    await page.waitForTimeout(400);
    await page.getByRole('button', { name: 'Gọi upload()' }).click();
    await page.waitForTimeout(2200);
    await page.mouse.move(0, 0);
    await shootBox(page, mixed, `${mode}-5-upload-failed`);
  }

  // 6. Inline trong bảng, 7. chỉ xem (+N).
  await shootBox(page, page.locator('.inline-table'), `${mode}-6-inline-table`, 8);
  await shootBox(page, fields.last(), `${mode}-7-readonly-more`);

  // why: toast của bước mô phỏng lỗi che toolbar của popup.
  for (const close of await page.locator('.sd-toast button, [class*="toast"] button').all()) await close.click().catch(() => undefined);
  await page.waitForTimeout(300);

  // 8–10. Popup: ảnh vừa khung, phóng to, PDF, file không xem trước.
  await mixed.locator('.sd-upload-file__open').first().click();
  await page.waitForTimeout(800);
  await shootPage(page, `${mode}-8-viewer-image-fit`);
  if (!phone) {
    await page.keyboard.press('+');
    await page.keyboard.press('+');
    await page.waitForTimeout(300);
    await shootPage(page, `${mode}-9-viewer-image-zoomed`);
  }
  await page.keyboard.press('0');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(800);
  await shootPage(page, `${mode}-10-viewer-pdf`);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(400);
  await shootPage(page, `${mode}-11-viewer-no-preview`);
  await page.keyboard.press('Escape');
  await context.close();
}

const desktop = { viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1, reducedMotion: 'reduce' };
await run('light', desktop);
await run('dark', desktop, page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark')));
await run('forced', { ...desktop, forcedColors: 'active' });
await run('phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
await browser.close();
