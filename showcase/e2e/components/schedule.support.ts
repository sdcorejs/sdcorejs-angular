import { expect, test, type Locator, type Page } from '@playwright/test';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Helpers shared by the E2E of sd-calendar, sd-kanban and sd-scheduler (handoff schedule-kanban, scheduler Step 0 H9,
// review RX #5).

declare global {
  interface Window {
    __t0: number;
    __long: number[];
    axe: { run: (context: Element) => Promise<{ violations: { id: string; impact: string }[] }> };
  }
}

// why: Playwright loads the e2e files as CommonJS here, so __dirname instead of import.meta.url.
const ROOT = resolve(__dirname, '../../..');
const AXE = resolve(ROOT, 'versions/v19/node_modules/axe-core/axe.min.js');

/** Runs axe-core on `root` (from versions/v19, no new dependency): no serious or critical violation. */
export async function axe(page: Page, root: Locator): Promise<void> {
  if (!existsSync(AXE)) test.skip(true, 'axe-core is not installed in versions/v19');
  await page.addScriptTag({ path: AXE });
  const handle = await root.elementHandle();
  const violations = await page.evaluate(async element => {
    const result = await window.axe.run(element!);
    return result.violations.filter(item => item.impact === 'serious' || item.impact === 'critical').map(item => `${item.id} (${item.impact})`);
  }, handle);
  expect(violations).toEqual([]);
}

/** Screenshots into `reports/<folder>/` of the handoff, written by the Bangkok project only. */
export function screenshots(folder: string): {
  shot: (root: Locator, name: string) => Promise<void>;
  shotAround: (page: Page, target: Locator, name: string, margin?: number) => Promise<void>;
} {
  const dir = resolve(ROOT, '.sdcorejs/handoff/schedule-kanban/reports', folder);
  // why: every test runs in both zone projects; only the Bangkok run writes, so a UTC run does not replace the
  // pictures with GMT+0 labels (calendar R2 A-21).
  const writes = (): boolean => test.info().project.name === 'asia-bangkok';
  return {
    async shot(root, name) {
      if (!writes()) return;
      mkdirSync(dir, { recursive: true });
      await root.screenshot({ path: resolve(dir, `${name}.png`), animations: 'disabled' });
    },
    /** A picture of `target` with a margin, so a focus ring drawn outside the element is in it. */
    async shotAround(page, target, name, margin = 8) {
      if (!writes()) return;
      mkdirSync(dir, { recursive: true });
      const box = (await target.boundingBox())!;
      const clip = { x: box.x - margin, y: box.y - margin, width: box.width + 2 * margin, height: box.height + 2 * margin };
      await page.screenshot({ path: resolve(dir, `${name}.png`), animations: 'disabled', clip });
    },
  };
}

/** An `sd-button` of an example, by its `autoId`. */
export const button = (page: Page, autoId: string): Locator => page.locator(`[data-autoid="components-button-${autoId}"]`).first();

/** Clicks a cycling switch of an example until its text shows `label`. */
export async function cycle(page: Page, autoId: string, label: string, tries = 6): Promise<void> {
  for (let index = 0; index < tries; index++) {
    const text = (await button(page, autoId).textContent()) ?? '';
    if (text.includes(label)) return;
    // why: sd-button throttles clicks for 300ms.
    await page.waitForTimeout(350);
    await button(page, autoId).click();
    await expect(button(page, autoId)).not.toHaveText(text);
  }
  throw new Error(`${autoId} never showed ${label}`);
}
