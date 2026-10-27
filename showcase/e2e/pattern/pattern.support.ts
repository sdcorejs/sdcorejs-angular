import { expect, type Locator, type Page } from '@playwright/test';

// Helpers of the /pattern e2e (@sdcorejs/angular/modules/pattern mounted by the showcase).

export type PatternRole = 'admin' | 'staff' | 'viewer';
export type PatternFailure = 'none' | '500' | 'timeout' | '404' | '403';

export interface PatternState {
  readonly role?: PatternRole;
  readonly latencyMs?: number;
  readonly failure?: PatternFailure;
}

/**
 * Sets the sample toolbar state before the first load of the test (role, latency, simulated error). Later reloads
 * keep what the test changed since, like a real browser tab.
 */
export async function initPattern(page: Page, state: PatternState = {}): Promise<void> {
  await page.addInitScript(
    ({ role, latencyMs, failure }) => {
      if (sessionStorage.getItem('sd-pattern.e2e')) return;
      sessionStorage.setItem('sd-pattern.e2e', '1');
      sessionStorage.setItem('sd-pattern.role', JSON.stringify(role));
      sessionStorage.setItem('sd-pattern.mock-api', JSON.stringify({ latencyMs, failure }));
    },
    { role: state.role ?? 'admin', latencyMs: state.latencyMs ?? 0, failure: state.failure ?? 'none' }
  );
}

/** Opens a pattern route with the given toolbar state. */
export async function openPattern(page: Page, path: string, state: PatternState = {}): Promise<void> {
  await initPattern(page, state);
  await page.goto(`/pattern/${path}`);
}

/** The main table of the screen, once its rows are shown. */
export async function tableRows(page: Page, scope: Locator | Page = page): Promise<Locator> {
  const rows = scope.locator('sd-table tr.c-row');
  await expect(rows.first()).toBeVisible();
  return rows;
}

/** Types a quick search term and applies it with Enter (sd-table applies quick search on Enter). */
export async function quickSearch(page: Page, term: string): Promise<void> {
  const input = page
    .locator('sd-table')
    .getByPlaceholder(/Tìm theo/)
    .first();
  await input.fill(term);
  await input.press('Enter');
}

/** Picks a value of the "Lỗi giả lập" select of the toolbar. */
export async function simulateFailure(page: Page, label: 'Không' | '500' | 'Timeout' | '404' | '403'): Promise<void> {
  await page.locator('sd-pattern-toolbar').getByRole('radio', { name: label, exact: true }).click();
}

/** Picks a role in the toolbar; the current screen opens again with that role's permissions. */
export async function switchRole(page: Page, label: 'Quản trị' | 'Nhân viên' | 'Chỉ xem'): Promise<void> {
  await page.locator('sd-pattern-toolbar').getByRole('radio', { name: label }).click();
}

/** sd-button ignores a click within 300 ms of the previous one; a person never clicks Save that fast twice. */
export const throttleGap = (page: Page): Promise<void> => page.waitForTimeout(350);

/** The Core confirm dialog (SdConfirmService). */
export const confirmDialog = (page: Page): Locator => page.locator('mat-dialog-container');
