/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Lifecycle invariants for sd-tab-router-outlet.
 *
 * Bug regression: components rendered inside a tab pane MUST follow
 *   constructor â†’ ngOnInit â†’ ngOnDestroy
 * exactly once per tab instance. If a tab is reactivated (same key) we MUST
 * NOT re-instantiate. If the tab is closed we MUST run ngOnDestroy so
 * subscriptions/intervals inside the tab body do not leak.
 */
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import {
  NavigationEnd,
  Router,
  RoutesRecognized,
  Scroll,
  provideRouter,
  withInMemoryScrolling,
} from '@angular/router';

import { SdTabRouterOutletComponent } from './tab-router-outlet.component';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabDecoratorService } from '../../services/tab-decorator.service';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

// Shared counters across instances per class â€” we don't share state across tests though
// (re-initialised in beforeEach via reset()).
const counters = {
  pageA: { ctor: 0, init: 0, destroy: 0 },
  pageB: { ctor: 0, init: 0, destroy: 0 },
  reset() {
    this.pageA = { ctor: 0, init: 0, destroy: 0 };
    this.pageB = { ctor: 0, init: 0, destroy: 0 };
  },
};

@Component({ standalone: true, template: '<span>page A</span>' })
class PageAComponent implements OnInit, OnDestroy {
  constructor() { counters.pageA.ctor++; }
  ngOnInit(): void { counters.pageA.init++; }
  ngOnDestroy(): void { counters.pageA.destroy++; }
}

@Component({ standalone: true, template: '<span>page B</span>' })
class PageBComponent implements OnInit, OnDestroy {
  constructor() { counters.pageB.ctor++; }
  ngOnInit(): void { counters.pageB.init++; }
  ngOnDestroy(): void { counters.pageB.destroy++; }
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

describe('SdTabRouterOutletComponent â€” lifecycle invariants', () => {
  let fixture: ComponentFixture<HostComponent>;
  let router: Router;
  let outletCmp: SdTabRouterOutletComponent;
  let tabRouterService: SdTabRouterService;

  beforeEach(async () => {
    counters.reset();

    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [
        // withInMemoryScrolling enables the RouterScroller â†’ emits Scroll events
        // that wrap NavigationEnd. This is the bundle most production apps use.
        provideRouter(
          [
            { path: 'a', component: PageAComponent },
            { path: 'b', component: PageBComponent },
          ],
          withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
        ),
        SdTabRouterService,
        SdTabDecoratorService,
        {
          provide: SdNotifyService,
          useValue: { warning: jasmine.createSpy(), success: jasmine.createSpy(),
            error: jasmine.createSpy(), info: jasmine.createSpy() },
        },
        { provide: I18nService, useValue: { t: (k: string) => k, instant: (k: string) => k, get: (k: string) => k } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    router = TestBed.inject(Router);
    tabRouterService = TestBed.inject(SdTabRouterService);

    await settle(fixture);

    outletCmp = fixture.debugElement.query(By.directive(SdTabRouterOutletComponent))
      .componentInstance as SdTabRouterOutletComponent;
  });

  it('instantiates page exactly once on first navigation (no double-render from Scroll-wrapped NavigationEnd)', async () => {
    await router.navigateByUrl('/a');
    await settle(fixture);

    expect(counters.pageA.ctor).toBe(1);
    expect(counters.pageA.init).toBe(1);
    expect(counters.pageA.destroy).toBe(0);
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
    // letting both invocations read this.tabs() = [] â†’ 2 new tabs with same key.
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

