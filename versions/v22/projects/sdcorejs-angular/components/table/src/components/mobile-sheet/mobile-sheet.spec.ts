import { SD_TABLE_SHEET_DISMISS_DISTANCE, SdTableSheetHistory, sdTableSheetSwipe } from './mobile-sheet';

/** A window double: records history calls and lets the spec fire popstate. */
const fakeWindow = () => {
  const listeners = new Set<() => void>();
  const history = { state: { navigationId: 3 }, pushState: jasmine.createSpy('pushState'), go: jasmine.createSpy('go') };
  const location = { href: 'https://app.test/orders' };
  const window = {
    history,
    location,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  };
  return {
    window: window as unknown as Window,
    history,
    location,
    popstate: () => [...listeners].forEach(listener => listener()),
    listeners,
  };
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

  it('only forgets the levels when the URL changed since they opened', () => {
    const { window, history, location, popstate, listeners } = fakeWindow();
    const sheet = new SdTableSheetHistory(window);
    const back = jasmine.createSpy('back');
    sheet.push(back);
    sheet.push(back);
    // The router navigated (or the app wrote query params) while the sheet was open.
    location.href = 'https://app.test/orders?status=new';
    sheet.release();
    expect(history.go).not.toHaveBeenCalled();
    expect(sheet.depth).toBe(0);
    expect(listeners.size).toBe(0);
    popstate();
    expect(back).not.toHaveBeenCalled();
  });

  it('compares with the URL of the first level, not of a later one', () => {
    const { window, history, location } = fakeWindow();
    const sheet = new SdTableSheetHistory(window);
    sheet.push(() => undefined);
    location.href = 'https://app.test/other';
    sheet.push(() => undefined);
    location.href = 'https://app.test/orders';
    sheet.release();
    expect(history.go).toHaveBeenCalledOnceWith(-2);
  });

  it('adds no entries while the table sits in an overlay', () => {
    const { window, history, popstate } = fakeWindow();
    const pane = document.createElement('div');
    pane.className = 'cdk-overlay-pane';
    const owner = document.createElement('sd-table');
    pane.appendChild(owner);
    const sheet = new SdTableSheetHistory(window, owner);
    const back = jasmine.createSpy('back');
    sheet.push(back);
    sheet.release();
    popstate();
    expect(history.pushState).not.toHaveBeenCalled();
    expect(history.go).not.toHaveBeenCalled();
    expect(back).not.toHaveBeenCalled();
    expect(sheet.depth).toBe(0);
  });

  it('does nothing without a window', () => {
    const sheet = new SdTableSheetHistory(null);
    sheet.push(() => undefined);
    expect(() => sheet.release()).not.toThrow();
    expect(sheet.depth).toBe(0);
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

  it('ignores a drag that starts on a button, a link or an input, or with another mouse button', () => {
    const dismiss = jasmine.createSpy('dismiss');
    const button = document.createElement('button');
    handle.appendChild(button);
    const cleanup = sdTableSheetSwipe(handle, dismiss);
    button.dispatchEvent(new PointerEvent('pointerdown', { clientY: 100, button: 0, pointerId: 1, bubbles: true }));
    pointer('pointermove', 300);
    pointer('pointerup', 300);
    handle.dispatchEvent(new PointerEvent('pointerdown', { clientY: 100, button: 2, pointerId: 1, bubbles: true }));
    pointer('pointermove', 300);
    pointer('pointerup', 300);
    expect(container.style.transform).toBe('');
    expect(dismiss).not.toHaveBeenCalled();
    cleanup();
  });

  it('puts the sheet back on pointercancel, and drags without pointer capture', () => {
    const dismiss = jasmine.createSpy('dismiss');
    spyOn(handle, 'setPointerCapture').and.throwError(new DOMException('not active', 'NotFoundError'));
    const cleanup = sdTableSheetSwipe(handle, dismiss);
    pointer('pointerdown', 100);
    pointer('pointermove', 300);
    expect(container.style.transform).toBe('translateY(200px)');
    pointer('pointercancel', 300);
    expect(container.style.transform).toBe('');
    pointer('pointerup', 300);
    expect(dismiss).not.toHaveBeenCalled();
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
