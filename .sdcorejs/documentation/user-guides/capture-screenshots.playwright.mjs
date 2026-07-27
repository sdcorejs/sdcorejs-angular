import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const guideDir = dirname(fileURLToPath(import.meta.url));
const imageDir = join(guideDir, 'images');
const baseUrl = process.env.SDCOREJS_DOCS_BASE_URL || readArg('--base-url') || 'http://localhost:4200';

// API-only guides (for example angular-modern-api-migration) intentionally have no screenshot entry.
const screenshots = [
  // TODO(user-guide): register the SdTable empty-result reload screenshot after
  // Showcase exposes a dedicated fixture with a stable route and selector.
  {
    module: 'datetime',
    title: 'SdDatetime showcase',
    route: '/v/latest/forms/datetime/examples',
    file: 'images/datetime-showcase.png',
    selector: 'app-datetime-demo',
    steps: [],
  },
  {
    module: 'time-controls-and-input-masks',
    title: 'SdTime showcase',
    route: '/v/latest/forms/time/examples',
    file: 'images/time-controls-showcase.png',
    selector: 'app-time-demo',
    steps: [],
  },
  {
    module: 'time-controls-and-input-masks',
    title: 'SdTimeRange showcase',
    route: '/v/latest/forms/time-range/examples',
    file: 'images/time-range-showcase.png',
    selector: 'app-time-range-demo',
    steps: [],
  },
  {
    module: 'time-controls-and-input-masks',
    title: 'SdInput mask showcase',
    route: '/v/latest/forms/input/examples',
    file: 'images/input-mask-showcase.png',
    selector: 'app-input-demo',
    steps: [],
  },
  {
    module: 'viewport-responsive-layout',
    title: 'SdViewportService showcase',
    route: '/v/latest/services/viewport/examples',
    file: 'images/viewport-responsive-showcase.png',
    selector: 'app-viewport-demo',
    steps: [],
  },
  {
    module: 'viewport-responsive-layout',
    title: 'SdLayout account-menu showcases',
    route: '/v/latest/modules-integrations/layout/examples',
    file: 'images/layout-account-menu-showcase.png',
    selector: 'app-layout-demo',
    steps: [],
  },
  {
    module: 'breadcrumb-and-data-state',
    title: 'SdBreadcrumb showcase',
    route: '/v/latest/components/breadcrumb/examples',
    file: 'images/breadcrumb-showcase.png',
    selector: 'app-breadcrumb-demo',
    steps: [],
  },
  {
    module: 'breadcrumb-and-data-state',
    title: 'SdDataState showcase',
    route: '/v/latest/components/data-state/examples',
    file: 'images/data-state-showcase.png',
    selector: 'app-data-state-demo',
    steps: [],
  },
  {
    module: 'entity-picker-and-tree-select',
    title: 'SdEntityPicker showcase',
    route: '/v/latest/forms/entity-picker/examples',
    file: 'images/entity-picker-showcase.png',
    selector: 'app-entity-picker-demo',
    steps: [],
  },
  {
    module: 'entity-picker-and-tree-select',
    title: 'SdTreeSelect showcase',
    route: '/v/latest/forms/tree-select/examples',
    file: 'images/tree-select-showcase.png',
    selector: 'app-tree-select-demo',
    steps: [],
  },
  {
    module: 'unsaved-changes',
    title: 'SdUnsavedChangesService showcase',
    route: '/v/latest/services/unsaved-changes/examples',
    file: 'images/unsaved-changes-showcase.png',
    selector: 'app-unsaved-changes-demo',
    steps: [],
  },
  {
    module: 'task-and-job-progress',
    title: 'SdTaskService showcase',
    route: '/v/latest/services/task/examples',
    file: 'images/task-service-showcase.png',
    selector: 'app-task-demo',
    steps: [],
  },
  {
    module: 'task-and-job-progress',
    title: 'SdJobProgress showcase',
    route: '/v/latest/components/job-progress/examples',
    file: 'images/job-progress-showcase.png',
    selector: 'app-job-progress-demo',
    steps: [],
  },
  {
    module: 'audit-diff',
    title: 'SdAuditDiff showcase',
    route: '/v/latest/components/audit-diff/examples',
    file: 'images/audit-diff-showcase.png',
    selector: 'app-audit-diff-demo',
    steps: [],
  },
  {
    module: 'release-1-4-migration',
    title: 'Persistence showcase',
    route: '/v/latest/services/persistence/examples',
    file: 'images/persistence-showcase.png',
    selector: 'app-persistence-demo',
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
      throw new Error(
        `Không capture được "${item.title}" tại ${url} bằng selector ${item.selector}. Kiểm tra showcase đang chạy và route hợp lệ.`,
        {
          cause: error,
        }
      );
    }
  }
} finally {
  await browser.close();
}
