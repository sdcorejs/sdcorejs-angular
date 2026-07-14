import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const guideDir = dirname(fileURLToPath(import.meta.url));
const imageDir = join(guideDir, 'images');
const baseUrl = process.env.SDCOREJS_DOCS_BASE_URL || readArg('--base-url') || 'http://localhost:4200';

const screenshots = [
  {
    module: 'datetime',
    title: 'SdDatetime showcase',
    route: '/v/latest/forms/datetime/examples',
    file: 'images/datetime-showcase.png',
    selector: 'app-datetime-demo',
    steps: [],
  },
];

function readArg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function loadChromium() {
  try {
    const { chromium } = await import('playwright');
    return chromium;
  } catch (error) {
    throw new Error('Không thể load Playwright. Hãy cài package `playwright` trong môi trường capture trước khi chạy script.', {
      cause: error,
    });
  }
}

await mkdir(imageDir, { recursive: true });
const chromium = await loadChromium();
const browser = await chromium.launch();

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  for (const item of screenshots) {
    const url = new URL(item.route, baseUrl).href;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
      for (const step of item.steps ?? []) await step(page);
      const target = page.locator(item.selector).first();
      await target.waitFor({ state: 'visible', timeout: 15_000 });
      await target.screenshot({ path: join(guideDir, item.file) });
      process.stdout.write(`captured ${item.file}\n`);
    } catch (error) {
      throw new Error(`Không capture được "${item.title}" tại ${url} bằng selector ${item.selector}. Kiểm tra showcase đang chạy và route hợp lệ.`, {
        cause: error,
      });
    }
  }
} finally {
  await browser.close();
}
