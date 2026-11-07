import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SD_VIEWPORT, SdViewport } from '@sdcorejs/angular/services/viewport';

import { SdAnchor } from './anchor.component';
import { SdAnchorItem } from '../anchor-item/anchor-item.component';

// why: IntersectionObserver thật bắn callback theo layout của iframe Karma — không tất định. Stub không bao giờ bắn,
// nên mục active chỉ đổi qua click hoặc URL; luôn trả lại bản gốc sau mỗi test.
function StubIntersectionObserver(this: any): void {
  this.observe = () => undefined;
  this.disconnect = () => undefined;
  this.unobserve = () => undefined;
  this.takeRecords = () => [];
}

const desktopViewport: SdViewport = {
  innerWidth: 1440,
  innerHeight: 800,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
};

@Component({
  standalone: true,
  selector: 'sd-anchor-sync-host',
  imports: [SdAnchor, SdAnchorItem],
  template: `
    <div style="height: 300px">
      <sd-anchor [autoId]="autoId()" [syncQueryParams]="sync()">
        <sd-anchor-item title="General" key="general"><div style="height: 400px">1</div></sd-anchor-item>
        <sd-anchor-item title="Address" key="address"><div style="height: 400px">2</div></sd-anchor-item>
        <sd-anchor-item title="Notes"><div style="height: 400px">3</div></sd-anchor-item>
      </sd-anchor>
    </div>
  `,
})
class AnchorSyncHost {
  readonly autoId = signal<string | undefined>('profile');
  readonly sync = signal(true);
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('SdAnchor syncQueryParams', () => {
  let router: Router;
  let originalObserver: typeof IntersectionObserver;

  beforeEach(() => {
    originalObserver = window.IntersectionObserver;
    (window as any).IntersectionObserver = StubIntersectionObserver;
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'p', component: AnchorSyncHost }]), { provide: SD_VIEWPORT, useValue: desktopViewport }],
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    window.IntersectionObserver = originalObserver;
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
    const anchor = harness.fixture.debugElement.query(By.directive(SdAnchor)).componentInstance as SdAnchor;
    return { harness, anchor };
  };

  it('writes the active section key after it settles, an index for a section without key, and removes it at the first section', async () => {
    const { harness, anchor } = await open('/p');
    const [first, second, third] = anchor.sections();

    anchor.scrollSectionByClick(second.id);
    await settle(harness);
    await wait(350);
    await settle(harness);
    expect(router.url).toBe('/p?anchor-profile=address');

    anchor.scrollSectionByClick(third.id);
    await settle(harness);
    await wait(350);
    await settle(harness);
    expect(router.url).toBe('/p?anchor-profile=2');

    anchor.scrollSectionByClick(first.id);
    await settle(harness);
    await wait(350);
    await settle(harness);
    expect(router.url).toBe('/p');
  });

  it('opens on the section from the URL and follows later changes', async () => {
    const { harness, anchor } = await open('/p?anchor-profile=address');
    expect(anchor.activeSectionId()).toBe(anchor.sections()[1].id);

    await router.navigateByUrl('/p?anchor-profile=2');
    await settle(harness);
    expect(anchor.activeSectionId()).toBe(anchor.sections()[2].id);
  });

  it('keeps an unknown section (it may render later) until the user moves to another section', async () => {
    const { harness, anchor } = await open('/p?anchor-profile=missing');
    expect(anchor.activeSectionId()).toBe(anchor.sections()[0].id);
    expect(router.url).toBe('/p?anchor-profile=missing');

    anchor.scrollSectionByClick(anchor.sections()[1].id);
    await settle(harness);
    await wait(350);
    await settle(harness);
    expect(router.url).toBe('/p?anchor-profile=address');
  });

  it('does nothing when off', async () => {
    const { harness, anchor } = await open('/p');
    harness.routeDebugElement!.componentInstance.sync.set(false);
    await settle(harness);
    anchor.scrollSectionByClick(anchor.sections()[1].id);
    await settle(harness);
    await wait(350);
    await settle(harness);
    expect(router.url).toBe('/p');
  });
});
