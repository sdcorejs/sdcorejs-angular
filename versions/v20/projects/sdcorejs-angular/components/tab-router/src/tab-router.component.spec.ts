import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { SdTabRouterNavComponent } from './components/tab-router-nav/tab-router-nav.component';
import { SdTabRouterItemComponent } from './components/tab-router-item/tab-router-item.component';
import { SdTabRouterOutletComponent } from './components/tab-router-outlet/tab-router-outlet.component';
import { SdTabRouterService } from './services/tab-router.service';
import { SdTabDecoratorService } from './services/tab-decorator.service';
import { SdTabRouterTab, SdTabInfo } from './models/tab-router.model';

// ---------------------------------------------------------------------------
// Stub component — must have @Component for ngComponentOutlet to work
// ---------------------------------------------------------------------------

@Component({ selector: 'sd-tab-test-dummy', standalone: true, template: '' })
class DummyTabComponent {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTab(overrides: Partial<SdTabRouterTab> = {}): SdTabRouterTab {
  return {
    key: 'tab-key-1',
    component: DummyTabComponent,
    isActive: false,
    url: '/some/path',
    queryParams: {},
    params: {},
    data: {},
    tabInfoChanges: new Subject<SdTabInfo>(),
    ...overrides,
  } as SdTabRouterTab;
}

// ---------------------------------------------------------------------------
// SdTabRouterNav
// ---------------------------------------------------------------------------

describe('SdTabRouterNav', () => {
  @Component({
    standalone: true,
    imports: [SdTabRouterNavComponent],
    template: `<sd-tab-router-nav [tabs]="tabs"></sd-tab-router-nav>`,
  })
  class NavHost {
    tabs: SdTabRouterTab[] = [];
  }

  let fixture: ComponentFixture<NavHost>;
  let host: NavHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavHost, NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    const de = fixture.debugElement.query(By.directive(SdTabRouterNavComponent));
    expect(de).not.toBeNull();
    expect(de.componentInstance).toBeTruthy();
  });

  it('renders a tab-router__nav wrapper element', () => {
    const nav = fixture.nativeElement.querySelector('.tab-router__nav') as HTMLElement;
    expect(nav).not.toBeNull();
  });

  it('accepts an empty tabs input without error', () => {
    host.tabs = [];
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('sd-tab-router-item');
    expect(items.length).toBe(0);
  });

  it('renders one sd-tab-router-item per tab', () => {
    host.tabs = [makeTab({ key: 'k1', url: '/a' }), makeTab({ key: 'k2', url: '/b' })];
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('sd-tab-router-item');
    expect(items.length).toBe(2);
  });

  // why: đợt 3 · 3b — thanh cuộn ngang khi tab không còn vừa, nên compact mode (`mode`, `checkUI`, nghe resize cửa sổ)
  // bị gỡ; outlet cũng không còn gọi `checkUI()`.
  it('has no compact mode or checkUI any more, the bar scrolls instead', () => {
    const cmp = fixture.debugElement.query(By.directive(SdTabRouterNavComponent)).componentInstance as Record<string, unknown>;
    expect('mode' in cmp).toBe(false);
    expect('checkUI' in cmp).toBe(false);
  });

  it('no longer marks the nav with a mode class (compact styles targeted classes that were gone)', () => {
    expect(fixture.nativeElement.querySelector('.tab-router__nav--default')).toBeNull();
    expect(fixture.nativeElement.querySelector('.tab-router__nav--compact')).toBeNull();
  });

  it('onDrop reorders tabs via moveItemInArray', () => {
    const tabs = [makeTab({ key: 'k1', url: '/a' }), makeTab({ key: 'k2', url: '/b' }), makeTab({ key: 'k3', url: '/c' })];
    host.tabs = tabs;
    fixture.detectChanges();

    const cmp = fixture.debugElement.query(By.directive(SdTabRouterNavComponent)).componentInstance as SdTabRouterNavComponent;

    // Simulate drag from index 0 to index 2
    cmp.onDrop({ previousIndex: 0, currentIndex: 2 } as any);

    expect(host.tabs[0].key).toBe('k2');
    expect(host.tabs[2].key).toBe('k1');
  });

  // why: điều kiện cũ `[class.d-none]="tabs().length > 1"` bị ngược — thanh ẩn đúng lúc có nhiều tab (đợt 3 · 3a).
  it('hides the nav when only 1 tab is present', () => {
    host.tabs = [makeTab({ key: 'k1', url: '/a' })];
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('.tab-router__nav') as HTMLElement;
    expect(nav.classList.contains('tab-router__nav--hidden')).toBe(true);
  });

  it('shows the nav when more than 1 tab is present', () => {
    host.tabs = [makeTab({ key: 'k1', url: '/a' }), makeTab({ key: 'k2', url: '/b' })];
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('.tab-router__nav') as HTMLElement;
    expect(nav.classList.contains('tab-router__nav--hidden')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// SdTabRouterItem
// ---------------------------------------------------------------------------

describe('SdTabRouterItem', () => {
  let tabRouterService: SdTabRouterService;

  @Component({
    standalone: true,
    imports: [SdTabRouterItemComponent],
    template: `<sd-tab-router-item [tab]="tab"></sd-tab-router-item>`,
  })
  class ItemHost {
    tab: SdTabRouterTab = makeTab({ key: 'item-k1', url: '/item/1' });
  }

  let fixture: ComponentFixture<ItemHost>;
  let host: ItemHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemHost, NoopAnimationsModule],
      providers: [provideRouter([]), SdTabRouterService],
    }).compileComponents();

    tabRouterService = TestBed.inject(SdTabRouterService);
    fixture = TestBed.createComponent(ItemHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    const de = fixture.debugElement.query(By.directive(SdTabRouterItemComponent));
    expect(de).not.toBeNull();
    expect(de.componentInstance).toBeTruthy();
  });

  it('renders an anchor element with tab url href', () => {
    const anchor = fixture.nativeElement.querySelector('a.tab-router__item') as HTMLAnchorElement;
    expect(anchor).not.toBeNull();
    // href is set via [href]="[tab.url]" (array binding results in comma-joined string)
    expect(anchor.getAttribute('href')).toBeTruthy();
  });

  it('applies tab-router__item--active class when tab.isActive is true', () => {
    host.tab = makeTab({ key: 'k1', url: '/a', isActive: true });
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('a.tab-router__item') as HTMLElement;
    expect(anchor.classList.contains('tab-router__item--active')).toBe(true);
  });

  it('does NOT apply tab-router__item--active when tab.isActive is false', () => {
    host.tab = makeTab({ key: 'k1', url: '/a', isActive: false });
    fixture.detectChanges();
    const anchor = fixture.nativeElement.querySelector('a.tab-router__item') as HTMLElement;
    expect(anchor.classList.contains('tab-router__item--active')).toBe(false);
  });

  it('onTabClick prevents default and navigates to tab.url', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    const anchor = fixture.nativeElement.querySelector('a.tab-router__item') as HTMLElement;
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(ev);
    fixture.detectChanges();

    expect(navigateSpy).toHaveBeenCalledWith([host.tab.url], jasmine.objectContaining({ state: { switchTab: true } }));
  });

  it('close() calls SdTabRouterService.close with the tab', () => {
    const closeSpy = spyOn(tabRouterService, 'close');
    const cmp = fixture.debugElement.query(By.directive(SdTabRouterItemComponent)).componentInstance as SdTabRouterItemComponent;

    const ev = new MouseEvent('click', { bubbles: false, cancelable: true });
    cmp.close(ev);

    expect(closeSpy).toHaveBeenCalledWith(host.tab);
  });

  it('close() delegates to service even when beforeClose returns false', () => {
    const closeSpy = spyOn(tabRouterService, 'close');
    const beforeCloseSpy = jasmine.createSpy('beforeClose').and.returnValue(false);
    host.tab = makeTab({
      key: 'k2',
      url: '/b',
      beforeClose: beforeCloseSpy,
    });
    fixture.detectChanges();

    const cmp = fixture.debugElement.query(By.directive(SdTabRouterItemComponent)).componentInstance as SdTabRouterItemComponent;

    cmp.close(new MouseEvent('click'));

    expect(closeSpy).toHaveBeenCalledWith(host.tab);
    expect(beforeCloseSpy).not.toHaveBeenCalled();
  });

  it('onMousedown with middle-click (button=1) prevents default', () => {
    const cmp = fixture.debugElement.query(By.directive(SdTabRouterItemComponent)).componentInstance as SdTabRouterItemComponent;
    const ev = new MouseEvent('mousedown', { button: 1, cancelable: true });
    const preventSpy = spyOn(ev, 'preventDefault');
    cmp.onMousedown(ev);
    expect(preventSpy).toHaveBeenCalled();
  });

  it('tabInfoChanges updates tabInfo on the component', fakeAsync(() => {
    const cmp = fixture.debugElement.query(By.directive(SdTabRouterItemComponent)).componentInstance as SdTabRouterItemComponent;

    const newInfo: SdTabInfo = { name: 'Updated Name', icon: 'edit', color: 'primary' };
    host.tab.tabInfoChanges.next(newInfo);
    tick(200); // debounceTime in events, startWith in tabInfoChanges has no debounce
    fixture.detectChanges();

    expect(cmp.tabInfo).toEqual(newInfo);
  }));
});

// ---------------------------------------------------------------------------
// SdTabRouterOutlet
// ---------------------------------------------------------------------------

describe('SdTabRouterOutlet', () => {
  @Component({
    standalone: true,
    imports: [SdTabRouterOutletComponent],
    template: `<sd-tab-router-outlet [disabled]="disabled"></sd-tab-router-outlet>`,
  })
  class OutletHost {
    disabled = false;
  }

  let fixture: ComponentFixture<OutletHost>;
  let host: OutletHost;
  let outletCmp: SdTabRouterOutletComponent;
  let tabRouterService: SdTabRouterService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutletHost, NoopAnimationsModule],
      providers: [provideRouter([]), SdTabRouterService, SdTabDecoratorService],
    }).compileComponents();

    tabRouterService = TestBed.inject(SdTabRouterService);
    fixture = TestBed.createComponent(OutletHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    outletCmp = fixture.debugElement.query(By.directive(SdTabRouterOutletComponent)).componentInstance as SdTabRouterOutletComponent;
  });

  it('creates the component', () => {
    expect(outletCmp).toBeTruthy();
  });

  it('renders router-outlet when disabled=true', () => {
    host.disabled = true;
    fixture.detectChanges();
    const routerOutlet = fixture.nativeElement.querySelector('router-outlet');
    expect(routerOutlet).not.toBeNull();
  });

  it('renders sd-tab-router-nav when disabled=false', () => {
    host.disabled = false;
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('sd-tab-router-nav');
    expect(nav).not.toBeNull();
  });

  // why: `100vh` trên mobile tính cả phần thanh địa chỉ đang hiện; `100dvh` thì không (đợt 3 · 3a). Dòng 100vh đứng
  // trước làm fallback; CSSOM chỉ giữ khai báo thắng nên spec chỉ thấy được 100dvh.
  it('sizes the host to 100dvh', () => {
    const hostRules = Array.from(document.styleSheets)
      .flatMap(sheet => Array.from(sheet.cssRules))
      .filter((rule): rule is CSSStyleRule => rule instanceof CSSStyleRule && /^\[_nghost-[^\]]+\]$/.test(rule.selectorText))
      .filter(rule =>
        Array.from(rule.parentStyleSheet!.cssRules).some(r => /tab-router__pane/.test((r as CSSStyleRule).selectorText ?? ''))
      );
    expect(hostRules.length).toBe(1);
    expect(hostRules[0].style.height).toBe('100dvh');
  });

  // why: `.tab-router__empty` từng là một div trống không có style hay nội dung — đã bỏ (đợt 3 · 3a).
  it('renders no pane and no placeholder when the tabs signal is empty', () => {
    expect((outletCmp as any).tabs()).toEqual([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tab-router__list')!.children.length).toBe(0);
  });

  it('tabTrackBy returns tab.key', () => {
    const tab = makeTab({ key: 'track-key', url: '/t' });
    expect(outletCmp.tabTrackBy(0, tab)).toBe('track-key');
  });

  it('close action removes an inactive tab without navigation', () => {
    const tab1 = makeTab({ key: 'k1', url: '/a', isActive: true });
    const tab2 = makeTab({ key: 'k2', url: '/b', isActive: false });
    (outletCmp as any).tabs.set([tab1, tab2]);
    fixture.detectChanges();

    tabRouterService.close(tab2);
    fixture.detectChanges();

    const remaining = (outletCmp as any).tabs() as SdTabRouterTab[];
    expect(remaining.length).toBe(1);
    expect(remaining[0].key).toBe('k1');
  });

  it('close action on active tab navigates to neighbor then removes it', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    const tab1 = makeTab({ key: 'k1', url: '/a', isActive: true });
    const tab2 = makeTab({ key: 'k2', url: '/b', isActive: false });
    (outletCmp as any).tabs.set([tab1, tab2]);
    fixture.detectChanges();

    tabRouterService.close(tab1);
    fixture.detectChanges();

    const remaining = (outletCmp as any).tabs() as SdTabRouterTab[];
    expect(remaining.length).toBe(1);
    expect(remaining[0].key).toBe('k2');
    expect(navigateSpy).toHaveBeenCalledWith([tab2.url], jasmine.objectContaining({ state: { switchTab: true } }));
  });

  it('close action on the only active tab navigates to "/"', () => {
    const router = TestBed.inject(Router);
    const navigateByUrlSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));

    const tab = makeTab({ key: 'k1', url: '/a', isActive: true });
    (outletCmp as any).tabs.set([tab]);
    fixture.detectChanges();

    tabRouterService.close(tab);
    fixture.detectChanges();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/', jasmine.objectContaining({ state: { switchTab: true } }));
    const remaining = (outletCmp as any).tabs() as SdTabRouterTab[];
    expect(remaining.length).toBe(0);
  });

  it('does nothing when close action fires while disabled=true', () => {
    host.disabled = true;
    fixture.detectChanges();

    const tab = makeTab({ key: 'k1', url: '/a', isActive: true });
    (outletCmp as any).tabs.set([tab]);
    fixture.detectChanges();

    tabRouterService.close(tab);
    fixture.detectChanges();

    const remaining = (outletCmp as any).tabs() as SdTabRouterTab[];
    expect(remaining.length).toBe(1);
  });
});
