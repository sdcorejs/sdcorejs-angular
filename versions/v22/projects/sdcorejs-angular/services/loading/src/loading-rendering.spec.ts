import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, EnvironmentInjector, createEnvironmentInjector, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { SdButton, SdButtonType } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdPageComponent } from '../../../modules/layout/components/page/page.component';
import { SdLoadingService } from './loading.service';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdButton, SdSideDrawer, SdPageComponent],
  template: `
    <sd-page title="Loading regression">
      <sd-button headerRight data-testid="page-action" title="Save" [type]="type" [loading]="loading()" (click)="clicks = clicks + 1" />
      <div id="loading-rendering-content">Page content</div>
    </sd-page>
    <sd-side-drawer title="Edit" (sdClosed)="closes = closes + 1">
      <sd-button sdHeaderRight data-testid="drawer-action" title="Save" [type]="type" [loading]="loading()" (click)="clicks = clicks + 1" />
      Drawer content
    </sd-side-drawer>
  `,
  styles: `
    :host {
      display: block;
      position: fixed;
      inset: 32px;
    }
    :host ::ng-deep .c-page-header > div {
      display: flex;
      justify-content: space-between;
      padding: 16px;
    }
    #loading-rendering-content {
      position: relative;
      height: 200px;
    }
  `,
})
class LoadingRenderingHost {
  readonly drawer = viewChild.required(SdSideDrawer);
  readonly loading = signal(true);
  type: SdButtonType = 'light';
  clicks = 0;
  closes = 0;
}

// why: Karma renders real component CSS in Chrome. DOM/class-only assertions cannot detect
// a global service selector changing the button's containing block or intercepting a drawer close.
describe('SdLoadingService and SdButton browser rendering', () => {
  let fixture: ComponentFixture<LoadingRenderingHost>;
  let service: SdLoadingService;
  let previousScroll: { left: number; top: number };
  const injectors = new Set<EnvironmentInjector>();
  const foreignNodes = new Set<HTMLElement>();

  beforeEach(async () => {
    previousScroll = { left: window.scrollX, top: window.scrollY };
    await TestBed.configureTestingModule({ imports: [LoadingRenderingHost, NoopAnimationsModule] }).compileComponents();
    fixture = TestBed.createComponent(LoadingRenderingHost);
    service = TestBed.inject(SdLoadingService);
    fixture.detectChanges();
    await fixture.whenStable();
    // why: các test focus/scroll khác dùng chung document của Karma; overlay absolute cần
    // viewport ban đầu xác định để hit-test không phụ thuộc vị trí cuộn của test chạy trước.
    window.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  });

  afterEach(() => {
    for (const injector of injectors) injector.destroy();
    injectors.clear();
    TestBed.resetTestingModule();
    for (const node of foreignNodes) node.remove();
    foreignNodes.clear();
    window.scrollTo({ ...previousScroll, behavior: 'instant' });
  });

  function element(selector: string, root: ParentNode = document): HTMLElement {
    const result = root.querySelector<HTMLElement>(selector);
    if (!result) throw new Error(`Missing rendered element: ${selector}`);
    return result;
  }

  function expectRect(target: HTMLElement, before: DOMRect): void {
    const after = target.getBoundingClientRect();
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(after[key])
        .withContext(`${target.dataset['testid'] ?? target.className}: ${key}`)
        .toBeCloseTo(before[key], 1);
    }
    expect(after.width).toBeGreaterThan(0);
    expect(after.height).toBeGreaterThan(0);
    expect(getComputedStyle(target).position).not.toBe('absolute');
    expect(getComputedStyle(target).zIndex).not.toBe('99999');
  }

  function hitCenter(target: HTMLElement): HTMLElement {
    const rect = target.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    if (!(hit instanceof HTMLElement)) throw new Error('No hit target at rendered center');
    return hit;
  }

  function expectOverlayHit(target: HTMLElement, overlay: HTMLElement): void {
    expect(hitCenter(target))
      .withContext(
        JSON.stringify({
          overlay: overlay.getBoundingClientRect().toJSON(),
          target: target.getBoundingClientRect().toJSON(),
          scroll: [window.scrollX, window.scrollY],
          position: getComputedStyle(document.body).position,
          pointerEvents: getComputedStyle(overlay).pointerEvents,
        })
      )
      .toBe(overlay);
  }

  async function openDrawer(): Promise<HTMLElement> {
    fixture.componentInstance.drawer().open();
    fixture.detectChanges();
    await fixture.whenStable();
    const drawer = element(`#${fixture.componentInstance.drawer().id}`);
    // Finish the real CSS entrance transition before measuring, without timers or mocked layout.
    for (const animation of drawer.getAnimations()) animation.finish();
    return drawer;
  }

  it('keeps the page header button geometry across repeated document body overlay starts and stops', () => {
    const button = element('[data-testid="page-action"]');
    const before = button.getBoundingClientRect();
    for (let cycle = 0; cycle < 2; cycle++) {
      const ref = service.start();
      expectRect(button, before);
      const overlay = element('body > .sd-loading');
      expectOverlayHit(button, overlay);
      ref.close();
      expectRect(button, before);
      expect(button.contains(hitCenter(button))).toBeTrue();
    }
  });

  it('keeps the drawer header button geometry with a document body overlay and restores close hit testing', async () => {
    const drawer = await openDrawer();
    const button = element('[data-testid="drawer-action"]', drawer);
    const close = element('.sd-side-drawer-close-btn', drawer);
    const before = button.getBoundingClientRect();
    const ref = service.start();
    expectRect(button, before);
    // A deliberate full-document loading overlay retains its existing interaction lock.
    expectOverlayHit(close, element('body > .sd-loading'));
    ref.close();
    expectRect(button, before);
    const hit = hitCenter(close);
    expect(close.contains(hit)).toBeTrue();
    hit.click();
    expect(fixture.componentInstance.closes).toBe(1);
  });

  it('keeps both header buttons in place and the drawer close clickable while content bodies are loading', async () => {
    const pageBeforeDrawer = element('[data-testid="page-action"]').getBoundingClientRect();
    const drawer = await openDrawer();
    const pageButton = element('[data-testid="page-action"]');
    const drawerButton = element('[data-testid="drawer-action"]', drawer);
    const pageRect = pageButton.getBoundingClientRect();
    const drawerRect = drawerButton.getBoundingClientRect();
    const pageRef = service.start('#loading-rendering-content');
    const drawerRef = service.start(`#${drawer.id} .sd-side-drawer-body`);
    expectRect(pageButton, pageRect);
    expectRect(drawerButton, drawerRect);
    drawerRef.close();
    expectRect(drawerButton, drawerRect);
    const reopened = service.start(`#${drawer.id} .sd-side-drawer-body`);
    const close = element('.sd-side-drawer-close-btn', drawer);
    const hit = hitCenter(close);
    expect(close.contains(hit)).toBeTrue();
    hit.click();
    expect(fixture.componentInstance.closes).toBe(1);
    expect(fixture.componentInstance.drawer().isOpened()).toBeFalse();
    reopened.close();
    pageRef.close();
    // Closing the drawer restores the document scrollbar, so compare with the pre-open viewport.
    expectRect(pageButton, pageBeforeDrawer);
  });

  for (const type of ['fill', 'light', 'outline', 'text'] as const) {
    it(`preserves the ${type} button spinner and capture-phase click blocking with overlay styles installed`, () => {
      fixture.componentInstance.type = type;
      fixture.detectChanges();
      const ref = service.start('#loading-rendering-content');
      const host = element('[data-testid="page-action"]');
      const button = element('button', host);
      const spinner = element('mat-spinner', host);
      expect(host.classList.contains('sd-loading')).toBeTrue();
      expect(host.hasAttribute('data-sd-loading-overlay')).toBeFalse();
      expect(spinner.getBoundingClientRect().width).toBe(18);
      expect(spinner.getBoundingClientRect().height).toBe(18);
      expect(getComputedStyle(spinner).visibility).toBe('visible');
      expect(getComputedStyle(button).pointerEvents).toBe('none');
      expect(button.contains(hitCenter(button))).toBeFalse();
      hitCenter(host).click();
      button.click(); // Also exercises activation that bypasses CSS pointer-events.
      expect(fixture.componentInstance.clicks).toBe(0);
      ref.close();
      button.click();
      expect(fixture.componentInstance.clicks).toBe(0);
      fixture.componentInstance.loading.set(false);
      fixture.detectChanges();
      expect(host.querySelector('mat-spinner')).toBeNull();
      expect(getComputedStyle(button).pointerEvents).toBe('auto');
      hitCenter(button).click();
      expect(fixture.componentInstance.clicks).toBe(1);
    });
  }

  it('only styles owned overlay markup and keeps it rendered until the last ref and service owner release', () => {
    const foreign = document.createElement('div');
    foreign.className = 'sd-loading';
    foreign.innerHTML = '<div class="sd-loading-spinner"></div>';
    document.body.appendChild(foreign);
    foreignNodes.add(foreign);
    const spinner = element('.sd-loading-spinner', foreign);
    const foreignPosition = getComputedStyle(foreign).position;
    const spinnerPosition = getComputedStyle(spinner).position;
    const firstInjector = createEnvironmentInjector([SdLoadingService], TestBed.inject(EnvironmentInjector));
    const secondInjector = createEnvironmentInjector([SdLoadingService], TestBed.inject(EnvironmentInjector));
    injectors.add(firstInjector);
    injectors.add(secondInjector);
    const firstService = firstInjector.get(SdLoadingService);
    const first = firstService.start();
    const sameOwner = firstService.start();
    const otherOwner = secondInjector.get(SdLoadingService).start();
    const overlay = element('body > .sd-loading[data-sd-loading-overlay]');
    const overlaySpinner = element('.sd-loading-spinner', overlay);
    expect(getComputedStyle(foreign).position).toBe(foreignPosition);
    expect(getComputedStyle(spinner).position).toBe(spinnerPosition);
    expect(getComputedStyle(overlay).position).toBe('absolute');
    expect(getComputedStyle(overlaySpinner).animationName).toBe('sd-loading-spin');
    expect(overlaySpinner.getBoundingClientRect().width).toBeGreaterThan(0);
    const rect = overlay.getBoundingClientRect();
    first.close();
    first.close();
    expect(sameOwner.closed).toBeFalse();
    expect(overlay.isConnected).toBeTrue();
    firstInjector.destroy();
    injectors.delete(firstInjector);
    expect(sameOwner.closed).toBeTrue();
    expect(otherOwner.closed).toBeFalse();
    expect(element('body > .sd-loading[data-sd-loading-overlay]')).toBe(overlay);
    expect(overlay.getBoundingClientRect().toJSON()).toEqual(rect.toJSON());
    expect(getComputedStyle(overlay).zIndex).toBe('99999');
    expect(getComputedStyle(overlaySpinner).animationName).toBe('sd-loading-spin');
    otherOwner.close();
    expect(overlay.isConnected).toBeFalse();
    expect(foreign.isConnected).toBeTrue();
    secondInjector.destroy();
    injectors.delete(secondInjector);
    expect(document.querySelector('style[data-sd-loading-styles]')).toBeNull();
  });
});
