import { OverlayContainer } from '@angular/cdk/overlay';
import { DOCUMENT } from '@angular/common';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { SdLayoutContext } from '../../../../configurations';
import { SdLayoutContextService, SdLayoutMenu, SdLayoutStorageService } from '../../../../services';
import { SdLayoutContextSwitcher } from '../../../shared/context-switcher/context-switcher.component';
import { SdSidebarMobileOverlay } from './sidebar.component';

interface ContextServiceStub {
  current: WritableSignal<SdLayoutContext | null>;
  items: WritableSignal<readonly SdLayoutContext[]>;
  switchingId: WritableSignal<string | null>;
  switchFailed: WritableSignal<boolean>;
  changedElsewhere: WritableSignal<boolean>;
  syncItems: jasmine.Spy;
  setCurrentContext: jasmine.Spy;
  reload: jasmine.Spy;
  getCurrentContext: jasmine.Spy;
}

// why: service thật reload trang qua runtime — spec sidebar chỉ cần state đã đối chiếu (INV-010).
function createContextStub(): ContextServiceStub {
  const stub: ContextServiceStub = {
    current: signal<SdLayoutContext | null>(null),
    items: signal<readonly SdLayoutContext[]>([]),
    switchingId: signal<string | null>(null),
    switchFailed: signal(false),
    changedElsewhere: signal(false),
    syncItems: jasmine.createSpy('syncItems'),
    setCurrentContext: jasmine.createSpy('setCurrentContext'),
    reload: jasmine.createSpy('reload'),
    getCurrentContext: jasmine.createSpy('getCurrentContext'),
  };
  stub.syncItems.and.callFake((items: readonly SdLayoutContext[] | null | undefined) => {
    const list = items ?? [];
    stub.items.set(list);
    if (!stub.current() && list.length) stub.current.set(list[0]);
  });
  stub.getCurrentContext.and.callFake(() => stub.current());
  return stub;
}

describe('SdSidebarMobileOverlay', () => {
  let fixture: ComponentFixture<SdSidebarMobileOverlay>;
  let component: SdSidebarMobileOverlay;
  let routerEvents: Subject<unknown>;
  let router: { events: Subject<unknown>; url: string; navigate: jasmine.Spy };
  let activeId: string;
  let storage: { lastActiveMenuGroupId: { get: jasmine.Spy; set: jasmine.Spy } };

  const leaf: SdLayoutMenu = { id: 'users', title: 'Users', path: '/admin/users', queryParams: { tab: 1 }, permission: true };
  const child: SdLayoutMenu = { id: 'admin', title: 'Admin', children: [leaf] };
  const group: SdLayoutMenu = { id: 'work', title: 'Work', tooltipTitle: 'Daily work', children: [child] };
  const report: SdLayoutMenu = { id: 'reports', title: 'Reports', path: '/reports', permission: true };
  const menus = [group, report];

  beforeEach(async () => {
    activeId = '';
    routerEvents = new Subject<unknown>();
    router = { events: routerEvents, url: '/admin/users/detail', navigate: jasmine.createSpy('navigate').and.resolveTo(true) };
    storage = {
      lastActiveMenuGroupId: {
        get: jasmine.createSpy('get').and.callFake(() => activeId),
        set: jasmine.createSpy('set').and.callFake((value: string) => (activeId = value)),
      },
    };
    await TestBed.configureTestingModule({
      imports: [SdSidebarMobileOverlay],
      providers: [
        { provide: Router, useValue: router },
        { provide: SdLayoutStorageService, useValue: storage },
      ],
    })
      .overrideComponent(SdSidebarMobileOverlay, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SdSidebarMobileOverlay);
    component = fixture.componentInstance;
    component.currentPath.set('/admin/users/detail');
    fixture.componentRef.setInput('menus', menus);
    fixture.componentRef.setInput('userInfo', { fullName: 'Mobile User' });
    fixture.componentRef.setInput('sidebar', { version: 1 });
    fixture.componentRef.setInput('isShowSidebar', true);
    fixture.detectChanges();
  });

  it('binds the nested current path to its top-level group', () => {
    expect(component.titleMenuGroup()).toBe('Daily work');
    expect(activeId).toBe('work');
  });

  it('toggles mobile groups and safely ignores missing ids', () => {
    component.toggleMobileGroup(undefined);
    expect(component.isExpanded(undefined)).toBeFalse();

    component.toggleMobileGroup('work');
    expect(component.isExpanded('work')).toBeTrue();
    component.toggleMobileGroup('work');
    expect(component.isExpanded('work')).toBeFalse();
  });

  it('exposes type-safe child, path and query helpers', () => {
    expect(component.hasChildren(group)).toBeTrue();
    expect(component.hasChildren(leaf)).toBeFalse();
    expect(component.getChildren(group)).toEqual([child]);
    expect(component.getChildren(leaf)).toEqual([]);
    expect(component.getPath(leaf)).toBe('/admin/users');
    expect(component.getPath(group)).toBeUndefined();
    expect(component.getQueryParams(leaf)).toEqual({ tab: 1 });
    expect(component.getQueryParams(group)).toEqual({});
  });

  it('ignores missing paths, opens external paths and navigates internally before closing', () => {
    const closed = jasmine.createSpy('closed');
    component.showSideBar.subscribe(closed);
    const windowOpen = spyOn(window, 'open');

    component.navigate({});
    expect(router.navigate).not.toHaveBeenCalled();

    component.navigate({ path: 'https://example.com' });
    expect(windowOpen).toHaveBeenCalledWith('https://example.com', '_blank', 'noopener,noreferrer');

    component.navigate({ path: '/admin/users?legacy=1', queryParams: { tab: 1 } });
    expect(router.navigate).toHaveBeenCalledWith(['/admin/users'], {
      queryParams: { tab: 1 },
      state: { switchTab: true },
    });
    expect(closed).toHaveBeenCalledWith(null);
  });

  it('emits close and user-menu output events', () => {
    const closed = jasmine.createSpy('closed');
    const opened = jasmine.createSpy('opened');
    const userClosed = jasmine.createSpy('userClosed');
    component.showSideBar.subscribe(closed);
    component.popupUserMenuOpened.subscribe(opened);
    component.popupUserMenuClosed.subscribe(userClosed);

    component.onClose();
    component.onUserMenuOpened();
    component.onUserMenuClosed();
    expect(closed).toHaveBeenCalledWith(null);
    expect(opened).toHaveBeenCalled();
    expect(userClosed).toHaveBeenCalled();
  });

  it('refuses to open a non-http scheme that merely contains the substring "http"', () => {
    const windowOpen = spyOn(window, 'open');

    component.navigate({ path: 'javascript:fetch("//evil.example.com")//http' });

    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('falls back to the last active group and emits an empty title when nothing matches', () => {
    const titleChanged = jasmine.createSpy('titleChanged');
    component.titleMenuGroupChanged.subscribe(titleChanged);
    activeId = 'reports';
    routerEvents.next(new NavigationEnd(1, '/outside-one', '/outside-one'));
    expect(component.titleMenuGroup()).toBe('Reports');

    activeId = 'missing';
    routerEvents.next(new NavigationEnd(2, '/outside-two', '/outside-two'));
    expect(component.titleMenuGroup()).toBe('');
    expect(titleChanged).toHaveBeenCalledWith('');
  });

  it('reads the current path from DOCUMENT and router events instead of the raw window global', () => {
    // why: field initializer cũ gọi `window.location.pathname` nên component không render được ở SSR.
    // Giờ path khởi tạo lấy qua DOCUMENT.defaultView và cập nhật từ chính sự kiện NavigationEnd.
    const document = TestBed.inject(DOCUMENT);
    const fresh = TestBed.createComponent(SdSidebarMobileOverlay);
    fresh.componentRef.setInput('menus', menus);
    fresh.componentRef.setInput('userInfo', { fullName: 'Mobile User' });
    fresh.componentRef.setInput('sidebar', { version: 1 });
    fresh.autoDetectChanges();

    expect(fresh.componentInstance.currentPath()).toBe(document.defaultView!.location.pathname);

    routerEvents.next(new NavigationEnd(3, '/reports?year=2026', '/reports?year=2026'));

    expect(fresh.componentInstance.currentPath()).toBe('/reports');
  });

  // -------------------------------------------------------------------------
  // Context switcher (R-008, D-010): bottom sheet mở từ header drawer. Không có `context` thì
  // DOM giữ nguyên (INV-001). Các spec trên override template rỗng nên block này dùng template thật.
  // -------------------------------------------------------------------------
  describe('context switcher (R-008, AC-011, AC-018)', () => {
    const contexts: SdLayoutContext[] = [
      { id: 'hq', title: 'Head Office', subtitle: 'Owner' },
      { id: 'north', title: 'North Branch', subtitle: 'Manager' },
    ];
    let context: ContextServiceStub;
    let ctxFixture: ComponentFixture<SdSidebarMobileOverlay>;

    const root = () => ctxFixture.nativeElement as HTMLElement;
    const q = (selector: string) => root().querySelector<HTMLElement>(selector);
    const switchers = () => ctxFixture.debugElement.queryAll(By.directive(SdLayoutContextSwitcher));

    async function create(options: { sidebar?: object; menus?: SdLayoutMenu[] } = {}) {
      TestBed.resetTestingModule();
      context = createContextStub();
      await TestBed.configureTestingModule({
        imports: [SdSidebarMobileOverlay, NoopAnimationsModule],
        providers: [
          {
            provide: Router,
            useValue: {
              events: new Subject<unknown>(),
              url: '/reports',
              navigate: jasmine.createSpy('navigate').and.resolveTo(true),
            },
          },
          { provide: SdLayoutStorageService, useValue: storage },
          { provide: SdLayoutContextService, useValue: context },
        ],
      }).compileComponents();

      ctxFixture = TestBed.createComponent(SdSidebarMobileOverlay);
      ctxFixture.componentRef.setInput('menus', options.menus ?? menus);
      ctxFixture.componentRef.setInput('userInfo', { fullName: 'Mobile User' });
      ctxFixture.componentRef.setInput('sidebar', options.sidebar ?? { version: 1 });
      ctxFixture.componentRef.setInput('isShowSidebar', true);
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();
      ctxFixture.detectChanges();
    }

    it('renders the sheet switcher in the drawer header under the title row, anchored to the header', async () => {
      await create({ sidebar: { version: 1, context: { items: contexts } } });
      const header = q('.m-header')!;
      const host = switchers()[0].nativeElement as HTMLElement;
      const instance = switchers()[0].componentInstance as SdLayoutContextSwitcher;

      expect(switchers().length).toBe(1);
      expect(instance.appearance()).toBe('sheet');
      expect(instance.anchor()).toBe(header);
      expect(host.parentElement).toBe(header);
      expect(context.syncItems).toHaveBeenCalledWith(contexts);

      const titleGroup = q('.m-title-group')!.getBoundingClientRect();
      const trigger = q('[data-context-trigger]')!.getBoundingClientRect();
      expect(trigger.top).toBeGreaterThanOrEqual(titleGroup.bottom - 1);
      // Nút đóng vẫn cùng hàng với tiêu đề, không bị đẩy xuống dưới switcher.
      expect(q('.m-close-btn')!.getBoundingClientRect().top).toBeLessThan(titleGroup.bottom);
    });

    it('keeps Escape inside the context sheet from closing the drawer', async () => {
      await create({ sidebar: { version: 1, context: { items: contexts } } });
      const closed = jasmine.createSpy('closed');
      ctxFixture.componentInstance.showSideBar.subscribe(closed);

      q('[data-context-trigger]')!.click();
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();

      const overlay = TestBed.inject(OverlayContainer).getContainerElement();
      const sheet = overlay.querySelector<HTMLElement>('[data-context-sheet]');
      expect(sheet).withContext('sheet rendered').not.toBeNull();
      sheet!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();

      expect(closed).not.toHaveBeenCalled();
    });

    it('renders the drawer as before without context, even for menus with V4-only fields (AC-011, INV-001)', async () => {
      const v4Menus = [
        { id: 'work', title: 'Work', section: 'Main', badge: { text: '3' }, status: 'new', comingSoon: true, children: [leaf] },
      ] as unknown as SdLayoutMenu[];
      await create({ menus: v4Menus });

      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(q('[data-context-trigger]')).toBeNull();
      expect(q('.m-header')!.children.length).toBe(2);
      expect(q('.m-header--context')).toBeNull();
      expect(root().querySelector('[class*="badge"], [class*="status"], [class*="coming"]')).toBeNull();
      expect(root().textContent).not.toContain('Main');
      expect(context.syncItems).not.toHaveBeenCalled();
    });
  });
});
