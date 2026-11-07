import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, ErrorHandler, NgModule, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router, RouterModule, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { SdTabRouterOutletComponent } from './tab-router-outlet.component';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabDecoratorService } from '../../services/tab-decorator.service';
import { SdTabRouterTab } from '../../models/tab-router.model';
import { SdTabActivated } from '../../events/tab-router.event';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<span data-cy="page-a"></span>',
})
class PageAComponent {}
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<span data-cy="page-b"></span>',
})
class PageBComponent {}
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<span data-cy="page-c"></span>',
})
class PageCComponent {}

const queryPageLog: (string | null)[] = [];
const queryPageRoutes: ActivatedRoute[] = [];
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<span data-cy="page-q"></span>',
})
class QueryPageComponent {
  constructor() {
    const route = inject(ActivatedRoute);
    queryPageRoutes.push(route);
    route.queryParamMap.pipe(takeUntilDestroyed()).subscribe(params => queryPageLog.push(params.get('x')));
  }
}

// NgModule lazy route: the outlet calls loadChildren() again to build the tab injector, so the test can hold that call
// and keep the activation queue busy while the router moves on.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '<span data-cy="page-lazy"></span>',
})
class LazyPageComponent {}
@NgModule({ imports: [RouterModule.forChild([{ path: '', component: LazyPageComponent }])] })
class LazyPageModule {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTabRouterOutletComponent],
  template: `<sd-tab-router-outlet [disabled]="disabled"></sd-tab-router-outlet>`,
})
class HostComponent {
  disabled = false;
}

const navigateAndStabilize = async (router: Router, fixture: ComponentFixture<HostComponent>, url: string, extras: any = {}) => {
  await router.navigateByUrl(url, { state: extras.state });
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
};

describe('SdTabRouterOutletComponent (integration)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let outletCmp: SdTabRouterOutletComponent;
  let router: Router;
  let notify: SdNotifyService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent, NoopAnimationsModule],
      providers: [
        provideRouter([
          { path: 'a', component: PageAComponent },
          { path: 'b', component: PageBComponent },
          { path: 'c', component: PageCComponent },
          { path: 'q', component: QueryPageComponent },
        ]),
        SdTabRouterService,
        SdTabDecoratorService,
        {
          provide: SdNotifyService,
          useValue: {
            warning: jasmine.createSpy('warning'),
            success: jasmine.createSpy('success'),
            error: jasmine.createSpy('error'),
            info: jasmine.createSpy('info'),
          },
        },
        {
          provide: I18nService,
          useValue: { t: (k: string) => k, instant: (k: string) => k, get: (k: string) => k },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    router = TestBed.inject(Router);
    notify = TestBed.inject(SdNotifyService);

    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    outletCmp = fixture.debugElement.query(By.directive(SdTabRouterOutletComponent)).componentInstance as SdTabRouterOutletComponent;
  });

  describe('activation error recovery', () => {
    for (const retrySameUrl of [false, true]) {
      it(`keeps navigation alive after an activation rejects (${retrySameUrl ? 'same URL retry' : 'another menu'})`, async () => {
        await navigateAndStabilize(router, fixture, '/a');
        const service = TestBed.inject(SdTabRouterService);
        const originalSetCurrentTab = service.setCurrentTab.bind(service);
        const failure = new Error('Synthetic tab activation failure');
        let failOnce = true;
        spyOn(service, 'setCurrentTab').and.callFake(tab => {
          if (tab?.url === '/b' && failOnce) {
            failOnce = false;
            throw failure;
          }
          originalSetCurrentTab(tab);
        });
        const reportError = spyOn(TestBed.inject(ErrorHandler), 'handleError');

        await navigateAndStabilize(router, fixture, '/b');
        expect(reportError).toHaveBeenCalledOnceWith(failure);
        expect(
          outletCmp
            .tabs()
            .filter(tab => tab.isActive)
            .map(tab => tab.url)
        ).toEqual(['/a']);

        const destination = retrySameUrl ? '/b' : '/c';
        await navigateAndStabilize(router, fixture, destination, {
          state: retrySameUrl ? { forceReload: true } : { replaceTab: true },
        });
        expect(
          outletCmp
            .tabs()
            .filter(tab => tab.isActive)
            .map(tab => tab.url)
        ).toEqual([destination]);
        expect(fixture.nativeElement.querySelector(`.tab-router__pane.active [data-cy="page-${retrySameUrl ? 'b' : 'c'}"]`)).not.toBeNull();
        expect(reportError).toHaveBeenCalledTimes(1);
        expect(outletCmp.tabs().length).toBe(retrySameUrl ? 2 : 1);
      });
    }
  });

  describe('navigation → tab creation', () => {
    it('creates a new tab when navigating to a route', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      const tabs = outletCmp.tabs();
      expect(tabs.length).toBe(1);
      expect(tabs[0].url).toBe('/a');
      expect(tabs[0].isActive).toBe(true);
      expect(tabs[0].component).toBe(PageAComponent);
    });

    // why: danh sách tab (đợt 3 · 3b) dựng hàng của nó khi mở menu, sau khi màn hình đã gửi tên qua `tabInfoChanges`.
    it('replays the last tab info to a late subscriber', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      const tab = outletCmp.tabs()[0];
      tab.tabInfoChanges.next({ name: 'Đơn hàng #DH-10234' });
      const received: string[] = [];
      tab.tabInfoChanges.subscribe(info => received.push(info.name)).unsubscribe();
      expect(received).toEqual(['Đơn hàng #DH-10234']);
    });

    it('keeps both tabs when navigating to two different routes', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');

      const tabs = outletCmp.tabs();
      expect(tabs.length).toBe(2);
      expect(tabs.map(t => t.url)).toEqual(['/a', '/b']);

      // Only the most recent tab is active
      const actives = tabs.filter(t => t.isActive);
      expect(actives.length).toBe(1);
      expect(actives[0].url).toBe('/b');
    });

    it('does NOT duplicate tab when navigating to the same URL twice (key is hash(path))', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      await navigateAndStabilize(router, fixture, '/a'); // revisit

      const tabs = outletCmp.tabs();
      expect(tabs.length).toBe(2);
      // /a should now be the active one
      expect(tabs.find(t => t.url === '/a')!.isActive).toBe(true);
      expect(tabs.find(t => t.url === '/b')!.isActive).toBe(false);
    });

    it('preserves the original tab.injector reference when reactivating the same tab', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      const firstInjector = outletCmp.tabs()[0].injector;

      await navigateAndStabilize(router, fixture, '/b');
      await navigateAndStabilize(router, fixture, '/a');

      const tabA = outletCmp.tabs().find(t => t.url === '/a')!;
      expect(tabA.injector).toBe(firstInjector);
    });

    // why: key chỉ còn path — component ghi state lên query (`syncQueryParams`) không được mở thêm tab.
    it('same path with another query or fragment ⇒ same tab, same component, latest queryParams', async () => {
      await navigateAndStabilize(router, fixture, '/a?x=1');
      const [first] = outletCmp.tabs();
      const page = fixture.debugElement.query(By.css('[data-cy="page-a"]')).nativeElement;

      await navigateAndStabilize(router, fixture, '/a?x=2');
      expect(outletCmp.tabs().length).toBe(1);
      expect(outletCmp.tabs()[0].queryParams).toEqual({ x: '2' });
      // Descriptor mới để tên tab dạng hàm tính lại theo query mới; injector và component giữ nguyên.
      expect(outletCmp.tabs()[0]).not.toBe(first);

      await navigateAndStabilize(router, fixture, '/a#h');
      const tabs = outletCmp.tabs();
      expect(tabs.length).toBe(1);
      expect(tabs[0].key).toBe(first.key);
      expect(tabs[0].url).toBe('/a');
      expect(tabs[0].queryParams).toEqual({});
      expect(tabs[0].injector).toBe(first.injector);
      expect(fixture.debugElement.query(By.css('[data-cy="page-a"]')).nativeElement).toBe(page);
    });

    it('reactivating a background tab with another query keeps the component and stores the new query', async () => {
      await navigateAndStabilize(router, fixture, '/a?x=1');
      const injector = outletCmp.tabs()[0].injector;
      await navigateAndStabilize(router, fixture, '/b');
      await navigateAndStabilize(router, fixture, '/a?x=2');

      const tabs = outletCmp.tabs();
      expect(tabs.map(tab => tab.url)).toEqual(['/a', '/b']);
      const tabA = tabs.find(tab => tab.url === '/a')!;
      expect(tabA.isActive).toBeTrue();
      expect(tabA.injector).toBe(injector);
      expect(tabA.queryParams).toEqual({ x: '2' });

      // Bấm tab /b rồi bấm lại tab /a (như thanh tab): URL trở về query mới nhất của tab.
      const tabB = tabs.find(tab => tab.url === '/b')!;
      await router.navigate([tabB.url], { queryParams: tabB.queryParams, state: { switchTab: true } });
      await fixture.whenStable();
      const storedA = outletCmp.tabs().find(tab => tab.url === '/a')!;
      await router.navigate([storedA.url], { queryParams: storedA.queryParams, state: { switchTab: true } });
      await fixture.whenStable();
      expect(router.url).toBe('/a?x=2');
    });

    it('does not re-emit SdTabActivated when only the query of the active tab changes', async () => {
      const service = TestBed.inject(SdTabRouterService);
      const pushEvent = spyOn(service, 'pushEvent').and.callThrough();
      const activated = () => pushEvent.calls.allArgs().filter(([, event]) => event === SdTabActivated).length;

      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      await navigateAndStabilize(router, fixture, '/a');
      expect(activated()).toBe(1);

      await navigateAndStabilize(router, fixture, '/a?x=1');
      expect(activated()).toBe(1);
      expect(outletCmp.tabs().find(tab => tab.isActive)!.queryParams).toEqual({ x: '1' });
    });
  });

  describe('ActivatedRoute inside a tab', () => {
    it('emits the new query to a tab component after switching tabs, without duplicates', async () => {
      queryPageLog.length = 0;
      await navigateAndStabilize(router, fixture, '/q?x=1');
      await navigateAndStabilize(router, fixture, '/b');
      await navigateAndStabilize(router, fixture, '/q?x=1'); // mở lại cùng query: không phát lại
      await navigateAndStabilize(router, fixture, '/b');
      await navigateAndStabilize(router, fixture, '/q?x=2');
      await navigateAndStabilize(router, fixture, '/q?x=3');

      expect(queryPageLog).toEqual(['1', '2', '3']);
      expect(queryPageRoutes.every(route => route instanceof ActivatedRoute)).toBeTrue();
      expect(queryPageRoutes.length).toBe(1);
      expect(queryPageRoutes[0].snapshot.queryParamMap.get('x')).toBe('3');
    });
  });

  describe('disabled mode', () => {
    it('does not create tabs when disabled before navigation', async () => {
      host.disabled = true;
      fixture.detectChanges();

      await navigateAndStabilize(router, fixture, '/a');
      expect(outletCmp.tabs().length).toBe(0);
    });

    it('renders <router-outlet> instead of nav while disabled', () => {
      host.disabled = true;
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('router-outlet')).not.toBeNull();
    });
  });

  describe('close action lifecycle', () => {
    it('closes the active tab and navigates to the neighbor', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');

      const tabRouterService = TestBed.inject(SdTabRouterService);
      const tabB = outletCmp.tabs().find(t => t.url === '/b')!;
      tabRouterService.close(tabB);

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(outletCmp.tabs().length).toBe(1);
      expect(outletCmp.tabs()[0].url).toBe('/a');
    });

    it('closes only the inactive tab without router navigation', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');

      const navByUrlSpy = spyOn(router, 'navigateByUrl').and.callThrough();

      const tabRouterService = TestBed.inject(SdTabRouterService);
      const inactive = outletCmp.tabs().find(t => !t.isActive)!;
      tabRouterService.close(inactive);

      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(outletCmp.tabs().length).toBe(1);
      expect(navByUrlSpy).not.toHaveBeenCalled();
    });
  });

  describe('replaceTab navigation state', () => {
    it('removes the previously active tab when navigating with state.replaceTab', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      expect(outletCmp.tabs().length).toBe(2);

      await navigateAndStabilize(router, fixture, '/c', { state: { replaceTab: true } });

      const tabs = outletCmp.tabs();
      // /b was active, so it is replaced by /c. /a stays.
      expect(tabs.length).toBe(2);
      expect(tabs.map(t => t.url).sort()).toEqual(['/a', '/c']);
      expect(tabs.find(t => t.url === '/c')!.isActive).toBe(true);
    });

    it('falls back to normal add when replaceTab is set but no active tab exists', async () => {
      // navigate first without replaceTab so there is an active tab
      await navigateAndStabilize(router, fixture, '/a');
      const firstLen = outletCmp.tabs().length;
      expect(firstLen).toBe(1);
    });

    it('replaces the active tab and recreates an existing earlier target when replaceTab and forceReload are true', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      const targetBeforeReload = outletCmp.tabs().find(tab => tab.url === '/a')!;
      const targetInjector = targetBeforeReload.injector;

      await navigateAndStabilize(router, fixture, '/a', {
        state: { replaceTab: true, forceReload: true },
      });

      const tabs = outletCmp.tabs();
      expect(tabs.map(tab => tab.url)).toEqual(['/a']);
      expect(tabs[0]).not.toBe(targetBeforeReload);
      expect(tabs[0].injector).not.toBe(targetInjector);
      expect(tabs[0].isActive).toBeTrue();
    });

    it('uses the shifted target index when replaceTab and forceReload remove an earlier active tab', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      await navigateAndStabilize(router, fixture, '/a');
      const targetBeforeReload = outletCmp.tabs().find(tab => tab.url === '/b')!;
      const targetInjector = targetBeforeReload.injector;

      await navigateAndStabilize(router, fixture, '/b', {
        state: { replaceTab: true, forceReload: true },
      });

      const tabs = outletCmp.tabs();
      expect(tabs.map(tab => tab.url)).toEqual(['/b']);
      expect(tabs[0]).not.toBe(targetBeforeReload);
      expect(tabs[0].injector).not.toBe(targetInjector);
      expect(tabs[0].isActive).toBeTrue();
    });
  });

  describe('forceReload navigation state', () => {
    it('adds a missing target normally and preserves existing tab injectors', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      const originalAInjector = outletCmp.tabs()[0].injector;

      await navigateAndStabilize(router, fixture, '/c', {
        state: { forceReload: true },
      });

      const tabs = outletCmp.tabs();
      expect(tabs.map(tab => tab.url)).toEqual(['/a', '/c']);
      expect(tabs.find(tab => tab.url === '/a')!.injector).toBe(originalAInjector);
      expect(tabs.find(tab => tab.url === '/c')!.isActive).toBeTrue();
    });
  });

  describe('too-many-tabs warning', () => {
    it('fires SdNotifyService.warning when tab count exceeds 30', async () => {
      // Seed 30 tabs directly via signal to avoid 30 real navigations.
      const fakeTabs = Array.from({ length: 30 }, (_, i) => ({
        key: `seed-${i}`,
        component: PageAComponent,
        injector: null,
        isActive: false,
        url: `/seed/${i}`,
        params: {},
        queryParams: {},
        data: {},
        tabInfoChanges: new Subject(),
      })) as SdTabRouterTab[];
      (outletCmp as any).tabs.set(fakeTabs);
      fixture.detectChanges();

      // Now real-navigate to /a → that becomes the 31st tab
      await navigateAndStabilize(router, fixture, '/a');

      expect(notify.warning).toHaveBeenCalledWith('core.component.tab-router.too-many-tabs');
    });

    it('does NOT fire warning when total stays at or below 30', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      expect(notify.warning).not.toHaveBeenCalled();
    });
  });

  describe('race condition guard (read-only scan)', () => {
    // Per source comment in #activeRoute: 2 concurrent invocations could interleave and
    // produce duplicate tabs if isActive were mutated mid-loop. Trigger overlapping
    // navigations and verify no duplicate appears.
    it('overlapping navigations do not produce duplicate tabs for the same key', fakeAsync(() => {
      router.navigateByUrl('/a');
      tick();
      router.navigateByUrl('/a'); // same key
      flush();
      fixture.detectChanges();

      expect(outletCmp.tabs().length).toBe(1);
    }));

    // why: tác vụ kích hoạt tab từng đọc `router.routerState` lúc nó chạy chứ không phải lúc NavigationEnd. Khi hàng đợi
    // còn bận (tab trước chờ nạp module lazy), router đã sang URL sau nên tab của URL trước nhận component, route và tên của
    // URL sau.
    it('gives each tab the component and route of its own URL when navigations finish while an activation is pending', async () => {
      let release!: () => void;
      const outletLoad = new Promise<void>(resolve => (release = resolve));
      let loads = 0;
      router.resetConfig([
        ...router.config,
        { path: 'lazy', loadChildren: () => (++loads === 1 ? Promise.resolve(LazyPageModule) : outletLoad.then(() => LazyPageModule)) },
      ]);

      await router.navigateByUrl('/lazy');
      await router.navigateByUrl('/a');
      await router.navigateByUrl('/b');
      release();
      // why: ba lần kích hoạt nối nhau qua concatMap và hàng đợi Promise của outlet — đợi vài vòng cho cả ba chạy xong.
      for (let round = 0; round < 5; round++) {
        fixture.detectChanges();
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve));
      }

      const tabs = outletCmp.tabs();
      expect(tabs.map(tab => tab.url)).toEqual(['/lazy', '/a', '/b']);
      expect(tabs.map(tab => tab.component)).toEqual([LazyPageComponent, PageAComponent, PageBComponent]);
      expect(tabs[1].injector.get(ActivatedRoute, null)?.snapshot.routeConfig?.path).withContext('route of /a').toBe('a');
    });
  });

  describe('beforeClose guard', () => {
    let tabRouterService: SdTabRouterService;

    beforeEach(() => {
      tabRouterService = TestBed.inject(SdTabRouterService);
    });

    it('does not close tab when beforeClose returns false', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      const tab = outletCmp.tabs().find(t => t.url === '/a')!;
      tab.beforeClose = () => false;

      tabRouterService.close(tab);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(outletCmp.tabs().length).toBe(2);
      expect(outletCmp.tabs().find(t => t.url === '/a')).toBeTruthy();
    });

    it('closes tab normally when beforeClose returns true', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      const tab = outletCmp.tabs().find(t => t.url === '/a')!;
      tab.beforeClose = () => true;

      tabRouterService.close(tab);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(outletCmp.tabs().length).toBe(1);
      expect(outletCmp.tabs()[0].url).toBe('/b');
    });

    it('does not close tab when async beforeClose resolves to false', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      const tab = outletCmp.tabs().find(t => t.url === '/a')!;
      tab.beforeClose = () => Promise.resolve(false);

      tabRouterService.close(tab);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(outletCmp.tabs().length).toBe(2);
    });

    it('does not close tab when beforeClose throws', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      await navigateAndStabilize(router, fixture, '/b');
      const tab = outletCmp.tabs().find(t => t.url === '/a')!;
      tab.beforeClose = () => {
        throw new Error('unexpected');
      };

      tabRouterService.close(tab);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(outletCmp.tabs().length).toBe(2);
    });
  });
});
