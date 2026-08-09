/**
 * Lifecycle invariants for sd-tab-router-outlet.
 *
 * Bug regression: components rendered inside a tab pane MUST follow
 *   constructor → ngOnInit → ngOnDestroy
 * exactly once per tab instance. If a tab is reactivated (same key) we MUST
 * NOT re-instantiate. If the tab is closed we MUST run ngOnDestroy so
 * subscriptions/intervals inside the tab body do not leak.
 */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationEnd, Router, RoutesRecognized, Scroll, provideRouter, withInMemoryScrolling } from '@angular/router';

import { SdTabRouterOutletComponent } from './tab-router-outlet.component';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabDecoratorService } from '../../services/tab-decorator.service';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';
import { SD_TAB, SdTabRouterTab } from '../../models/tab-router.model';
import { SdTabRouterItemComponent } from '../tab-router-item/tab-router-item.component';

// Shared counters across instances per class — we don't share state across tests though
// (re-initialised in beforeEach via reset()).
const counters = {
  pageA: { ctor: 0, init: 0, destroy: 0 },
  pageB: { ctor: 0, init: 0, destroy: 0 },
  reset() {
    this.pageA = { ctor: 0, init: 0, destroy: 0 };
    this.pageB = { ctor: 0, init: 0, destroy: 0 };
  },
};

@Component({ standalone: true, template: '<span data-cy="page-a">page A</span>' })
class PageAComponent implements OnInit, OnDestroy {
  constructor() {
    counters.pageA.ctor++;
  }
  ngOnInit(): void {
    counters.pageA.init++;
  }
  ngOnDestroy(): void {
    counters.pageA.destroy++;
  }
}

@Component({ standalone: true, template: '<span>page B</span>' })
class PageBComponent implements OnInit, OnDestroy {
  constructor() {
    counters.pageB.ctor++;
  }
  ngOnInit(): void {
    counters.pageB.init++;
  }
  ngOnDestroy(): void {
    counters.pageB.destroy++;
  }
}

@Component({
  standalone: true,
  imports: [SdTabRouterOutletComponent],
  template: `<sd-tab-router-outlet></sd-tab-router-outlet>`,
})
class HostComponent {}

const settle = async (fixture: ComponentFixture<HostComponent>) => {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};

describe('SdTabRouterOutletComponent — lifecycle invariants', () => {
  let fixture: ComponentFixture<HostComponent>;
  let router: Router;
  let outletCmp: SdTabRouterOutletComponent;
  let tabRouterService: SdTabRouterService;

  beforeEach(async () => {
    counters.reset();

    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [
        // withInMemoryScrolling enables the RouterScroller → emits Scroll events
        // that wrap NavigationEnd. This is the bundle most production apps use.
        provideRouter(
          [
            { path: 'a', component: PageAComponent },
            { path: 'b', component: PageBComponent },
          ],
          withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
        ),
        SdTabRouterService,
        SdTabDecoratorService,
        {
          provide: SdNotifyService,
          useValue: { warning: jasmine.createSpy(), success: jasmine.createSpy(), error: jasmine.createSpy(), info: jasmine.createSpy() },
        },
        { provide: I18nService, useValue: { t: (k: string) => k, instant: (k: string) => k, get: (k: string) => k } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    router = TestBed.inject(Router);
    tabRouterService = TestBed.inject(SdTabRouterService);

    await settle(fixture);

    outletCmp = fixture.debugElement.query(By.directive(SdTabRouterOutletComponent)).componentInstance as SdTabRouterOutletComponent;
  });

  it('instantiates page exactly once on first navigation (even with withInMemoryScrolling enabled)', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);

    expect(counters.pageA.ctor).toBe(1);
    expect(counters.pageA.init).toBe(1);
    expect(counters.pageA.destroy).toBe(0);
    expect(fixture.nativeElement.querySelector('[data-cy="page-a"]')).not.toBeNull();
  });

  it('does NOT re-instantiate when revisiting the same tab key', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);
    await router.navigateByUrl('/b');
    await settle(fixture);
    await router.navigateByUrl('/a');
    await settle(fixture);

    // PageA created exactly once, never destroyed (tab still open), never re-init
    expect(counters.pageA.ctor).toBe(1);
    expect(counters.pageA.init).toBe(1);
    expect(counters.pageA.destroy).toBe(0);

    expect(counters.pageB.ctor).toBe(1);
    expect(counters.pageB.init).toBe(1);
    expect(counters.pageB.destroy).toBe(0);
  });

  it('recreates an inactive existing tab in place when forceReload is true', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);

    const originalTab = outletCmp.tabs()[0];
    const originalInjector = originalTab.injector;
    const originalTabInfoChanges = originalTab.tabInfoChanges;
    const beforeClose = jasmine.createSpy('beforeClose').and.returnValue(false);
    originalTab.beforeClose = beforeClose;

    await router.navigateByUrl('/b');
    await settle(fixture);
    const inactiveTabBeforeReload = outletCmp.tabs().find(tab => tab.url === '/a')!;

    await router.navigateByUrl('/a', { state: { forceReload: true } });
    await settle(fixture);

    const tabs = outletCmp.tabs();
    const reloadedTab = tabs[0];
    expect(tabs.map(tab => tab.url)).toEqual(['/a', '/b']);
    expect(reloadedTab).not.toBe(originalTab);
    expect(reloadedTab).not.toBe(inactiveTabBeforeReload);
    expect(reloadedTab.injector).not.toBe(originalInjector);
    expect(reloadedTab.tabInfoChanges).not.toBe(originalTabInfoChanges);
    expect(reloadedTab.isActive).toBeTrue();
    expect(beforeClose).not.toHaveBeenCalled();
    expect(counters.pageA).toEqual({ ctor: 2, init: 2, destroy: 1 });
    expect(counters.pageB).toEqual({ ctor: 1, init: 1, destroy: 0 });
  });

  it('recreates the current tab for a same-url forceReload navigation', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);

    const originalTab = outletCmp.tabs()[0];
    const originalInjector = originalTab.injector;
    const originalTabInfoChanges = originalTab.tabInfoChanges;

    await router.navigateByUrl('/a', { state: { forceReload: true } });
    await settle(fixture);

    const tabs = outletCmp.tabs();
    expect(tabs.length).toBe(1);
    expect(tabs[0]).not.toBe(originalTab);
    expect(tabs[0].injector).not.toBe(originalInjector);
    expect(tabs[0].tabInfoChanges).not.toBe(originalTabInfoChanges);
    expect(counters.pageA).toEqual({ ctor: 2, init: 2, destroy: 1 });
  });

  it('recreates the nav item and subscribes it to replacement tabInfoChanges on same-url forceReload', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);

    const originalTab = outletCmp.tabs()[0];
    const originalItem = fixture.debugElement.query(By.directive(SdTabRouterItemComponent)).componentInstance as SdTabRouterItemComponent;

    await router.navigateByUrl('/a', { state: { forceReload: true } });
    await settle(fixture);

    const replacementTab = outletCmp.tabs()[0];
    const replacementItem = fixture.debugElement.query(By.directive(SdTabRouterItemComponent))
      .componentInstance as SdTabRouterItemComponent;
    expect(replacementItem).not.toBe(originalItem);
    expect(replacementItem.tab).toBe(replacementTab);
    expect(replacementTab.tabInfoChanges).not.toBe(originalTab.tabInfoChanges);

    replacementTab.tabInfoChanges.next({ name: 'Reloaded A' });
    fixture.detectChanges();

    expect(replacementItem.tabInfo).toEqual({ name: 'Reloaded A' });
  });

  it('destroys the tab component when its tab is closed (no leak)', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);
    await router.navigateByUrl('/b');
    await settle(fixture);

    // Close /b (active tab)
    const tabB = outletCmp.tabs().find(t => t.url === '/b')!;
    tabRouterService.close(tabB);
    await settle(fixture);

    expect(counters.pageB.destroy).toBe(1);
    // PageA still alive
    expect(counters.pageA.destroy).toBe(0);
  });

  it('destroys an inactive tab without affecting the active one', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);
    await router.navigateByUrl('/b');
    await settle(fixture);

    const tabA = outletCmp.tabs().find(t => t.url === '/a')!;
    tabRouterService.close(tabA);
    await settle(fixture);

    expect(counters.pageA.destroy).toBe(1);
    expect(counters.pageB.destroy).toBe(0);
  });

  it('manual Scroll event emission does not double-instantiate a tab page', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);
    expect(counters.pageA.ctor).toBe(1);

    // Simulate a stray Scroll wrapper firing AFTER a NavigationEnd is already
    // processed. The outlet must dedupe and NOT re-trigger #activeRoute.
    const navEnd = new NavigationEnd(1, '/a', '/a');
    const scrollEvent = new Scroll(navEnd, null, null);
    (router.events as any).next?.(scrollEvent);
    await settle(fixture);

    expect(counters.pageA.ctor).toBe(1);
    expect(counters.pageA.init).toBe(1);
  });

  it('destroys all remaining tab components when outlet itself is destroyed', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);
    await router.navigateByUrl('/b');
    await settle(fixture);

    fixture.destroy();

    expect(counters.pageA.destroy).toBe(1);
    expect(counters.pageB.destroy).toBe(1);
  });

  it('RoutesRecognized alone (without NavigationEnd) does NOT instantiate a page', async () => {
    // RoutesRecognized only captures pendingNavigationState. Activation happens
    // at NavigationEnd. So emitting just RoutesRecognized must NOT create a tab.
    const event = new RoutesRecognized(99, '/a', '/a', router.routerState.snapshot);
    (router.events as any).next?.(event);
    await settle(fixture);

    expect(counters.pageA.ctor).toBe(0);
    expect(outletCmp.tabs().length).toBe(0);
  });

  it('two back-to-back navigations to the same url collapse to ONE tab + ONE component instance', async () => {
    // Reproduces the race condition pattern: when RouterScroller fires
    // Scroll(NavigationEnd) right after raw NavigationEnd, the outlet handler
    // was invoked twice and the await getBestInjector(...) yielded between calls,
    // letting both invocations read this.tabs() = [] → 2 new tabs with same key.
    // concatMap on the events pipe must serialize and idempotently reuse the tab.
    const p1 = router.navigateByUrl('/a');
    const p2 = router.navigateByUrl('/a');
    await Promise.all([p1, p2]);
    await settle(fixture);

    expect(outletCmp.tabs().length).toBe(1);
    expect(counters.pageA.ctor).toBe(1);
    expect(counters.pageA.init).toBe(1);
  });
});

describe('SdTabRouterOutletComponent - SD_TAB injection', () => {
  const captured: { tabA?: SdTabRouterTab | null; tabB?: SdTabRouterTab | null } = {};

  @Component({ standalone: true, template: '<span data-cy="sd-tab-a"></span>' })
  class SdTabAComponent {
    constructor() {
      captured.tabA = inject(SD_TAB, { optional: true });
    }
  }

  @Component({ standalone: true, template: '<span data-cy="sd-tab-b"></span>' })
  class SdTabBComponent {
    constructor() {
      captured.tabB = inject(SD_TAB, { optional: true });
    }
  }

  @Component({
    standalone: true,
    imports: [SdTabRouterOutletComponent],
    template: `<sd-tab-router-outlet></sd-tab-router-outlet>`,
  })
  class SdTabHostComponent {}

  let fixture: ComponentFixture<SdTabHostComponent>;
  let sdTabRouter: Router;

  beforeEach(async () => {
    Object.assign(captured, { tabA: undefined, tabB: undefined });

    await TestBed.configureTestingModule({
      imports: [SdTabHostComponent, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'sd-a', component: SdTabAComponent },
          { path: 'sd-b', component: SdTabBComponent },
        ]),
        SdTabRouterService,
        SdTabDecoratorService,
        {
          provide: SdNotifyService,
          useValue: { warning: jasmine.createSpy(), success: jasmine.createSpy(), error: jasmine.createSpy(), info: jasmine.createSpy() },
        },
        { provide: I18nService, useValue: { t: (k: string) => k, instant: (k: string) => k, get: (k: string) => k } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SdTabHostComponent);
    sdTabRouter = TestBed.inject(Router);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('provides a different SdTabRouterTab instance for each tab via SD_TAB', async () => {
    await sdTabRouter.navigateByUrl('/sd-a');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    await sdTabRouter.navigateByUrl('/sd-b');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(captured.tabA).not.toBeNull();
    expect(captured.tabB).not.toBeNull();
    expect(captured.tabA).not.toBe(captured.tabB as any);
    expect(captured.tabA!.url).toBe('/sd-a');
    expect(captured.tabB!.url).toBe('/sd-b');
  });
});

describe('SdTabRouterOutletComponent — initial navigation (F5 / direct URL)', () => {
  beforeEach(async () => {
    counters.reset();

    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [
        provideRouter(
          [
            { path: '', redirectTo: 'a', pathMatch: 'full' },
            { path: 'a', component: PageAComponent },
          ],
          withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })
        ),
        SdTabRouterService,
        SdTabDecoratorService,
        {
          provide: SdNotifyService,
          useValue: { warning: jasmine.createSpy(), success: jasmine.createSpy(), error: jasmine.createSpy(), info: jasmine.createSpy() },
        },
        { provide: I18nService, useValue: { t: (k: string) => k, instant: (k: string) => k, get: (k: string) => k } },
      ],
    }).compileComponents();
  });

  it('renders tab content on first app load without an explicit navigateByUrl call', async () => {
    const initialFixture = TestBed.createComponent(HostComponent);
    const router = TestBed.inject(Router);

    // TestBed không luôn chạy initial navigation tự động — mô phỏng F5 tại "/".
    if (!router.navigated) {
      await router.navigateByUrl('/');
    }
    await settle(initialFixture);

    const initialOutlet = initialFixture.debugElement.query(By.directive(SdTabRouterOutletComponent))
      .componentInstance as SdTabRouterOutletComponent;

    expect(initialOutlet.tabs().length).toBe(1);
    expect(initialOutlet.tabs()[0].url).toBe('/a');
    expect(initialFixture.nativeElement.querySelector('[data-cy="page-a"]')).not.toBeNull();
    expect(counters.pageA.ctor).toBe(1);
    expect(counters.pageA.init).toBe(1);
  });

  it('F5 trên URL trực tiếp /a (không qua redirect) — tab catch-up đúng url + render PageA', async () => {
    const router = TestBed.inject(Router);
    // Nav TRƯỚC khi tạo fixture: mô phỏng app load với router đã navigate xong
    // và outlet mount sau (do blocking init hoặc lazy app shell).
    await router.navigateByUrl('/a');
    const lateFixture = TestBed.createComponent(HostComponent);
    await settle(lateFixture);

    const outlet = lateFixture.debugElement.query(By.directive(SdTabRouterOutletComponent)).componentInstance as SdTabRouterOutletComponent;

    expect(outlet.tabs().length).toBe(1);
    expect(outlet.tabs()[0].url).toBe('/a');
    expect(counters.pageA.ctor).toBe(1);
    expect(counters.pageA.init).toBe(1);
  });

  it('syncCurrentRoute idempotent — initial nav + afterNextRender catch-up không tạo 2 tab', async () => {
    const router = TestBed.inject(Router);
    // Sync nav trước, sau đó mount outlet → cả `router.events` subscribe path và
    // `afterNextRender(#syncCurrentRoute)` đều có cơ hội chạy. Phải dedupe.
    await router.navigateByUrl('/a');
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    // Trigger thêm lần navigate cùng URL để chắc chắn không tạo duplicate.
    await router.navigateByUrl('/a');
    await settle(fixture);

    const outlet = fixture.debugElement.query(By.directive(SdTabRouterOutletComponent)).componentInstance as SdTabRouterOutletComponent;
    expect(outlet.tabs().length).toBe(1);
    expect(counters.pageA.ctor).toBe(1);
  });

  it('F5 trên URL có queryParams — tab key hash gồm queryParams, không tạo tab thứ hai khi nav lại cùng url+queryParams', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/a?x=1');
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);
    const outlet = fixture.debugElement.query(By.directive(SdTabRouterOutletComponent)).componentInstance as SdTabRouterOutletComponent;

    expect(outlet.tabs().length).toBe(1);
    expect(outlet.tabs()[0].url).toBe('/a');
    expect(outlet.tabs()[0].queryParams).toEqual({ x: '1' });

    await router.navigateByUrl('/a?x=1');
    await settle(fixture);
    expect(outlet.tabs().length).toBe(1);
    expect(counters.pageA.ctor).toBe(1);
  });

  it('F5 rồi nav qua URL khác cùng query khác — tạo 2 tab độc lập (tab key khác)', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/a?x=1');
    const fixture = TestBed.createComponent(HostComponent);
    await settle(fixture);

    await router.navigateByUrl('/a?x=2');
    await settle(fixture);

    const outlet = fixture.debugElement.query(By.directive(SdTabRouterOutletComponent)).componentInstance as SdTabRouterOutletComponent;
    expect(outlet.tabs().length).toBe(2);
    expect(
      outlet
        .tabs()
        .map(t => t.queryParams?.['x'])
        .sort()
    ).toEqual(['1', '2']);
    expect(counters.pageA.ctor).toBe(2);
  });
});
