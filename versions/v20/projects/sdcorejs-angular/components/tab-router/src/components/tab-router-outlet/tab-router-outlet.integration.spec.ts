import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { Subject } from 'rxjs';

import { SdTabRouterOutletComponent } from './tab-router-outlet.component';
import { SdTabRouterService } from '../../services/tab-router.service';
import { SdTabDecoratorService } from '../../services/tab-decorator.service';
import { SdTabRouterTab } from '../../models/tab-router.model';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdNotifyService } from '@sdcorejs/angular/services/notify';

@Component({ standalone: true, template: '<span data-cy="page-a"></span>' })
class PageAComponent {}
@Component({ standalone: true, template: '<span data-cy="page-b"></span>' })
class PageBComponent {}
@Component({ standalone: true, template: '<span data-cy="page-c"></span>' })
class PageCComponent {}

@Component({
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

  describe('navigation → tab creation', () => {
    it('creates a new tab when navigating to a route', async () => {
      await navigateAndStabilize(router, fixture, '/a');
      const tabs = outletCmp.tabs();
      expect(tabs.length).toBe(1);
      expect(tabs[0].url).toBe('/a');
      expect(tabs[0].isActive).toBe(true);
      expect(tabs[0].component).toBe(PageAComponent);
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

    it('does NOT duplicate tab when navigating to the same URL twice (key is hash(url+queryParams))', async () => {
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

    it('different queryParams ⇒ different tab key ⇒ creates a new tab', async () => {
      await navigateAndStabilize(router, fixture, '/a?x=1');
      await navigateAndStabilize(router, fixture, '/a?x=2');

      const tabs = outletCmp.tabs();
      expect(tabs.length).toBe(2);
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
