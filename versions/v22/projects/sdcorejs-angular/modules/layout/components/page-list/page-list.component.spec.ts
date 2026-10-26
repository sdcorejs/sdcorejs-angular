import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter, RouterLink } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { SD_TABLE_LAYOUT } from '@sdcorejs/angular/components/table';

import { SD_PAGE_LIST, SdPageList, type SdPageListDetail } from './page-list.component';

// why: chỉ cần thẻ sd-table để sd-page-list chọn bảng chính; bảng thật nằm trong spec của sd-table và e2e.
@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-table',
  template: `<div class="fake-rows">Bảng</div>`,
})
class FakeTable {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'app-context-probe',
  template: `{{ list.compact() }} {{ list.childActive() }} {{ list.detail() }}`,
})
class ContextProbe {
  readonly list = inject(SD_PAGE_LIST);
}

const state = {
  detail: signal<SdPageListDetail>('page'),
  autoCompact: signal(true),
  wrapMain: signal(false),
};

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  imports: [SdPageList, FakeTable, ContextProbe, RouterLink],
  template: `
    <div style="height: 500px; display: flex; flex-direction: column">
      <sd-page-list title="Đơn hàng" description="Đơn bán lẻ." [detail]="state.detail()" [autoCompact]="state.autoCompact()">
        <button headerRight id="create" type="button">Tạo đơn hàng</button>
        <div sdSubheader id="tabs">Tab trạng thái</div>
        <div id="summary" style="height: 60px">Score card</div>
        <app-context-probe id="probe"></app-context-probe>
        <div id="scrollbox" style="height: 40px; overflow: auto"><div style="height: 400px"></div></div>
        <sd-table id="first"></sd-table>
        @if (state.wrapMain()) {
          <div sdPageListMain id="main-wrapper"><sd-table id="wrapped"></sd-table></div>
        }
        <sd-table id="last"></sd-table>
        <a id="open" routerLink="7">Mở đơn 7</a>
        <div sdFooterRight id="footer-right">Tiếp</div>
      </sd-page-list>
    </div>
  `,
})
class ListPage {
  readonly state = state;
}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  template: `<p id="detail">Chi tiết đơn</p>`,
})
class DetailPage {}

describe('SdPageList', () => {
  let harness: RouterTestingHarness;
  const host = () => harness.routeNativeElement!.querySelector('sd-page-list') as HTMLElement;
  const innerPage = () => host().querySelector('sd-page') as HTMLElement;
  const list = () => harness.fixture.debugElement.query(By.directive(SdPageList)).componentInstance as SdPageList;

  beforeEach(async () => {
    state.detail.set('page');
    state.autoCompact.set(true);
    state.wrapMain.set(false);
    TestBed.configureTestingModule({
      providers: [provideRouter([{ path: 'orders', component: ListPage, children: [{ path: ':id', component: DetailPage }] }])],
    });
    harness = await RouterTestingHarness.create('/orders');
    await harness.fixture.whenStable();
    harness.detectChanges();
  });

  it('renders an sd-page with the title, description and forwarded slots', () => {
    expect(innerPage().querySelector('h1')!.textContent?.trim()).toBe('Đơn hàng');
    expect(innerPage().querySelector('.T14R')!.textContent?.trim()).toBe('Đơn bán lẻ.');
    expect(innerPage().querySelector('.c-page-header > div #create')).not.toBeNull();
    expect(innerPage().querySelector('.c-page-header > #tabs')).not.toBeNull();
    expect(innerPage().querySelector(':scope > footer #footer-right')).not.toBeNull();
    expect(innerPage().querySelector('.c-page-content #summary')).not.toBeNull();
  });

  it('gives the content one SdPageListContext that is also the table layout', () => {
    const debug = harness.fixture.debugElement.query(By.css('#probe'));
    expect(debug.injector.get(SD_PAGE_LIST)).toBe(list());
    expect(debug.injector.get(SD_TABLE_LAYOUT)).toBe(list());
    expect(list().detail()).toBe('page');
  });

  it('picks the last direct sd-table of the body as the main table', () => {
    expect(list().fillTarget()).toBe(host().querySelector('#last'));
  });

  it('prefers an [sdPageListMain] wrapper and lets it fill the remaining height', async () => {
    state.wrapMain.set(true);
    harness.detectChanges();
    // why: sd-page-list chọn lại bảng chính trong callback của MutationObserver (microtask sau khi DOM đổi).
    await new Promise(resolve => setTimeout(resolve));
    harness.detectChanges();

    const main = host().querySelector('#main-wrapper') as HTMLElement;
    expect(list().fillTarget()).toBe(main);
    const wrapper = innerPage().querySelector('.c-page-wrapper') as HTMLElement;
    expect(getComputedStyle(main).flexGrow).toBe('1');
    expect(wrapper.scrollHeight).toBe(wrapper.clientHeight);
  });

  it('lays the body out as a 16px padded column with 12px gaps', () => {
    const wrapper = innerPage().querySelector('.c-page-wrapper') as HTMLElement;
    const content = innerPage().querySelector('.c-page-content') as HTMLElement;
    expect(getComputedStyle(wrapper).paddingLeft).toBe('16px');
    expect(getComputedStyle(wrapper).paddingTop).toBe('16px');
    expect(getComputedStyle(content).flexDirection).toBe('column');
    expect(getComputedStyle(content).rowGap).toBe('12px');
  });

  it('turns compact on only for a short viewport, and never with autoCompact off', () => {
    expect(list().compact()).toBe(matchMedia('(max-height: 719px)').matches);
    state.autoCompact.set(false);
    harness.detectChanges();
    expect(list().compact()).toBeFalse();
    expect(list().externalFilterCollapsed()).toBeFalse();
  });

  describe('detail="page"', () => {
    it('hides the list while a child route is open and shows it again on the way back', async () => {
      await harness.navigateByUrl('/orders/7');
      expect(list().childActive()).toBeTrue();
      expect(getComputedStyle(innerPage()).display).toBe('none');
      expect(harness.routeNativeElement!.querySelector('#detail')).not.toBeNull();

      await harness.navigateByUrl('/orders');
      expect(list().childActive()).toBeFalse();
      expect(getComputedStyle(innerPage()).display).not.toBe('none');
    });

    it('restores scroll positions and the focus the list had before the child opened', async () => {
      const scrollbox = host().querySelector('#scrollbox') as HTMLElement;
      scrollbox.scrollTop = 50;
      const opener = host().querySelector('#open') as HTMLAnchorElement;
      opener.focus();

      await harness.navigateByUrl('/orders/7');
      await harness.navigateByUrl('/orders');
      await harness.fixture.whenStable();

      expect((host().querySelector('#scrollbox') as HTMLElement).scrollTop).toBe(50);
      expect(document.activeElement).toBe(host().querySelector('#open'));
    });
  });

  describe('detail="drawer"', () => {
    it('keeps the list on screen while the child route is open', async () => {
      state.detail.set('drawer');
      harness.detectChanges();

      await harness.navigateByUrl('/orders/7');
      expect(list().childActive()).toBeTrue();
      expect(getComputedStyle(innerPage()).display).not.toBe('none');
    });
  });
});
