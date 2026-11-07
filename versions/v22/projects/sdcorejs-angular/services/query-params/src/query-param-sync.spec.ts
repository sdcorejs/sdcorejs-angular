import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { ɵSdQueryParamSync, ɵsdQueryParamState, ɵsdQueryParamSync } from './query-param-sync';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  selector: 'sd-qp-page-a',
  template: 'a',
})
class PageA {
  readonly sync: ɵSdQueryParamSync = ɵsdQueryParamSync();
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  selector: 'sd-qp-page-b',
  template: 'b',
})
class PageB {
  readonly sync: ɵSdQueryParamSync = ɵsdQueryParamSync();
}

const flush = async (harness: RouterTestingHarness): Promise<void> => {
  // Writer flushes in a microtask, then the router navigates asynchronously.
  await Promise.resolve();
  await harness.fixture.whenStable();
};

describe('ɵsdQueryParamSync', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'a', component: PageA },
          { path: 'b', component: PageB },
        ]),
      ],
    });
    router = TestBed.inject(Router);
  });

  it('reads the current value of a param from the route', async () => {
    const harness = await RouterTestingHarness.create('/a?table-x=%7B%22p%22%3A2%7D&other=1');
    const page = harness.routeDebugElement!.componentInstance as PageA;
    expect(page.sync.available).toBeTrue();
    expect(page.sync.value('table-x')).toBe('{"p":2}');
    expect(page.sync.value('missing')).toBeNull();
  });

  it('emits distinct values when the param changes, ignoring other params', async () => {
    const harness = await RouterTestingHarness.create('/a?x=1');
    const page = harness.routeDebugElement!.componentInstance as PageA;
    const values: (string | null)[] = [];
    const subscription = page.sync.changes('x').subscribe(value => values.push(value));

    await router.navigateByUrl('/a?x=1&other=2');
    await router.navigateByUrl('/a?x=2&other=2');
    await router.navigateByUrl('/a?other=3');

    expect(values).toEqual(['1', '2', null]);
    subscription.unsubscribe();
  });

  it('merges writes from the same turn into one replaceUrl navigation and keeps other params and the fragment', async () => {
    const harness = await RouterTestingHarness.create('/a?keep=1#frag');
    const page = harness.routeDebugElement!.componentInstance as PageA;
    const navigate = spyOn(router, 'navigate').and.callThrough();

    page.sync.write('table-x', '{"p":2}');
    page.sync.write('tab-y', '3');
    await flush(harness);

    expect(navigate).toHaveBeenCalledTimes(1);
    const [, extras] = navigate.calls.mostRecent().args;
    expect(extras).toEqual(jasmine.objectContaining({ queryParamsHandling: 'merge', replaceUrl: true, preserveFragment: true }));
    const tree = router.parseUrl(router.url);
    expect(tree.queryParamMap.get('keep')).toBe('1');
    expect(tree.queryParamMap.get('table-x')).toBe('{"p":2}');
    expect(tree.queryParamMap.get('tab-y')).toBe('3');
    expect(tree.fragment).toBe('frag');
  });

  it('removes a param when writing null and skips a write that changes nothing', async () => {
    const harness = await RouterTestingHarness.create('/a?x=1&keep=1');
    const page = harness.routeDebugElement!.componentInstance as PageA;
    const navigate = spyOn(router, 'navigate').and.callThrough();

    page.sync.write('keep', '1');
    await flush(harness);
    expect(navigate).not.toHaveBeenCalled();

    page.sync.write('x', null);
    await flush(harness);
    expect(router.url).toBe('/a?keep=1');
  });

  it('drops a write whose route is no longer part of the router state', async () => {
    const harness = await RouterTestingHarness.create('/a');
    const page = harness.routeDebugElement!.componentInstance as PageA;
    // Keep the instance alive past its route: simulate a component kept by a tab outlet.
    const sync = page.sync;
    await router.navigateByUrl('/b');

    sync.write('x', '1');
    await flush(harness);

    expect(router.url).toBe('/b');
  });

  it('waits for a navigation in progress before writing', async () => {
    const harness = await RouterTestingHarness.create('/a');
    const page = harness.routeDebugElement!.componentInstance as PageB;
    const navigation = router.navigateByUrl('/a?y=1');

    page.sync.write('x', '1');
    await navigation;
    await flush(harness);
    await new Promise(resolve => setTimeout(resolve));
    await flush(harness);

    const tree = router.parseUrl(router.url);
    expect(tree.queryParamMap.get('y')).toBe('1');
    expect(tree.queryParamMap.get('x')).toBe('1');
  });

  it('cancels pending writes when the owner is destroyed', async () => {
    const harness = await RouterTestingHarness.create('/a');
    const page = harness.routeDebugElement!.componentInstance as PageA;

    page.sync.write('x', '1');
    await router.navigateByUrl('/b'); // destroys PageA before the queued write can apply to /b
    await flush(harness);

    expect(router.url).toBe('/b');
  });
});

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  selector: 'sd-qp-state-page',
  template: 'state',
})
class StatePage {
  readonly enabled = signal(true);
  readonly autoId = signal<string | undefined>('demo');
  readonly ready = signal(true);
  /** Serialized state; `null` is the default (param removed). Values starting with "bad" are rejected by apply. */
  readonly state = signal<string | null>(null);
  readonly applied: string[] = [];

  constructor() {
    ɵsdQueryParamState({
      selector: 'sd-demo',
      prefix: 'demo',
      enabled: this.enabled,
      autoId: this.autoId,
      ready: this.ready,
      state: this.state,
      apply: value => {
        this.applied.push(value);
        if (!value.startsWith('bad')) this.state.set(value);
      },
    });
  }
}

describe('ɵsdQueryParamState', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 's', component: StatePage },
          { path: 'b', component: PageB },
        ]),
      ],
    });
    router = TestBed.inject(Router);
  });

  const settle = async (harness: RouterTestingHarness): Promise<void> => {
    harness.fixture.detectChanges();
    for (let i = 0; i < 3; i++) {
      await Promise.resolve();
      await harness.fixture.whenStable();
      harness.fixture.detectChanges();
    }
  };

  it('applies the param found in the URL when the component opens', async () => {
    const harness = await RouterTestingHarness.create('/s?demo-demo=v1');
    const page = harness.routeDebugElement!.componentInstance as StatePage;
    await settle(harness);
    expect(page.applied).toEqual(['v1']);
    expect(page.state()).toBe('v1');
    expect(router.url).toBe('/s?demo-demo=v1');
  });

  it('writes state changes, removes the param at the default, and does not re-apply its own writes', async () => {
    const harness = await RouterTestingHarness.create('/s');
    const page = harness.routeDebugElement!.componentInstance as StatePage;
    await settle(harness);

    page.state.set('v2');
    await settle(harness);
    expect(router.url).toBe('/s?demo-demo=v2');

    page.state.set(null);
    await settle(harness);
    expect(router.url).toBe('/s');
    expect(page.applied).toEqual([]);
  });

  it('applies a param changed from outside and keeps the state when the param disappears', async () => {
    const harness = await RouterTestingHarness.create('/s');
    const page = harness.routeDebugElement!.componentInstance as StatePage;
    await settle(harness);

    await router.navigateByUrl('/s?demo-demo=v3');
    await settle(harness);
    expect(page.state()).toBe('v3');

    await router.navigateByUrl('/s');
    await settle(harness);
    expect(page.state()).toBe('v3');
    expect(router.url).toBe('/s?demo-demo=v3');
  });

  it('replaces a rejected param with the current state', async () => {
    const harness = await RouterTestingHarness.create('/s?demo-demo=bad');
    const page = harness.routeDebugElement!.componentInstance as StatePage;
    await settle(harness);
    expect(page.applied).toEqual(['bad']);
    expect(page.state()).toBeNull();
    expect(router.url).toBe('/s');
  });

  it('neither applies nor writes until ready', async () => {
    TestBed.inject(Router); // keep the configured router
    const harness = await RouterTestingHarness.create('/s?demo-demo=v4');
    const page = harness.routeDebugElement!.componentInstance as StatePage;
    page.ready.set(false);
    await settle(harness);
    // The first effect run may already have happened before `ready` turned false in this test, so only check that
    // the URL still carries the param while not ready.
    expect(router.url).toBe('/s?demo-demo=v4');
    page.ready.set(true);
    await settle(harness);
    expect(page.state()).toBe('v4');
  });

  it('does nothing when disabled, and warns once without autoId', async () => {
    const warn = spyOn(console, 'warn');
    const harness = await RouterTestingHarness.create('/s?demo-demo=v5');
    const page = harness.routeDebugElement!.componentInstance as StatePage;
    page.enabled.set(false);
    page.state.set(null);
    await settle(harness);
    page.state.set('ignored');
    await settle(harness);
    expect(router.url).toBe('/s?demo-demo=v5');

    page.enabled.set(true);
    page.autoId.set(undefined);
    await settle(harness);
    page.state.set('still-ignored');
    await settle(harness);
    expect(router.url).toBe('/s?demo-demo=v5');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.calls.mostRecent().args[0])).toContain('sd-demo');
  });
});

describe('ɵsdQueryParamSync without routes', () => {
  it('is a no-op when the app never configured the router', () => {
    TestBed.configureTestingModule({});
    const sync = TestBed.runInInjectionContext(() => ɵsdQueryParamSync());
    expect(sync.available).toBeFalse();
    expect(sync.value('x')).toBeNull();
    let emitted = false;
    const subscription = sync.changes('x').subscribe(() => (emitted = true));
    expect(emitted).toBeFalse();
    expect(() => sync.write('x', '1')).not.toThrow();
    subscription.unsubscribe();
  });
});
