import { Component, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SdLoadingService } from '@sdcorejs/angular/services/loading';
import { SdModalResizable } from '../../modal-resizable';
import { SdWindow, type SdWindowBeforeClose } from '..';

@Component({
  standalone: true,
  imports: [SdWindow],
  template: `<sd-window
    autoId="contract"
    [hideClose]="hideClose"
    [beforeClose]="beforeClose"
    [disableEscapeClose]="disableEscapeClose"
    [windowClass]="windowClass"
    (sdClosed)="closed = closed + 1"
    (sdCloseError)="closeError = $event">
    <span sdHeaderLeft>Window contract</span
    ><button sdHeaderRight [disabled]="headerActionDisabled" [style.display]="hideHeaderAction ? 'none' : ''">Extra action</button>
    <p>Default body projection</p>
    <button sdFooterRight>Apply</button>
  </sd-window>`,
})
class WindowHost {
  readonly window = viewChild.required(SdWindow);
  hideClose = false;
  headerActionDisabled = false;
  hideHeaderAction = false;
  disableEscapeClose = true;
  beforeClose: SdWindowBeforeClose | undefined;
  windowClass: string | string[] | Record<string, boolean> = '';
  closed = 0;
  closeError: unknown;
}

@Component({
  standalone: true,
  imports: [SdModalResizable],
  template: `<sd-modal-resizable autoId="legacy"
    ><span sdTitle>Legacy title</span>
    <p sdBody>Legacy body</p>
    <button sdFooterRight>Legacy footer</button></sd-modal-resizable
  >`,
})
class LegacyWindowHost {
  readonly window = viewChild.required(SdModalResizable);
}

describe('SdWindow public contracts and deprecated compatibility', () => {
  let fixture: ComponentFixture<WindowHost>;
  let host: WindowHost;
  let window: SdWindow;
  let refs: { closed: boolean; close: jasmine.Spy }[];
  const extraFixtures: ComponentFixture<LegacyWindowHost>[] = [];

  beforeEach(() => {
    refs = [];
    TestBed.configureTestingModule({
      imports: [WindowHost, LegacyWindowHost],
      providers: [
        {
          provide: SdLoadingService,
          useValue: {
            start: () => {
              const ref = { closed: false, close: jasmine.createSpy('close') };
              ref.close.and.callFake(() => {
                ref.closed = true;
              });
              refs.push(ref);
              return ref;
            },
          },
        },
      ],
    });
    fixture = TestBed.createComponent(WindowHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    window = host.window();
  });

  afterEach(() => {
    fixture.destroy();
    extraFixtures.forEach(item => item.destroy());
    extraFixtures.length = 0;
  });

  const panel = () => document.getElementById(window.id)!;

  it('exports the old component name as the same constructor, without a duplicate Angular component', () => {
    expect(SdModalResizable).toBe(SdWindow);
  });

  it('supports Core header slots and unselected body projection in a named nonmodal window', () => {
    window.open();
    expect(panel().getAttribute('role')).toBe('dialog');
    expect(panel().getAttribute('aria-modal')).toBe('false');
    expect(panel().querySelector('.sd-window__header')!.textContent).toContain('Window contract');
    expect(panel().querySelector('.sd-window__header')!.textContent).toContain('Extra action');
    expect(panel().querySelector('.sd-window__content')!.textContent).toContain('Default body projection');
    expect(panel().querySelector('.sd-window__footer')!.textContent).toContain('Apply');
    expect(document.getElementById(window.titleId)!.textContent).toContain('Window contract');
  });

  it('keeps the legacy selector, slots, CSS hooks and autoId prefix working', () => {
    const legacy = TestBed.createComponent(LegacyWindowHost);
    extraFixtures.push(legacy);
    legacy.detectChanges();
    const component = legacy.componentInstance.window();
    component.open();
    const element = document.getElementById(component.id)!;
    expect(element.querySelector('.modal-resizable__title')!.textContent).toContain('Legacy title');
    expect(element.querySelector('.modal-resizable__content')!.textContent).toContain('Legacy body');
    expect(element.querySelector('.modal-resizable__footer')!.textContent).toContain('Legacy footer');
    expect(element.getAttribute('data-autoid')).toBe('components-modal-resizable-legacy');
  });

  it('uses the new autoId prefix and Core opened/loading data flags', () => {
    window.open();
    expect(panel().getAttribute('data-autoid')).toBe('components-window-contract');
    expect(panel().getAttribute('data-opened')).toBe('true');
    expect(panel().getAttribute('data-loading')).toBe('false');
    window.startLoading();
    expect(panel().getAttribute('data-loading')).toBe('true');
    window.stopLoading();
    window.close();
    expect(panel().getAttribute('data-opened')).toBe('false');
  });

  it('keeps minimize/fullscreen state and method aliases identical', () => {
    expect((window.isMinimized as unknown as { set?: unknown }).set).toBeUndefined();
    expect((window.isFullscreen as unknown as { set?: unknown }).set).toBeUndefined();
    expect(window.restore).toBe(window.maximize);
    expect(window.toggleFullscreen).toBe(window.toggleMaximum);
    window.open();
    window.minimize();
    expect(window.isMinimized()).toBeTrue();
    window.restore();
    expect(window.isMinimum()).toBeFalse();
    window.toggleFullscreen();
    expect(window.isMaximum()).toBeTrue();
  });

  it('preserves scoped legacy surface hooks and lets the modern surface unify chrome', () => {
    window.open();
    panel().style.setProperty('--sd-modal-resizable-bg', '#123456');
    panel().style.setProperty('--sd-modal-resizable-header-bg', '#654321');
    expect(getComputedStyle(panel()).backgroundColor).toBe('rgb(18, 52, 86)');
    const header = panel().querySelector<HTMLElement>('.sd-window__header')!;
    expect(getComputedStyle(header).backgroundColor).toBe('rgb(101, 67, 33)');
    panel().style.setProperty('--sd-window-surface', '#abcdef');
    expect(getComputedStyle(panel()).backgroundColor).toBe('rgb(171, 205, 239)');
    expect(getComputedStyle(header).backgroundColor).toBe('rgb(171, 205, 239)');
    expect(getComputedStyle(panel().querySelector('.sd-window__footer')!).backgroundColor).toBe('rgb(171, 205, 239)');
  });

  for (const unavailable of ['disabled', 'hidden']) {
    for (const action of ['loading', 'minimize']) {
      it(`moves footer focus to an owned header target before ${action} when projected action is ${unavailable}`, () => {
        host.headerActionDisabled = unavailable === 'disabled';
        host.hideHeaderAction = unavailable === 'hidden';
        fixture.detectChanges();
        window.open();
        const footerButton = panel().querySelector<HTMLButtonElement>('.sd-window__footer button')!;
        footerButton.focus();
        expect(document.activeElement).toBe(footerButton);
        if (action === 'loading') window.startLoading();
        else window.minimize();
        const focused = document.activeElement;
        expect(focused === panel() || panel().querySelector('.sd-window__header')!.contains(focused)).toBeTrue();
        expect(focused).not.toBe(footerButton);
      });
    }
  }

  it('falls back to the named panel when the owned focus target is unavailable', () => {
    window.open();
    const owned = panel().querySelector<HTMLButtonElement>('button[data-autoid$="components-window-contract-restore"]')!;
    owned.disabled = true;
    panel().querySelector<HTMLButtonElement>('.sd-window__footer button')!.focus();
    window.startLoading();
    expect(document.activeElement).toBe(panel());
  });

  for (const action of ['restore', 'toggleFullscreen'] as const) {
    it(`selects/focuses the named window when ${action} is invoked from the page`, () => {
      const pageButton = document.createElement('button');
      pageButton.textContent = 'Window action';
      document.body.appendChild(pageButton);
      try {
        pageButton.focus();
        window.open();
        window.minimize();
        pageButton.focus();
        expect(document.activeElement).toBe(pageButton);
        window[action]();
        expect(document.activeElement).toBe(panel());
        expect(window.isOpened()).toBeTrue();
        expect(window.isMinimized()).toBeFalse();
      } finally {
        pageButton.remove();
      }
    });
  }

  it('hides only the built-in close action and retains the other keyboard toolbar actions', () => {
    host.hideClose = true;
    fixture.detectChanges();
    window.open();
    expect(panel().querySelector('button[data-autoid$="components-window-contract-close"]')).toBeNull();
    expect(panel().querySelector('button[data-autoid$="components-window-contract-fullscreen"]')).not.toBeNull();
  });

  it('updates scoped custom classes using the Core string/array/map shapes', () => {
    host.windowClass = 'first second';
    fixture.detectChanges();
    window.open();
    expect(panel().classList).toContain('first');
    host.windowClass = ['third'];
    fixture.detectChanges();
    expect(panel().classList).not.toContain('first');
    expect(panel().classList).toContain('third');
    host.windowClass = { fourth: true, third: false };
    fixture.detectChanges();
    expect(panel().classList).toContain('fourth');
    expect(panel().classList).not.toContain('third');
  });

  it('keeps close synchronous and emits sdClosed once after state/loading cleanup', () => {
    window.open();
    window.startLoading();
    window.sdClosed.subscribe(() => {
      expect(window.isOpened()).toBeFalse();
      expect(window.isLoading()).toBeFalse();
      expect(refs[0].closed).toBeTrue();
    });
    expect(window.close()).toBeUndefined();
    window.close();
    window.forceClose();
    expect(host.closed).toBe(1);
  });

  it('returns the boolean dismissal decision from requestClose, not a business result', async () => {
    expect(await window.requestClose()).toBeFalse();
    window.open();
    expect(await window.requestClose()).toBeTrue();
    expect(host.closed).toBe(1);
  });

  it('fails closed when the guard returns false and keeps owned loading live', async () => {
    host.beforeClose = () => false;
    fixture.detectChanges();
    window.open();
    window.startLoading();
    expect(await window.requestClose()).toBeFalse();
    expect(window.isOpened()).toBeTrue();
    expect(refs[0].closed).toBeFalse();
    expect(host.closed).toBe(0);
  });

  it('closes only when the guard resolves literal true', async () => {
    host.beforeClose = () => Promise.resolve(true);
    fixture.detectChanges();
    window.open();
    expect(await window.requestClose()).toBeTrue();
    expect(window.isOpened()).toBeFalse();
    host.beforeClose = () => 'yes' as unknown as boolean;
    fixture.detectChanges();
    window.open();
    expect(await window.requestClose()).toBeFalse();
    expect(window.isOpened()).toBeTrue();
  });

  it('coalesces pending close requests for the same opening', async () => {
    let resolve!: (value: boolean) => void;
    const guard = jasmine.createSpy('guard').and.returnValue(
      new Promise<boolean>(done => {
        resolve = done;
      })
    );
    host.beforeClose = guard;
    fixture.detectChanges();
    window.open();
    const first = window.requestClose();
    expect(window.requestClose()).toBe(first);
    await Promise.resolve();
    expect(guard).toHaveBeenCalledTimes(1);
    resolve(true);
    expect(await first).toBeTrue();
    expect(host.closed).toBe(1);
  });

  it('reports a rejected guard through sdCloseError without closing', async () => {
    const error = new Error('save failed');
    host.beforeClose = () => Promise.reject(error);
    fixture.detectChanges();
    window.open();
    expect(await window.requestClose()).toBeFalse();
    expect(host.closeError).toBe(error);
    expect(window.isOpened()).toBeTrue();
  });

  it('lets forceClose bypass a guard while retaining the void Core signature', () => {
    const guard = jasmine.createSpy('guard').and.returnValue(false);
    host.beforeClose = guard;
    fixture.detectChanges();
    window.open();
    expect(window.forceClose()).toBeUndefined();
    expect(guard).not.toHaveBeenCalled();
    expect(window.isOpened()).toBeFalse();
    expect(host.closed).toBe(1);
  });

  it('does not let a stale guard close or report errors into a reopened cycle', async () => {
    let reject!: (error: unknown) => void;
    host.beforeClose = () =>
      new Promise<boolean>((_, fail) => {
        reject = fail;
      });
    fixture.detectChanges();
    window.open();
    const stale = window.requestClose();
    await Promise.resolve();
    window.forceClose();
    window.open();
    reject(new Error('stale save'));
    expect(await stale).toBeFalse();
    expect(window.isOpened()).toBeTrue();
    expect(host.closeError).toBeUndefined();
    expect(host.closed).toBe(1);
  });

  it('allows a new guard request after forceClose/reopen while the old request is pending', async () => {
    const resolves: ((value: boolean) => void)[] = [];
    host.beforeClose = () =>
      new Promise<boolean>(done => {
        resolves.push(done);
      });
    fixture.detectChanges();
    window.open();
    const stale = window.requestClose();
    await Promise.resolve();
    window.forceClose();
    window.open();
    const fresh = window.requestClose();
    await Promise.resolve();
    expect(fresh).not.toBe(stale);
    resolves[0](true);
    expect(await stale).toBeFalse();
    expect(window.isOpened()).toBeTrue();
    resolves[1](true);
    expect(await fresh).toBeTrue();
    expect(host.closed).toBe(2);
  });

  it('emits once on destroy, bypasses guards and suppresses a later rejected request', async () => {
    let reject!: (error: unknown) => void;
    host.beforeClose = () =>
      new Promise<boolean>((_, fail) => {
        reject = fail;
      });
    fixture.detectChanges();
    window.open();
    const pending = window.requestClose();
    await Promise.resolve();
    fixture.destroy();
    expect(host.closed).toBe(1);
    reject(new Error('late'));
    expect(await pending).toBeFalse();
    expect(host.closeError).toBeUndefined();
    expect(document.getElementById(window.id)).toBeNull();
  });

  it('does not emit sdClosed for a never-opened host', () => {
    fixture.destroy();
    expect(host.closed).toBe(0);
  });

  it('keeps an opening initiated by an sdClosed handler alive', () => {
    window.open();
    window.sdClosed.subscribe(() => window.open());
    window.close();
    expect(window.isOpened()).toBeTrue();
    expect(panel().classList).not.toContain('c-closed');
    expect(host.closed).toBe(1);
  });

  it('routes opt-in Escape and toolbar close through the same guard', async () => {
    host.beforeClose = () => false;
    fixture.detectChanges();
    host.disableEscapeClose = false;
    fixture.detectChanges();
    window.open();
    panel().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(window.isOpened()).toBeTrue();
    panel().querySelector<HTMLButtonElement>('button[data-autoid$="components-window-contract-close"]')!.click();
    await fixture.whenStable();
    expect(window.isOpened()).toBeTrue();
    expect(host.closed).toBe(0);
  });
});
