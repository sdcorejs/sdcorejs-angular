import { expect, test, type Locator, type Page } from '@playwright/test';

// Typing in sd-date and sd-datetime through the real keyboard of the forms demos.
// A value that is being edited must not change `model` or emit `sdChange` until the text is a finished
// date; it becomes null only when the user commits the removal (leaves the field or presses Enter on an
// empty field). The "Chốt giá trị khi gõ" section of each demo logs every `sdChange`.

const SECTION = 'example-chot-gia-tri-khi-go';

interface Demo {
  page: Page;
  input: Locator;
  model: Locator;
  log: Locator;
  error: Locator;
}

/**
 * Opens one demo and brings its commit-log section into view. The Examples tab renders each section as its
 * own preview, created only once it scrolls into the viewport (@defer on viewport).
 */
const open = async (page: Page, control: 'date' | 'datetime'): Promise<Demo> => {
  await page.goto(`/v/latest/forms/${control}/examples`);
  const preview = page.locator(`[id="forms-${control}-${SECTION}-preview"]`);
  await preview.scrollIntoViewIfNeeded();
  await expect(preview.locator('demo-section')).toBeVisible();
  const input = preview.locator(`[data-autoid="forms-${control}-commit"]`);
  await expect(input).toBeVisible();
  return {
    page,
    input,
    model: preview.locator('[data-e2e="commit-model"]'),
    log: preview.locator('[data-e2e="commit-log"]'),
    error: preview.locator('mat-error'),
  };
};

/** Puts the caret `fromEnd` characters before the end of the text. */
const caretFromEnd = async (input: Locator, fromEnd: number): Promise<void> => {
  await input.click();
  await input.press('End');
  for (let step = 0; step < fromEnd; step++) await input.press('ArrowLeft');
};

/** Selects the whole text with the keyboard (the fields block Ctrl+A). */
const selectAll = async (input: Locator): Promise<void> => {
  await input.click();
  await input.press('End');
  await input.press('Shift+Home');
};

const logOf = async (log: Locator): Promise<unknown[]> => JSON.parse((await log.textContent()) ?? '[]');

test.describe('sd-date typing', () => {
  test('editing the month in place (19/11/2026 -> 19/10/2026) never passes through null', async ({ page }) => {
    const { input, model, log } = await open(page, 'date');
    await expect(input).toHaveValue('19/11/2026');

    await caretFromEnd(input, 5);
    await input.press('Backspace');
    await expect(input).not.toHaveValue('19/11/2026');
    await expect(model).toHaveText('2026/11/19');
    await expect(log).toHaveText('[]');

    await input.press('0');
    await expect(input).toHaveValue('19/10/2026');
    await expect(model).toHaveText('2026/10/19');
    await expect(log).toHaveText('["2026/10/19"]');

    await input.press('Tab');
    await expect(input).toHaveValue('19/10/2026');
    await expect(model).toHaveText('2026/10/19');
    expect(await logOf(log)).toEqual(['2026/10/19']);
  });

  test('typing over the selected month commits once', async ({ page }) => {
    const { input, model, log } = await open(page, 'date');

    await input.click();
    await input.press('Home');
    for (let step = 0; step < 3; step++) await input.press('ArrowRight');
    await input.press('Shift+ArrowRight');
    await input.press('Shift+ArrowRight');
    await input.pressSequentially('10');

    await expect(input).toHaveValue('19/10/2026');
    await input.press('Tab');
    await expect(model).toHaveText('2026/10/19');
    expect(await logOf(log)).toEqual(['2026/10/19']);
  });

  test('retyping the last digit of the year emits nothing', async ({ page }) => {
    const { input, model, log } = await open(page, 'date');

    await caretFromEnd(input, 0);
    await input.press('Backspace');
    await expect(input).toHaveValue('19/11/202');
    await expect(model).toHaveText('2026/11/19');
    await input.press('6');
    await input.press('Tab');

    await expect(input).toHaveValue('19/11/2026');
    await expect(model).toHaveText('2026/11/19');
    await expect(log).toHaveText('[]');
  });

  test('an emptied field keeps the value until the user leaves it', async ({ page }) => {
    const { input, model, log } = await open(page, 'date');

    await selectAll(input);
    await input.press('Backspace');
    await expect(input).toHaveValue('');
    await expect(model).toHaveText('2026/11/19');
    await expect(log).toHaveText('[]');

    await input.press('Tab');
    await expect(model).toHaveText('null');
    expect(await logOf(log)).toEqual([null]);
  });

  test('unfinished text stays in the field with the format error; the value is kept', async ({ page }) => {
    const { input, model, log, error } = await open(page, 'date');

    await caretFromEnd(input, 0);
    for (let step = 0; step < 5; step++) await input.press('Backspace');
    await expect(input).toHaveValue('19/1');
    await expect(error).toHaveCount(0);
    await input.press('Enter');
    await expect(input).toHaveValue('19/1');
    await expect(error).toHaveText('Sai định dạng');

    await input.press('Tab');
    await expect(input).toHaveValue('19/1');
    await expect(error).toHaveText('Sai định dạng');
    await expect(model).toHaveText('2026/11/19');
    await expect(log).toHaveText('[]');
  });

  test('a date that does not exist stays in the field with the invalid-date error; the value is kept', async ({ page }) => {
    const { input, model, log, error } = await open(page, 'date');

    await selectAll(input);
    await input.pressSequentially('31022026');
    await expect(input).toHaveValue('31/02/2026');
    // Thông báo chỉ hiện sau khi ô đã được chạm (rời ô / Enter), như mọi lỗi khác của control.
    await expect(error).toHaveCount(0);

    await input.press('Tab');
    await expect(input).toHaveValue('31/02/2026');
    await expect(error).toHaveText('Ngày không hợp lệ');
    await expect(model).toHaveText('2026/11/19');
    await expect(log).toHaveText('[]');
  });

  test('correcting a date that does not exist clears the error and commits the corrected date', async ({ page }) => {
    const { input, model, log, error } = await open(page, 'date');

    await selectAll(input);
    await input.pressSequentially('31022026');
    await input.press('Tab');
    await expect(error).toHaveText('Ngày không hợp lệ');

    await input.click();
    await input.press('Home');
    await input.press('Shift+ArrowRight');
    await input.press('Shift+ArrowRight');
    await input.pressSequentially('28');
    await expect(input).toHaveValue('28/02/2026');
    await expect(error).toHaveCount(0);

    await input.press('Tab');
    await expect(model).toHaveText('2026/02/28');
    expect(await logOf(log)).toEqual(['2026/02/28']);
  });

  test('emptying a field that shows a date that does not exist commits null once it is left', async ({ page }) => {
    const { input, model, log, error } = await open(page, 'date');

    await selectAll(input);
    await input.pressSequentially('31022026');
    await input.press('Tab');
    await expect(error).toHaveText('Ngày không hợp lệ');

    await selectAll(input);
    await input.press('Backspace');
    await input.press('Tab');
    await expect(error).toHaveCount(0);
    await expect(model).toHaveText('null');
    expect(await logOf(log)).toEqual([null]);
  });

  test('replacing the whole date by typing never passes through null', async ({ page }) => {
    const { input, model, log } = await open(page, 'date');

    await selectAll(input);
    await input.pressSequentially('05012027');
    await expect(input).toHaveValue('05/01/2027');
    await expect(model).toHaveText('2027/01/05');

    await input.press('Tab');
    expect(await logOf(log)).toEqual(['2027/01/05']);
  });

  test('Enter commits a finished date without leaving the field', async ({ page }) => {
    const { input, model, log } = await open(page, 'date');

    await caretFromEnd(input, 5);
    await input.press('Backspace');
    await input.press('0');
    await input.press('Enter');

    await expect(input).toBeFocused();
    await expect(model).toHaveText('2026/10/19');
    expect(await logOf(log)).toEqual(['2026/10/19']);
  });
});

test.describe('sd-datetime typing', () => {
  for (const text of ['31/02/2026 10:30', '19/11/2026 25:30']) {
    test(`"${text}" stays in the field with the invalid-date error; the value is kept`, async ({ page }) => {
      const { input, model, log, error } = await open(page, 'datetime');

      await selectAll(input);
      await input.pressSequentially(text);
      await expect(input).toHaveValue(text);

      await input.press('Tab');
      await expect(input).toHaveValue(text);
      await expect(error).toHaveText('Ngày giờ không hợp lệ');
      await expect(model).toHaveText('2026/11/19 10:30:00');
      await expect(log).toHaveText('[]');
    });
  }

  test('correcting a datetime that does not exist clears the error and commits the corrected one', async ({ page }) => {
    const { input, model, log, error } = await open(page, 'datetime');

    await selectAll(input);
    await input.pressSequentially('31/02/2026 10:30');
    await input.press('Tab');
    await expect(error).toHaveText('Ngày giờ không hợp lệ');

    await input.click();
    await input.press('Home');
    await input.press('Shift+ArrowRight');
    await input.press('Shift+ArrowRight');
    await input.pressSequentially('28');
    await expect(input).toHaveValue('28/02/2026 10:30');
    await expect(error).toHaveCount(0);

    await input.press('Tab');
    await expect(model).toHaveText('2026/02/28 10:30:00');
    expect(await logOf(log)).toEqual(['2026/02/28 10:30:00']);
  });
  test('editing the month in place is not read as January in between', async ({ page }) => {
    const { input, model, log } = await open(page, 'datetime');
    await expect(input).toHaveValue('19/11/2026 10:30');

    await caretFromEnd(input, 11);
    await input.press('Backspace');
    await expect(input).toHaveValue('19/1/2026 10:30');
    await expect(model).toHaveText('2026/11/19 10:30:00');
    await expect(log).toHaveText('[]');

    await input.press('0');
    await expect(input).toHaveValue('19/10/2026 10:30');
    await expect(model).toHaveText('2026/10/19 10:30:00');

    await input.press('Tab');
    expect(await logOf(log)).toEqual(['2026/10/19 10:30:00']);
  });

  test('editing the hour in place is not read as 01:30 in between', async ({ page }) => {
    const { input, model, log } = await open(page, 'datetime');

    await caretFromEnd(input, 3);
    await input.press('Backspace');
    await expect(input).toHaveValue('19/11/2026 1:30');
    await expect(model).toHaveText('2026/11/19 10:30:00');
    await expect(log).toHaveText('[]');

    await input.press('5');
    await expect(model).toHaveText('2026/11/19 15:30:00');
    await input.press('Tab');
    expect(await logOf(log)).toEqual(['2026/11/19 15:30:00']);
  });

  test('an emptied field keeps the value until the user leaves it', async ({ page }) => {
    const { input, model, log } = await open(page, 'datetime');

    await selectAll(input);
    await input.press('Backspace');
    await expect(input).toHaveValue('');
    await expect(model).toHaveText('2026/11/19 10:30:00');
    await expect(log).toHaveText('[]');

    await input.press('Tab');
    await expect(model).toHaveText('null');
    expect(await logOf(log)).toEqual([null]);
  });

  test('unfinished text keeps the value on Enter and on leaving the field', async ({ page }) => {
    const { input, model, log } = await open(page, 'datetime');

    await caretFromEnd(input, 0);
    for (let step = 0; step < 12; step++) await input.press('Backspace');
    await expect(input).toHaveValue('19/1');
    await input.press('Enter');
    await expect(model).toHaveText('2026/11/19 10:30:00');

    await input.press('Tab');
    await expect(model).toHaveText('2026/11/19 10:30:00');
    await expect(log).toHaveText('[]');
  });

  test('replacing the whole datetime by typing never passes through null', async ({ page }) => {
    const { input, model, log } = await open(page, 'datetime');

    await selectAll(input);
    await input.pressSequentially('05/01/2027 08:00');
    await expect(model).toHaveText('2027/01/05 08:00:00');

    await input.press('Tab');
    expect(await logOf(log)).toEqual(['2027/01/05 08:00:00']);
  });
});
