import { OverlayContainer } from '@angular/cdk/overlay';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { SD_LAYOUT_CONFIGURATION, SdLayoutContext, SidebarConfigurationV3 } from '../../configurations';
import { SdLayoutContextService, SdLayoutMenu, SdLayoutNavigationStateService } from '../../services';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdSidebarMobileV3 } from './main.component';

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

const dashboard: SdLayoutMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const reports: SdLayoutMenu = { id: 'reports', title: 'Báo cáo bán hàng', path: '/reports', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'work', title: 'Công việc', children: [dashboard, reports] }];

describe('SdSidebarMobileV3', () => {
  let fixture: ComponentFixture<SdSidebarMobileV3>;
  let signout: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();
    document.body.style.overflow = '';
    signout = jasmine.createSpy('signout');
    await TestBed.configureTestingModule({
      imports: [SdSidebarMobileV3],
      providers: [
        provideRouter([]),
        {
          provide: SD_LAYOUT_CONFIGURATION,
          useValue: {
            sidebar: { version: 3 },
            userInfo: { fullName: 'Demo User' },
            signout,
            changePassword: jasmine.createSpy('changePassword'),
            updateProfile: jasmine.createSpy('updateProfile'),
            setting: jasmine.createSpy('setting'),
            notification: { count: 5, action: jasmine.createSpy('notification') },
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SdSidebarMobileV3);
    fixture.componentRef.setInput('menus', menus);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User', role: { text: 'Operator' } });
    fixture.componentRef.setInput('sidebar', { version: 3 });
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders the custom-element host as a block so the mobile topbar stays inside its preview container', () => {
    expect(getComputedStyle(fixture.nativeElement).display).toBe('block');
  });

  it('opens the unified drawer and locks body scroll', () => {
    fixture.componentInstance.openDrawer();

    expect(fixture.componentInstance.isDrawerOpen()).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('shows static mobile identity with sign-out in the same profile row', () => {
    fixture.componentInstance.openDrawer();
    fixture.detectChanges();

    const drawer = fixture.nativeElement.querySelector('.sd-sidebar-mobile-v3__drawer') as HTMLElement;
    const accountRow = drawer.querySelector('[data-mobile-account-row]') as HTMLElement;
    expect(accountRow.querySelector('[data-user-summary]')).not.toBeNull();
    expect(accountRow.querySelector('[data-user-role]')?.textContent).toContain('Operator');
    expect(accountRow.querySelector('[data-user-action="signout"]')).not.toBeNull();
    expect(drawer.querySelector('[data-user-action="update-profile"]')).not.toBeNull();
    expect(drawer.querySelector('[data-notification-badge]')?.textContent).toContain('5');
    expect(drawer.querySelector('[data-user-trigger]')).toBeNull();

    (accountRow.querySelector('[data-user-action="signout"]') as HTMLButtonElement).click();

    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('closes through backdrop, Escape and successful navigation', () => {
    for (const close of [
      () => fixture.componentInstance.closeFromBackdrop(),
      () => fixture.componentInstance.closeFromEscape(),
      () => fixture.componentInstance.closeFromNavigation(),
    ]) {
      fixture.componentInstance.openDrawer();
      close();
      expect(fixture.componentInstance.isDrawerOpen()).toBeFalse();
      expect(document.body.style.overflow).toBe('');
    }
  });

  it('restores focus to the drawer trigger', () => {
    const trigger = fixture.nativeElement.querySelector('[data-v3-mobile-trigger]') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    fixture.componentInstance.closeFromEscape();
    fixture.detectChanges();

    expect(document.activeElement).toBe(trigger);
  });

  it('uses global accent-insensitive search in the drawer', () => {
    fixture.componentInstance.searchText.set('BAO CAO');

    expect(fixture.componentInstance.searchResults().map(menu => menu.path)).toEqual(['/reports']);
  });

  it('renders shared Pinned and Recent sections', () => {
    const navigationState = TestBed.inject(SdLayoutNavigationStateService);
    navigationState.togglePinned(dashboard);
    navigationState.recordRecent(reports, { enabled: true, maxItems: 5 });
    fixture.componentInstance.openDrawer();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-v3-mobile-pinned]').textContent).toContain('Tổng quan');
    expect(fixture.nativeElement.querySelector('[data-v3-mobile-recent]').textContent).toContain('Báo cáo bán hàng');
  });

  it('opens an absolute http(s) menu with noopener,noreferrer and never opens a javascript: scheme', () => {
    const windowOpen = spyOn(window, 'open');
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture.componentInstance.navigateMenu({ id: 'docs', title: 'Tài liệu', path: 'https://example.com/docs', permission: true });
    expect(windowOpen).toHaveBeenCalledWith('https://example.com/docs', '_blank', 'noopener,noreferrer');
    expect(navigate).not.toHaveBeenCalled();

    windowOpen.calls.reset();
    fixture.componentInstance.navigateMenu({
      id: 'evil',
      title: 'Evil',
      path: 'javascript:fetch("//evil.example.com")//http',
      permission: true,
    });
    expect(windowOpen).not.toHaveBeenCalled();
  });

  it('releases body scroll when destroyed while open', () => {
    fixture.componentInstance.openDrawer();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
    expect(TestBed.inject(Router)).toBeDefined();
  });

  it('uses the shared search field inside the open drawer', () => {
    fixture.componentInstance.openDrawer();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'sd-layout-search-field input[data-autoid="forms-input-layout-v3-mobile-global-search"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe('Tìm trong tất cả menu');

    const stickySearch = fixture.nativeElement.querySelector('.sd-sidebar-mobile-v3__search') as HTMLElement;
    const style = getComputedStyle(stickySearch);
    expect(style.position).toBe('sticky');
    expect(style.top).toBe('-12px');
    expect(style.backgroundColor).toBe('rgb(255, 255, 255)');
    expect(style.paddingTop).toBe('12px');
    expect(style.marginTop).toBe('-12px');
  });

  it('always exposes compatible pin actions inside the mobile drawer', () => {
    fixture.componentInstance.openDrawer();
    fixture.detectChanges();

    const pin = fixture.nativeElement.querySelector('[data-pin-key]') as HTMLButtonElement;
    expect(pin).not.toBeNull();
    expect(getComputedStyle(pin).opacity).toBe('1');
    expect(pin.querySelector('mat-icon')?.textContent?.trim()).toBe('push_pin');
  });

  // -------------------------------------------------------------------------
  // Context switcher (R-008, D-027): trigger nằm trong header của drawer, ngay dưới tên app; sheet chọn context mở
  // trong overlay CDK chồng lên drawer và tự giữ Esc. Không có `context` thì drawer render như cũ (INV-001) và bỏ qua
  // các field menu chỉ V4 dùng (R-003, AC-011).
  // -------------------------------------------------------------------------
  describe('context switcher (R-003, R-008, AC-011, AC-018, D-027)', () => {
    const contexts: SdLayoutContext[] = [
      { id: 'hq', title: 'Head Office', subtitle: 'Owner' },
      { id: 'north', title: 'North Branch', subtitle: 'Manager' },
    ];
    let context: ContextServiceStub;
    let contextServiceCreations: number;
    let ctxFixture: ComponentFixture<SdSidebarMobileV3>;

    const root = (): HTMLElement => ctxFixture.nativeElement as HTMLElement;
    const q = <T extends HTMLElement = HTMLElement>(selector: string): T | null => root().querySelector<T>(selector);
    const switchers = () => ctxFixture.debugElement.queryAll(By.directive(SdLayoutContextSwitcher));
    const overlayRoot = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
    const drawer = (): HTMLElement | null => q('.sd-sidebar-mobile-v3__drawer');
    const drawerHeader = (): HTMLElement => (drawer() as HTMLElement).querySelector(':scope > header') as HTMLElement;

    async function create(options: { sidebar?: SidebarConfigurationV3; menus?: SdLayoutMenu[] } = {}): Promise<void> {
      TestBed.resetTestingModule();
      context = createContextStub();
      contextServiceCreations = 0;
      await TestBed.configureTestingModule({
        imports: [SdSidebarMobileV3],
        providers: [
          provideRouter([]),
          {
            provide: SdLayoutContextService,
            // why: đếm số lần tạo để chứng minh app không cấu hình `context` không bao giờ tạo service (EXEC-D1).
            useFactory: () => {
              contextServiceCreations++;
              return context;
            },
          },
        ],
      }).compileComponents();
      ctxFixture = TestBed.createComponent(SdSidebarMobileV3);
      ctxFixture.componentRef.setInput('menus', options.menus ?? menus);
      ctxFixture.componentRef.setInput('userInfo', { fullName: 'Demo User', role: { text: 'Operator' } });
      ctxFixture.componentRef.setInput('sidebar', options.sidebar ?? { version: 3 });
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();
      ctxFixture.detectChanges();
    }

    async function openMenuDrawer(): Promise<HTMLButtonElement> {
      const trigger = q('[data-v3-mobile-trigger]') as HTMLButtonElement;
      trigger.focus();
      trigger.click();
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();
      ctxFixture.detectChanges();
      return trigger;
    }

    it('renders the sheet switcher in the drawer header, directly under the drawer title', async () => {
      await create({ sidebar: { version: 3, context: { items: contexts } } });
      await openMenuDrawer();

      const header = drawerHeader();
      const host = switchers()[0].nativeElement as HTMLElement;
      const instance = switchers()[0].componentInstance as SdLayoutContextSwitcher;
      const title = host.previousElementSibling as HTMLElement;

      expect(switchers().length).toBe(1);
      expect(instance.appearance()).toBe('sheet');
      expect(header.contains(host)).toBeTrue();
      expect(title.textContent?.trim()).toBe('Back Office');
      expect(title.classList).toContain('T18M');
      expect(header.lastElementChild?.getAttribute('aria-label')).toBe('Đóng menu');
      expect(context.syncItems).toHaveBeenCalledWith(contexts);
      expect((host.querySelector('[data-context-trigger]') as HTMLElement).getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    });

    // why: switcher chỉ mount khi drawer mở — đối chiếu phải chạy từ lúc khởi tạo, nếu không lần chạm đầu vào menu
    // ở lần truy cập đầu sẽ kích reload đối chiếu và listener nhiều tab chưa chạy (EXEC-D1, D-021).
    it('reconciles the configured context on init, before the drawer and its switcher first render', async () => {
      await create({ sidebar: { version: 3, context: { items: contexts } } });

      expect(ctxFixture.componentInstance.isDrawerOpen()).toBeFalse();
      expect(drawer()).toBeNull();
      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(context.syncItems).toHaveBeenCalledOnceWith(contexts);
      expect(contextServiceCreations).toBe(1);
    });

    it('forwards changed context items to the context service while the drawer stays closed', async () => {
      await create({ sidebar: { version: 3, context: { items: contexts } } });
      const next: SdLayoutContext[] = [...contexts, { id: 'south', title: 'South Branch' }];

      ctxFixture.componentRef.setInput('sidebar', { version: 3, context: { items: next } });
      ctxFixture.detectChanges();

      expect(context.syncItems.calls.allArgs()).toEqual([[contexts], [next]]);
      expect(contextServiceCreations).toBe(1);
    });

    it('stacks the context sheet above the drawer and keeps Escape from closing the drawer (D-027)', async () => {
      await create({ sidebar: { version: 3, context: { items: contexts } } });
      await openMenuDrawer();
      const menuDrawer = drawer() as HTMLElement;
      const trigger = q('[data-context-trigger]') as HTMLElement;

      trigger.focus();
      trigger.click();
      ctxFixture.detectChanges();
      await ctxFixture.whenStable();

      const contextSheet = overlayRoot().querySelector<HTMLElement>('[data-context-sheet]');
      expect(contextSheet).withContext('context sheet rendered').not.toBeNull();
      expect(menuDrawer.contains(contextSheet)).toBeFalse();
      const rect = (contextSheet as HTMLElement).getBoundingClientRect();
      const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      expect((contextSheet as HTMLElement).contains(hit))
        .withContext('context sheet is hit-tested above the drawer')
        .toBeTrue();

      const drawerKeydown = spyOn(ctxFixture.componentInstance, 'onDrawerKeydown').and.callThrough();
      (contextSheet as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      ctxFixture.detectChanges();

      expect(drawerKeydown).not.toHaveBeenCalled();
      expect(overlayRoot().querySelector('[data-context-sheet]')).toBeNull();
      expect(ctxFixture.componentInstance.isDrawerOpen()).toBeTrue();
      expect(drawer()).toBe(menuDrawer);
      expect(document.activeElement).toBe(trigger);
      expect(document.body.style.overflow).toBe('hidden');

      // Đối chứng: Esc bên trong drawer (sheet đã đóng) vẫn đi qua handler của drawer và đóng drawer như cũ.
      trigger.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      ctxFixture.detectChanges();
      expect(drawerKeydown).toHaveBeenCalledTimes(1);
      expect(ctxFixture.componentInstance.isDrawerOpen()).toBeFalse();
    });

    it('takes no room in the drawer header for a context without items', async () => {
      await create({ sidebar: { version: 3, context: { items: [] } } });
      await openMenuDrawer();
      const host = switchers()[0].nativeElement as HTMLElement;

      expect(host.childElementCount).toBe(0);
      expect(host.getBoundingClientRect().height).toBe(0);
    });

    it('renders the drawer as before without context and ignores the V4-only menu fields (R-003, AC-011, INV-001)', async () => {
      const v4Fields = {
        section: 'Workspace',
        badge: { value: 'NEW-7', tone: 'warning' as const },
        status: { label: 'Connected', tone: 'success' as const, live: true },
      };
      const soon: SdLayoutMenu = { id: 'soon', title: 'Sắp ra mắt', path: '/soon', permission: true, comingSoon: true, ...v4Fields };
      const v4Group: SdLayoutMenu = { id: 'v4-group', title: 'Nhóm mới', comingSoon: true, ...v4Fields, children: [soon] };
      await create({ menus: [v4Group, ...menus] });
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      await openMenuDrawer();

      const menuDrawer = drawer() as HTMLElement;
      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(Array.from(drawerHeader().children).map(child => child.localName)).toEqual(['span', 'button']);
      expect(menuDrawer.querySelectorAll('h2').length).toBe(1);
      expect(menuDrawer.querySelector('sd-layout-menu-tree :is([class*="badge"], [class*="status"], [class*="section"])')).toBeNull();
      for (const value of ['Workspace', 'NEW-7', 'Connected']) expect(root().textContent).withContext(value).not.toContain(value);
      expect(context.syncItems).not.toHaveBeenCalled();
      expect(contextServiceCreations).toBe(0);

      // comingSoon không có nghĩa gì ở mobile V3 (D-005): mục vẫn điều hướng như cũ.
      const soonButton = menuDrawer.querySelector('[data-menu-key="id:soon"]') as HTMLButtonElement;
      expect(soonButton.hasAttribute('aria-disabled')).toBeFalse();
      soonButton.click();
      expect(navigate).toHaveBeenCalledWith(['/soon'], { queryParams: {}, state: { switchTab: true } });
    });
  });
});
