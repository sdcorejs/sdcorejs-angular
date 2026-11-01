import { SD_TABLE_SHEET_DISMISS_DISTANCE, SdTableSheetHistory, sdTableSheetSwipe } from './mobile-sheet';

/** A window double: records history calls and lets the spec fire popstate. */
const fakeWindow = () => {
  const listeners = new Set<() => void>();
  const history = { state: { navigationId: 3 }, pushState: jasmine.createSpy('pushState'), go: jasmine.createSpy('go') };
  const window = {
    history,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  return { window: window as unknown as Window, history, popstate: () => [...listeners].forEach(listener => listener()), listeners };
};

describe('SdTableSheetHistory', () => {
  it('pushes one entry per level with the same state, and Back runs the top level', () => {
    const { window, history, popstate } = fakeWindow();
    const sheet = new SdTableSheetHistory(window);
    const closeSheet = jasmine.createSpy('close sheet');
    const leavePage = jasmine.createSpy('leave sub page');
    sheet.push(closeSheet);
    sheet.push(leavePage);
    expect(history.pushState.calls.allArgs()).toEqual([
      [{ navigationId: 3 }, ''],
      [{ navigationId: 3 }, ''],
    ]);
    popstate();
    expect(leavePage).toHaveBeenCalledTimes(1);
    expect(closeSheet).not.toHaveBeenCalled();
    popstate();
    expect(closeSheet).toHaveBeenCalledTimes(1);
    expect(sheet.depth).toBe(0);
  });

  it('takes the entries back when the UI closes, and ignores the popstate that causes', () => {
    const { window, history, popstate, listeners } = fakeWindow();
    const sheet = new SdTableSheetHistory(window);
    const back = jasmine.createSpy('back');
    sheet.push(back);
    sheet.push(back);
    sheet.release();
    expect(history.go).toHaveBeenCalledOnceWith(-2);
    popstate();
    expect(back).not.toHaveBeenCalled();
    expect(listeners.size).toBe(0);
  });

  it('releases one level and keeps Back working for the rest', () => {
    const { window, history, popstate } = fakeWindow();
    const sheet = new SdTableSheetHistory(window);
    const closeSheet = jasmine.createSpy('close sheet');
    sheet.push(closeSheet);
    sheet.push(() => fail('released level must not run'));
    sheet.release(1);
    expect(history.go).toHaveBeenCalledOnceWith(-1);
    popstate();
    expect(closeSheet).not.toHaveBeenCalled();
    popstate();
    expect(closeSheet).toHaveBeenCalledTimes(1);
  });

  it('stops listening on dispose', () => {
    const { window, listeners } = fakeWindow();
    const sheet = new SdTableSheetHistory(window);
    sheet.push(() => undefined);
    sheet.dispose();
    expect(listeners.size).toBe(0);
  });
});

describe('sdTableSheetSwipe', () => {
  let container: HTMLElement;
  let handle: HTMLElement;
  const pointer = (type: string, clientY: number) =>
    handle.dispatchEvent(new PointerEvent(type, { clientY, button: 0, pointerId: 1, bubbles: true }));

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'mat-bottom-sheet-container';
    handle = document.createElement('div');
    container.appendChild(handle);
    document.body.appendChild(container);
  });
  afterEach(() => container.remove());

  it('moves the sheet with the finger and closes it past the distance', () => {
    const dismiss = jasmine.createSpy('dismiss');
    const cleanup = sdTableSheetSwipe(handle, dismiss);
    pointer('pointerdown', 100);
    pointer('pointermove', 150);
    expect(container.style.transform).toBe('translateY(50px)');
    pointer('pointermove', 100 + SD_TABLE_SHEET_DISMISS_DISTANCE + 1);
    pointer('pointerup', 100 + SD_TABLE_SHEET_DISMISS_DISTANCE + 1);
    expect(dismiss).toHaveBeenCalledTimes(1);
    expect(container.style.transform).toBe('');
    cleanup();
  });

  it('puts the sheet back after a short drag or an upward one', () => {
    const dismiss = jasmine.createSpy('dismiss');
    const cleanup = sdTableSheetSwipe(handle, dismiss);
    pointer('pointerdown', 100);
    pointer('pointermove', 140);
    pointer('pointerup', 140);
    pointer('pointerdown', 100);
    pointer('pointermove', 20);
    expect(container.style.transform).toBe('');
    pointer('pointerup', 20);
    expect(dismiss).not.toHaveBeenCalled();
    cleanup();
    pointer('pointerdown', 0);
    pointer('pointermove', 500);
    expect(container.style.transform).toBe('');
  });
});
