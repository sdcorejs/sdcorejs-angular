import { expect, test, type Locator, type Page } from '@playwright/test';

const basic = 'co-ban';
const materialPanel = 'mat-datepicker-content:has(mat-calendar.sd-date-panel)';

async function example(page: Page, slug: string, section = basic, group = 'forms') {
  await page.goto(`/v/latest/${group}/${slug}/examples`);
  const preview = page.locator(`[id="${group}-${slug}-example-${section}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  const load = preview.locator('.example__load');
  if (await load.isVisible()) await load.click();
  return preview;
}

function readFrame(panel: Locator) {
  return panel.evaluate(el => {
    const css = getComputedStyle(el);
    return [css.borderColor, css.borderRadius, css.backgroundColor, css.boxShadow];
  });
}

test('DP-01/02 floating surfaces use the select frame under both themes', async ({ page }) => {
  test.setTimeout(120_000);
  for (const theme of ['light', 'dark']) {
    const cases = [
      ['forms', 'select', basic, 'mat-select', '.sd-select-panel'],
      ['forms', 'autocomplete', basic, 'sd-autocomplete input', '.sd-autocomplete-panel'],
      ['forms', 'chip-calendar', 'lien-ket-hai-chieu', '[data-chip-calendar-open]', '.sd-chip-calendar-panel'],
      ['components', 'button', 'action-popover', '[data-autoid$="popover-basic"]', '.sd-action-popover'],
      ['components', 'query-bar', 'che-do-popover', '.c-add-filter', '.c-field-picker-menu'],
      ['forms', 'date', basic, '.sd-suffix-btn', materialPanel],
      ['forms', 'date-range', basic, '.sd-suffix-btn', materialPanel],
      ['forms', 'datetime', basic, '.sd-suffix-btn', '.sd-datetime-picker__panel'],
      ['forms', 'time', basic, '[data-time-picker-trigger]', '.sd-time-panel'],
    ];
    let selectFrame: string[] | undefined;
    for (const [group, slug, section, trigger, selector] of cases) {
      const preview = await example(page, slug, section, group);
      await page.evaluate(mode => document.documentElement.setAttribute('data-sd-theme', mode), theme);
      await preview.locator(trigger).first().click();
      const panel = page.locator(selector).last();
      await expect(panel, `${slug} ${theme}`).toBeVisible();
      const frame = await readFrame(panel);
      if (slug === 'select') {
        selectFrame = frame;
        expect(frame[1]).toBe('10px');
        expect(frame[3]).not.toBe('none');
        await expect(panel).toHaveCSS('padding-top', '4px');
        const option = panel.getByRole('option').first();
        await expect(option).toHaveCSS('border-radius', '6px');
        await expect(option).toHaveCSS('height', '36px');
      } else {
        expect(frame, `${slug} in ${theme}`).toEqual(selectFrame!);
      }
      if (slug === 'query-bar') {
        await panel.getByRole('option', { name: /Họ tên/ }).click();
        const chip = page.locator('.c-chip-popover');
        await expect(chip).toBeVisible();
        expect(await readFrame(chip)).toEqual(selectFrame!);
        await page.keyboard.press('Escape');
        await preview.locator('[data-autoid="query-bar-popover-saved-filters"]').click();
        const saved = page.locator('[data-autoid="query-bar-popover-panel-saved-filters"]');
        await expect(saved).toBeVisible();
        expect(await readFrame(saved)).toEqual(selectFrame!);
      }
      if (slug === 'date') {
        await expect(panel).toHaveCSS('width', '296px');
        await expect(panel).toHaveCSS('padding', '12px 8px 8px');
      }
      if (slug === 'time' || slug === 'datetime') {
        const hour = panel.getByRole('spinbutton').first();
        await expect(hour).toHaveCSS('width', '48px');
        await expect(hour).toHaveCSS('border-radius', '8px');
      }
      if (slug === 'button') {
        const row = panel.locator('.sd-action-item').first();
        await expect(row).toHaveCSS('min-height', '40px');
        await expect(row).toHaveCSS('border-radius', '6px');
      }
    }
  }
});

test('DP-04/05/10 selected days, range summary and high contrast survive close and reopen', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const preview = await example(page, 'date-range');
  const trigger = preview.locator('.sd-suffix-btn');
  await trigger.click();
  const panel = page.locator(materialPanel);
  await expect(panel).toHaveCSS('animation-name', 'none');
  const days = panel.locator('.mat-calendar-body-cell');
  await days.filter({ hasText: /^\s*8\s*$/ }).click();
  await expect(panel.locator('[aria-live="polite"]').filter({ hasText: 'Chọn ngày kết thúc' })).toBeVisible();
  await days.filter({ hasText: /^\s*12\s*$/ }).click();
  await expect(panel).toBeHidden();
  await trigger.click();
  await expect(panel.locator('[aria-live="polite"]').filter({ hasText: '5 ngày' })).toBeVisible();
  await expect(panel.locator('.mat-calendar-body-selected')).toHaveCount(2);
  await expect(panel.locator('.mat-calendar-body-selected').first()).toHaveCSS('font-weight', '600');
  await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
  const expected = await panel.evaluate(el => {
    const sample = document.createElement('span');
    sample.style.backgroundColor = 'Highlight';
    sample.style.forcedColorAdjust = 'none';
    el.append(sample);
    const color = getComputedStyle(sample).backgroundColor;
    sample.remove();
    return color;
  });
  await expect(panel.locator('.mat-calendar-body-selected').first()).toHaveCSS('background-color', expected);
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});
