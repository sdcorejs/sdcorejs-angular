// Wave 3 · 3c + 3d screenshots of the live route /demo/tab-router. Usage: node shots-wave3-3cd.mjs <baseUrl> <outDir>
// Keyboard focus moved with →, the right-click menu, a tab being dragged over its drop spot, and the unsaved dot (on the open
// tab and on a hovered tab), in light, dark, forced colours and a 390px touch viewport. Prints the browser title with
// syncBrowserTitle on, clean and dirty.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const require = createRequire(new URL('../../../showcase/package.json', import.meta.url));
const { chromium } = require('@playwright/test');
const [base, outDir] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
// why: PW_EXECUTABLE cho máy có bản Chromium của Playwright khác bản showcase đang ghim.
const browser = await chromium.launch(process.env.PW_EXECUTABLE ? { executablePath: process.env.PW_EXECUTABLE } : {});

async function shoot(page, name, height = 140) {
  const box = await page.locator('sd-tab-router-outlet').boundingBox();
  await page.screenshot({ path: join(outDir, `${name}.png`), clip: { x: box.x - 8, y: box.y - 8, width: Math.min(box.width + 16, 1000), height } });
  console.log('ok', name);
}

async function open(page, prepare) {
  await page.goto(base + '/demo/tab-router/overview', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  if (prepare) await prepare(page);
  await page.locator('[data-tab-live="five"] button').click();
  await page.waitForTimeout(1500);
  await page.mouse.move(0, 0);
}

async function run(mode, options, prepare) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await open(page, prepare);
  const tabs = page.locator('[role="tab"]');

  if (!options.hasTouch) {
    // Bàn phím: focus vào tab đang mở rồi → sang tab kế.
    await tabs.nth(4).focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    await page.waitForTimeout(200);
    await shoot(page, `${mode}-1-keyboard-focus`);

    // Menu chuột phải trên tab thứ hai.
    const second = await tabs.nth(1).boundingBox();
    await page.mouse.click(second.x + 40, second.y + 16, { button: 'right' });
    await page.waitForTimeout(300);
    await page.locator('.tab-router__context-item').first().hover();
    await shoot(page, `${mode}-2-context-menu`, 150);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    if (mode === 'light') {
      // Kéo tab thứ hai sang phải (giữ chuột để chụp bản kéo và chỗ thả).
      await page.mouse.move(second.x + 40, second.y + 16);
      await page.mouse.down();
      await page.mouse.move(second.x + 120, second.y + 16, { steps: 8 });
      await page.mouse.move(second.x + 200, second.y + 18, { steps: 8 });
      await page.waitForTimeout(300);
      await shoot(page, `${mode}-3-dragging`, 80);
      await page.mouse.up();
      await page.waitForTimeout(400);
    }
  }

  // Chấm chưa lưu: đánh dấu màn đang mở, rồi rê vào một tab khác cũng dirty.
  await page.locator('.tab-router__pane.active [data-tab-live="dirty"]').check();
  await tabs.nth(2).click();
  await page.waitForTimeout(500);
  await page.locator('.tab-router__pane.active [data-tab-live="dirty"]').check();
  await page.mouse.move(0, 0);
  await page.waitForTimeout(300);
  await shoot(page, `${mode}-4-unsaved-dots`, 80);
  if (!options.hasTouch) {
    await tabs.nth(4).hover();
    await page.waitForTimeout(200);
    await shoot(page, `${mode}-5-unsaved-hover-shows-close`, 80);
  }

  if (mode === 'light') {
    await page.locator('[data-tab-live="sync-title"]').check();
    await page.waitForTimeout(300);
    console.log('title dirty:', await page.title());
    await page.locator('.tab-router__pane.active [data-tab-live="dirty"]').uncheck();
    await page.waitForTimeout(300);
    console.log('title clean:', await page.title());
    await page.locator('[data-tab-live="sync-title"]').uncheck();
    await page.waitForTimeout(300);
    console.log('title off:', await page.title());
  }
  await context.close();
}

const desktop = { viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' };
await run('light', desktop);
await run('dark', desktop, page => page.evaluate(() => document.documentElement.setAttribute('data-sd-theme', 'dark')));
await run('forced', { ...desktop, forcedColors: 'active' });
await run('phone', { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
await browser.close();
