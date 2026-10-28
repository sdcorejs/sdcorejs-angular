import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { ReplaySubject } from 'rxjs';

import { SdTabComponent, ɵsdResetTabComponentBuilders } from '../../decorators/tab.decorator';
import { SdTabInfo, SdTabRouterTab } from '../../models/tab-router.model';
import { SdTabRouterOutletComponent } from './tab-router-outlet.component';

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-tab-title-order',
  standalone: true,
  template: '',
})
class TitleOrderPage {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  selector: 'sd-tab-title-other',
  standalone: true,
  template: '',
})
class TitleOtherPage {}

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  imports: [SdTabRouterOutletComponent],
  template: `
    @if (alive()) {
      <sd-tab-router-outlet [syncBrowserTitle]="sync()" [disabled]="disabled()" />
    }
  `,
})
class TitleHost {
  readonly alive = signal(true);
  readonly sync = signal(true);
  readonly disabled = signal(false);
}

const tab = (key: string, isActive: boolean, component: SdTabRouterTab['component'] = TitleOtherPage): SdTabRouterTab => ({
  key,
  component,
  isActive,
  url: `/${key}`,
  queryParams: {},
  params: {},
  data: {},
  tabInfoChanges: new ReplaySubject<SdTabInfo>(1),
});

// Đợt 3 · 3d (design handoff `tab-router.md`, mục "Một tab và tiêu đề trình duyệt"): input `syncBrowserTitle`.
describe('SdTabRouterOutlet syncBrowserTitle (wave 3 · 3d)', () => {
  let fixture: ComponentFixture<TitleHost>;
  let title: Title;
  let saved: string;

  const outlet = () =>
    fixture.debugElement.query(By.directive(SdTabRouterOutletComponent))?.componentInstance as SdTabRouterOutletComponent;
  const setTabs = (tabs: SdTabRouterTab[]) => {
    outlet().tabs.set(tabs);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    saved = document.title;
    await TestBed.configureTestingModule({
      imports: [TitleHost, NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();
    title = TestBed.inject(Title);
    title.setTitle('Portal');
    fixture = TestBed.createComponent(TitleHost);
  });

  afterEach(() => {
    document.title = saved;
    ɵsdResetTabComponentBuilders();
  });

  it('is off by default and leaves the title alone', () => {
    fixture.componentInstance.sync.set(false);
    fixture.detectChanges();
    const order = tab('a', true);
    setTabs([order, tab('b', false)]);
    order.tabInfoChanges.next({ name: 'Tổng quan' });
    fixture.detectChanges();
    expect(title.getTitle()).toBe('Portal');
  });

  it('shows "{tab name} – {app title}", the app title being the title when the outlet started', () => {
    fixture.detectChanges();
    const first = tab('a', true);
    setTabs([first]);
    first.tabInfoChanges.next({ name: 'Tổng quan' });
    fixture.detectChanges();
    expect(title.getTitle()).toBe('Tổng quan – Portal');
  });

  it('follows the open tab and renames of its tab info, with "● " in front while it is dirty', () => {
    fixture.detectChanges();
    const first = tab('a', true);
    const second = tab('b', false);
    setTabs([first, second]);
    first.tabInfoChanges.next({ name: 'Tổng quan' });
    second.tabInfoChanges.next({ name: 'Khách hàng' });
    fixture.detectChanges();

    setTabs([
      { ...first, isActive: false },
      { ...second, isActive: true },
    ]);
    expect(title.getTitle()).toBe('Khách hàng – Portal');

    second.tabInfoChanges.next({ name: 'Khách hàng KH-001', dirty: true });
    fixture.detectChanges();
    expect(title.getTitle()).toBe('● Khách hàng KH-001 – Portal');

    second.tabInfoChanges.next({ name: 'Khách hàng KH-001', dirty: false });
    fixture.detectChanges();
    expect(title.getTitle()).toBe('Khách hàng KH-001 – Portal');
  });

  it('uses the name from @SdTabComponent before the screen sends tab info', () => {
    // why: đăng ký ngay trong test — spec khác xoá collection builder tĩnh sau mỗi test.
    SdTabComponent({ component: TitleOrderPage, name: 'Đơn hàng' })(TitleOrderPage);
    fixture.detectChanges();
    setTabs([tab('order', true, TitleOrderPage)]);
    expect(title.getTitle()).toBe('Đơn hàng – Portal');
  });

  it('gives the app title back when turned off, when disabled and when the outlet is destroyed', () => {
    fixture.detectChanges();
    const first = tab('a', true);
    setTabs([first]);
    first.tabInfoChanges.next({ name: 'Tổng quan' });
    fixture.detectChanges();

    fixture.componentInstance.sync.set(false);
    fixture.detectChanges();
    expect(title.getTitle()).withContext('turned off').toBe('Portal');

    fixture.componentInstance.sync.set(true);
    fixture.detectChanges();
    expect(title.getTitle()).toBe('Tổng quan – Portal');
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(title.getTitle()).withContext('disabled').toBe('Portal');

    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    expect(title.getTitle()).toBe('Tổng quan – Portal');
    fixture.componentInstance.alive.set(false);
    fixture.detectChanges();
    expect(title.getTitle()).withContext('destroyed').toBe('Portal');
  });
});
