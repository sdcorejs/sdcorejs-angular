import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { SdTab } from './tab.component';
import { SdTabGroup } from './tab-group.component';

@Component({
  standalone: true,
  selector: 'sd-tab-sync-host',
  imports: [SdTabGroup, SdTab],
  template: `
    <sd-tab-group [(selectedIndex)]="selectedIndex" [autoId]="autoId()" [syncQueryParams]="sync()">
      <sd-tab label="Alpha">A</sd-tab>
      <sd-tab label="Beta">B</sd-tab>
      <sd-tab label="Gamma" [disabled]="true">C</sd-tab>
      <sd-tab label="Delta">D</sd-tab>
      @if (extra()) {
        <sd-tab label="Epsilon">E</sd-tab>
      }
    </sd-tab-group>
  `,
})
class TabSyncHost {
  readonly extra = signal(false);
  readonly selectedIndex = signal(0);
  readonly autoId = signal<string | undefined>('detail');
  readonly sync = signal(true);
}

describe('SdTabGroup syncQueryParams', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [provideRouter([{ path: 'p', component: TabSyncHost }])],
    });
    router = TestBed.inject(Router);
  });

  const settle = async (harness: RouterTestingHarness): Promise<void> => {
    for (let i = 0; i < 4; i++) {
      harness.fixture.detectChanges();
      await Promise.resolve();
      await harness.fixture.whenStable();
    }
    harness.fixture.detectChanges();
  };

  const open = async (url: string) => {
    const harness = await RouterTestingHarness.create(url);
    await settle(harness);
    return { harness, host: harness.routeDebugElement!.componentInstance as TabSyncHost };
  };

  it('is off by default: no param is written', async () => {
    @Component({
      standalone: true,
      selector: 'sd-tab-sync-default-host',
      imports: [SdTabGroup, SdTab],
      template: `<sd-tab-group [(selectedIndex)]="selectedIndex" autoId="detail"
        ><sd-tab label="A">A</sd-tab><sd-tab label="B">B</sd-tab></sd-tab-group
      >`,
    })
    class DefaultHost {
      readonly selectedIndex = signal(0);
    }
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule],
      providers: [provideRouter([{ path: 'p', component: DefaultHost }])],
    });
    const harness = await RouterTestingHarness.create('/p?tab-detail=1');
    await settle(harness);
    const host = harness.routeDebugElement!.componentInstance as DefaultHost;
    expect(host.selectedIndex()).toBe(0);
    host.selectedIndex.set(1);
    await settle(harness);
    expect(TestBed.inject(Router).url).toBe('/p?tab-detail=1');
  });

  it('writes the selected tab and removes the param back at the initial tab', async () => {
    const { harness, host } = await open('/p');
    host.selectedIndex.set(1);
    await settle(harness);
    expect(router.url).toBe('/p?tab-detail=1');

    host.selectedIndex.set(0);
    await settle(harness);
    expect(router.url).toBe('/p');
  });

  it('opens on the tab from the URL and follows later changes', async () => {
    const { harness, host } = await open('/p?tab-detail=3');
    expect(host.selectedIndex()).toBe(3);

    await router.navigateByUrl('/p?tab-detail=1');
    await settle(harness);
    expect(host.selectedIndex()).toBe(1);
  });

  it('ignores a disabled tab or a malformed value and writes the current tab back', async () => {
    const { harness, host } = await open('/p?tab-detail=2');
    expect(host.selectedIndex()).toBe(0);
    expect(router.url).toBe('/p');

    await router.navigateByUrl('/p?tab-detail=abc');
    await settle(harness);
    expect(host.selectedIndex()).toBe(0);
    expect(router.url).toBe('/p');
  });

  it('keeps an index whose tab is not rendered yet and selects it when the tab appears', async () => {
    const { harness, host } = await open('/p?tab-detail=4');
    expect(host.selectedIndex()).toBe(0);
    expect(router.url).toBe('/p?tab-detail=4');

    host.extra.set(true);
    await settle(harness);
    expect(host.selectedIndex()).toBe(4);
    expect(router.url).toBe('/p?tab-detail=4');
  });

  it('drops a pending index once the user picks another tab', async () => {
    const { harness, host } = await open('/p?tab-detail=9');
    host.selectedIndex.set(1);
    await settle(harness);
    expect(router.url).toBe('/p?tab-detail=1');
  });

  it('keeps the selected tab when the param disappears', async () => {
    const { harness, host } = await open('/p?tab-detail=1');
    await router.navigateByUrl('/p');
    await settle(harness);
    expect(host.selectedIndex()).toBe(1);
    expect(router.url).toBe('/p?tab-detail=1');
  });

  it('warns once and does not sync without autoId', async () => {
    const warn = spyOn(console, 'warn');
    const { harness, host } = await open('/p');
    host.autoId.set(undefined);
    await settle(harness);
    host.selectedIndex.set(1);
    await settle(harness);
    expect(router.url).toBe('/p');
    expect(warn).toHaveBeenCalledTimes(1);
  });
});
