import { OverlayContainer } from '@angular/cdk/overlay';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdLayoutContext } from '../../configurations';
import { SdLayoutContextService, SdLayoutMenu, SdLayoutNavigationStateService, SdLayoutStorageService } from '../../services';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdSidebarV3 } from './main.component';

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
const reports: SdLayoutMenu = { id: 'reports', title: 'Báo cáo bán hàng', tooltipTitle: 'Doanh số', path: '/reports', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'work', title: 'Công việc', children: [dashboard, reports] }];

describe('SdSidebarV3', () => {
  let fixture: ComponentFixture<SdSidebarV3>;
  let utilityStyles: HTMLStyleElement;

  beforeEach(async () => {
    localStorage.clear();
    // The library test target omits consumer global styles; load the Core utility declarations under test.
    utilityStyles = document.createElement('style');
    utilityStyles.textContent = `
      .d-flex { display: flex !important; } .flex-column { flex-direction: column !important; }
      .flex-1 { flex: 1 !important; } .align-items-center { align-items: center !important; }
      .justify-content-between { justify-content: space-between !important; }
      .justify-content-center { justify-content: center !important; }
      .overflow-auto { overflow: auto !important; } .gap-8 { gap: 8px !important; }
      .text-ellipsis { white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
    `;
    document.head.appendChild(utilityStyles);
    await TestBed.configureTestingModule({ imports: [SdSidebarV3], providers: [provideRouter([])] }).compileComponents();
  });

  afterEach(() => utilityStyles.remove());

  function create(sidebar: Record<string, unknown> = { version: 3 }): void {
    fixture = TestBed.createComponent(SdSidebarV3);
    fixture.componentRef.setInput('menus', menus);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User' });
    fixture.componentRef.setInput('sidebar', sidebar);
    fixture.detectChanges();
  }

  it('starts expanded by default', () => {
    create();

    expect(fixture.componentInstance.isCollapsed()).toBeFalse();
  });

  const groupButton = (key: string): HTMLButtonElement | null =>
    fixture.nativeElement.querySelector(`[data-v3-all] [data-menu-group="${key}"]`);
  const allRoute = (key: string): HTMLButtonElement | null => fixture.nativeElement.querySelector(`[data-v3-all] [data-menu-key="${key}"]`);

  it('toggles a group with a focusable disclosure without navigating or pinning', () => {
    create();
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    const pin = spyOn(TestBed.inject(SdLayoutNavigationStateService), 'togglePinned');
    const group = groupButton('id:work');
    expect(group).not.toBeNull();
    if (!group) return;
    expect(group.tagName).toBe('BUTTON');
    expect(group.type).toBe('button');
    expect(group.getAttribute('aria-expanded')).toBe('true');
    group.focus();
    group.click();
    fixture.detectChanges();
    expect(document.activeElement).toBe(group);
    expect(group.getAttribute('aria-expanded')).toBe('false');
    expect(allRoute('id:reports')).toBeNull();
    expect(navigate).not.toHaveBeenCalled();
    expect(pin).not.toHaveBeenCalled();
    group.click();
    fixture.detectChanges();
    expect(group.getAttribute('aria-expanded')).toBe('true');
    expect(allRoute('id:reports')).not.toBeNull();
  });

  it('preserves independent nested disclosures when a parent is closed and reopened', () => {
    create();
    fixture.componentRef.setInput('menus', [
      { id: 'work', title: 'Work', children: [{ id: 'nested', title: 'Nested', children: [reports] }, dashboard] },
      { id: 'other', title: 'Other', children: [{ ...dashboard, id: 'other-leaf' }] },
    ]);
    fixture.detectChanges();
    const nested = groupButton('id:nested');
    expect(nested).not.toBeNull();
    if (!nested) return;
    nested.click();
    fixture.detectChanges();
    expect(allRoute('id:reports')).toBeNull();
    expect(allRoute('id:dashboard')).not.toBeNull();
    groupButton('id:work')!.click();
    fixture.detectChanges();
    expect(groupButton('id:nested')).toBeNull();
    expect(allRoute('id:other-leaf')).not.toBeNull();
    groupButton('id:work')!.click();
    fixture.detectChanges();
    expect(groupButton('id:nested')!.getAttribute('aria-expanded')).toBe('false');
    expect(allRoute('id:reports')).toBeNull();
    expect(allRoute('id:dashboard')).not.toBeNull();
  });

  it('searches closed groups and preserves disclosures through query and rail toggles', () => {
    create();
    const group = groupButton('id:work');
    expect(group).not.toBeNull();
    if (!group) return;
    group.click();
    fixture.detectChanges();
    fixture.componentInstance.searchText.set('BAO CAO');
    fixture.detectChanges();
    expect(allRoute('id:reports')).not.toBeNull();
    expect(groupButton('id:work')).toBeNull();
    fixture.componentInstance.toggleCollapsed();
    fixture.detectChanges();
    fixture.componentInstance.toggleCollapsed();
    fixture.detectChanges();
    expect(allRoute('id:reports')).not.toBeNull();
    fixture.componentInstance.searchText.set('');
    fixture.detectChanges();
    expect(groupButton('id:work')!.getAttribute('aria-expanded')).toBe('false');
    expect(allRoute('id:reports')).toBeNull();
  });

  it('reveals the exact active branch on navigation without reopening unrelated branches', async () => {
    create();
    fixture.componentRef.setInput('menus', [
      { id: 'work', title: 'Work', children: [{ id: 'nested', title: 'Nested', children: [reports] }] },
      { id: 'other', title: 'Other', children: [dashboard] },
    ]);
    fixture.detectChanges();
    expect(groupButton('id:nested')).not.toBeNull();
    if (!groupButton('id:nested')) return;
    for (const key of ['id:nested', 'id:work', 'id:other']) {
      groupButton(key)!.click();
      fixture.detectChanges();
    }
    const router = TestBed.inject(Router);
    router.resetConfig([{ path: 'reports/:id', children: [] }]);
    await router.navigateByUrl('/reports/42?source=test#details');
    fixture.detectChanges();
    expect(groupButton('id:work')!.getAttribute('aria-expanded')).toBe('true');
    expect(groupButton('id:nested')!.getAttribute('aria-expanded')).toBe('true');
    expect(allRoute('id:reports')!.getAttribute('aria-current')).toBe('page');
    expect(groupButton('id:other')!.getAttribute('aria-expanded')).toBe('false');
    // An explicit close remains respected while the current route stays unchanged.
    groupButton('id:work')!.click();
    fixture.detectChanges();
    expect(allRoute('id:reports')).toBeNull();
  });

  it('opens a closed root group when its compact rail icon is activated', () => {
    create();
    const group = groupButton('id:work');
    expect(group).not.toBeNull();
    if (!group) return;
    group.click();
    fixture.componentInstance.toggleCollapsed();
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.sd-sidebar-v3__collapsed-action').click();
    fixture.detectChanges();
    expect(groupButton('id:work')!.getAttribute('aria-expanded')).toBe('true');
    expect(allRoute('id:reports')).not.toBeNull();
  });

  it('distinguishes same-title groups by their ancestor fallback keys', () => {
    create();
    fixture.componentRef.setInput('menus', [
      { title: 'First', children: [{ title: 'Shared', children: [dashboard] }] },
      { title: 'Second', children: [{ title: 'Shared', children: [reports] }] },
    ]);
    fixture.detectChanges();
    const first = groupButton('group:first/shared');
    expect(first).not.toBeNull();
    if (!first) return;
    first.click();
    fixture.detectChanges();
    expect(allRoute('id:dashboard')).toBeNull();
    expect(allRoute('id:reports')).not.toBeNull();
    expect(groupButton('group:second/shared')!.getAttribute('aria-expanded')).toBe('true');
  });

  it('uses defaultCollapsed when no preference exists', () => {
    create({ version: 3, defaultCollapsed: true });

    expect(fixture.componentInstance.isCollapsed()).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-v3-sidebar]').getAttribute('data-collapsed')).toBe('true');
  });

  it('lets a persisted user preference override defaultCollapsed', () => {
    TestBed.inject(SdLayoutStorageService).patchVersionState(3, { collapsed: false });
    create({ version: 3, defaultCollapsed: true });

    expect(fixture.componentInstance.isCollapsed()).toBeFalse();
  });

  it('persists collapse changes without clearing active query state', () => {
    create();
    fixture.componentInstance.searchText.set('report');
    fixture.componentInstance.toggleCollapsed();

    expect(fixture.componentInstance.isCollapsed()).toBeTrue();
    expect(fixture.componentInstance.searchText()).toBe('report');
    expect(TestBed.inject(SdLayoutStorageService).readVersionState(3).collapsed).toBeTrue();
  });

  it('persists the expanded state when a collapsed group is activated', () => {
    create({ version: 3, defaultCollapsed: true });

    fixture.componentInstance.activateCollapsedMenu(menus[0]);

    expect(fixture.componentInstance.isCollapsed()).toBeFalse();
    expect(TestBed.inject(SdLayoutStorageService).readVersionState(3).collapsed).toBeFalse();
  });

  it('searches all permitted leaves without case or accent sensitivity', () => {
    create();
    fixture.componentInstance.searchText.set('BAO CAO');

    expect(fixture.componentInstance.searchResults().map(menu => menu.path)).toEqual(['/reports']);
  });

  it('renders shared Pinned and Recent entries and records navigation', () => {
    create();
    const navigationState = TestBed.inject(SdLayoutNavigationStateService);
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    navigationState.togglePinned(dashboard);
    fixture.componentInstance.navigateMenu(reports);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-v3-pinned]').textContent).toContain('Tổng quan');
    expect(navigationState.recentKeys()[0]).toBe('id:reports');
    expect(navigate).toHaveBeenCalledWith(['/reports'], jasmine.any(Object));
  });

  it('opens an absolute http(s) menu with noopener,noreferrer and never opens a javascript: scheme', () => {
    create();
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

  it('omits the brand and centers compact controls when collapsed', () => {
    create({ version: 3, defaultCollapsed: true });

    const header = fixture.nativeElement.querySelector('[data-v3-header]') as HTMLElement;
    const accountTrigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    expect(header.classList).toContain('sd-sidebar-v3__header--collapsed');
    expect(header.querySelector('[data-v3-brand]')).toBeNull();
    expect(header.querySelector('button')?.getAttribute('aria-label')).toBe('Mở rộng sidebar');
    expect(getComputedStyle(header).justifyContent).toBe('center');
    expect(accountTrigger.classList).toContain('sd-layout-user-menu__trigger--compact');
    expect(accountTrigger.querySelector('sd-icon')).toBeNull();
  });

  it('retains the brand and full account disclosure when expanded', () => {
    create();

    const header = fixture.nativeElement.querySelector('[data-v3-header]') as HTMLElement;
    const accountTrigger = fixture.nativeElement.querySelector('[data-user-trigger]') as HTMLButtonElement;
    expect(header.querySelector('[data-v3-brand]')).not.toBeNull();
    expect(header.textContent).toContain('Back Office');
    expect(getComputedStyle(header).justifyContent).toBe('space-between');
    expect(accountTrigger.textContent).toContain('Demo User');
    expect(accountTrigger.querySelector('mat-icon')?.textContent?.trim()).toBe('expand_more');
  });

  it('uses the shared search field in the expanded drawer', () => {
    create();

    const input = fixture.nativeElement.querySelector(
      'sd-layout-search-field input[data-autoid="forms-input-layout-v3-global-search"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe('Tìm trong tất cả menu');
  });

  it('renders menu icons only at the first level, with text and branch guides below', () => {
    create();
    fixture.componentRef.setInput('menus', [
      { ...dashboard, icon: 'dashboard' },
      {
        id: 'admin',
        title: 'Quản trị',
        icon: 'admin_panel_settings',
        children: [
          {
            id: 'tenant-group',
            title: 'Tenant & ứng dụng',
            icon: 'business',
            children: [{ ...reports, icon: 'language', iconUrl: '/nested-icon.svg' }],
          },
        ],
      },
    ]);
    fixture.componentInstance.activePath.set('/reports');
    fixture.detectChanges();

    const tree = fixture.nativeElement.querySelector('[data-v3-all] sd-layout-menu-tree') as HTMLElement;
    expect(tree.querySelectorAll('[data-menu-icon]').length).toBe(2);
    expect(tree.querySelector('img[src="/nested-icon.svg"]')).toBeNull();
    const groups = tree.querySelectorAll<HTMLElement>('.sd-layout-menu-tree__group');
    expect(groups[1].querySelector('[data-menu-icon]')).toBeNull();
    expect(groups[1].querySelector('.sd-layout-menu-tree__disclosure')).not.toBeNull();
    const leaf = tree.querySelector<HTMLButtonElement>('[data-menu-key="id:reports"]')!;
    expect(leaf.querySelector('sd-icon, img')).toBeNull();
    expect(leaf.getAttribute('aria-current')).toBe('page');
    expect(leaf.parentElement!.querySelectorAll('[data-menu-branch]').length).toBe(2);
    expect(getComputedStyle(leaf).minHeight).toBe('34px');
    expect(getComputedStyle(leaf).fontSize).toBe('13px');
    const rootLabel = tree.querySelector('[data-menu-key="id:dashboard"] .sd-layout-menu-tree__label')!;
    const nestedLabel = leaf.querySelector('.sd-layout-menu-tree__label')!;
    expect(nestedLabel.getBoundingClientRect().left).toBeGreaterThan(rootLabel.getBoundingClientRect().left);
  });

  it('keeps flattened search, pinned and recent results text-only without losing navigation', () => {
    create();
    const state = TestBed.inject(SdLayoutNavigationStateService);
    state.togglePinned(dashboard);
    state.recordRecent(reports, fixture.componentInstance.recentConfiguration());
    fixture.componentInstance.searchText.set('BAO CAO');
    fixture.detectChanges();

    for (const section of ['[data-v3-all]', '[data-v3-pinned]', '[data-v3-recent]']) {
      const tree = fixture.nativeElement.querySelector(`${section} sd-layout-menu-tree`) as HTMLElement;
      expect(tree).withContext(section).not.toBeNull();
      expect(tree.querySelectorAll('[data-menu-route] sd-icon, [data-menu-route] img').length).toBe(0);
    }
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.nativeElement.querySelector('[data-v3-all] [data-menu-route]').click();
    expect(navigate).toHaveBeenCalledWith(['/reports'], jasmine.any(Object));
  });

  it('uses the compact V1 search surface while preserving the SdInput control', () => {
    create();
    const search = fixture.nativeElement.querySelector('[data-layout-search]') as HTMLElement;
    expect(getComputedStyle(search).borderRadius).toBe('7px');
    expect(getComputedStyle(search).borderTopWidth).toBe('1px');
    expect(search.querySelector('sd-input input')).not.toBeNull();
  });

  it('wraps long labels and scrolls deep navigation independently of the account footer', () => {
    create();
    const host = fixture.nativeElement as HTMLElement;
    host.style.cssText = 'display:block; position:relative; width:1024px; height:420px; transform:translateZ(0)';
    fixture.componentRef.setInput('menus', [
      {
        id: 'root',
        title: 'Quản trị',
        icon: 'settings',
        children: [
          {
            id: 'group',
            title: 'Tài khoản',
            children: Array.from({ length: 24 }, (_, index) => ({
              id: `long-${index}`,
              title: 'Quản lý tài khoản và phân quyền cho tất cả đơn vị trong hệ thống',
              path: `/long/${index}`,
              permission: true,
            })),
          },
        ],
      },
    ]);
    fixture.detectChanges();

    const drawer = host.querySelector<HTMLElement>('[data-v3-sidebar]')!;
    const navigation = host.querySelector<HTMLElement>('.sd-sidebar-v3__navigation')!;
    const footer = host.querySelector<HTMLElement>('[data-v3-footer]')!;
    const label = host.querySelector<HTMLElement>('[data-menu-route] .sd-layout-menu-tree__label')!;
    const initialFooter = footer.getBoundingClientRect();
    expect(drawer.getBoundingClientRect().width).toBe(304);
    expect(navigation.scrollHeight).toBeGreaterThan(navigation.clientHeight);
    expect(getComputedStyle(label).whiteSpace).toBe('normal');
    expect(label.getBoundingClientRect().height).toBeGreaterThan(26);
    expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
    navigation.scrollTop = navigation.scrollHeight;
    expect(navigation.scrollTop).toBeGreaterThan(0);
    expect(footer.getBoundingClientRect().top).toBe(initialFooter.top);
    expect(initialFooter.bottom).toBeLessThanOrEqual(drawer.getBoundingClientRect().bottom + 1);
    const account = footer.querySelector<HTMLButtonElement>('[data-user-trigger]')!;
    account.click();
    fixture.detectChanges();
    expect(account.getAttribute('aria-expanded')).toBe('true');
  });

  // why: ba tiêu đề section trước đây là literal tiếng Việt trong template, không dịch được.
  it('renders the all-menu section heading from the i18n catalogue', () => {
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    create();

    const headings = Array.from(fixture.nativeElement.querySelectorAll('h2')).map(h => (h as HTMLElement).textContent?.trim());
    expect(headings).toContain('Tất cả menu');
    expect(headings).not.toContain('');
  });

  // -------------------------------------------------------------------------
  // Context switcher (R-008, D-010): mở rộng thì switcher nằm dưới tên app trong brand, thu gọn thì avatar context
  // ở đầu rail ngay dưới nút mở rộng. Không có `context` thì V3 render như cũ và bỏ qua các field menu chỉ V4 dùng
  // (R-003, AC-011, INV-001).
  // -------------------------------------------------------------------------
  describe('context switcher (R-003, R-008, AC-011, AC-018)', () => {
    const contexts: SdLayoutContext[] = [
      { id: 'hq', title: 'Head Office', subtitle: 'Owner' },
      { id: 'north', title: 'North Branch', subtitle: 'Manager' },
    ];
    let context: ContextServiceStub;
    let contextServiceCreations: number;

    const root = (): HTMLElement => fixture.nativeElement as HTMLElement;
    const q = <T extends HTMLElement = HTMLElement>(selector: string): T | null => root().querySelector<T>(selector);
    const switchers = () => fixture.debugElement.queryAll(By.directive(SdLayoutContextSwitcher));
    const overlayRoot = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();

    beforeEach(async () => {
      TestBed.resetTestingModule();
      context = createContextStub();
      contextServiceCreations = 0;
      await TestBed.configureTestingModule({
        imports: [SdSidebarV3],
        providers: [
          provideRouter([]),
          {
            provide: SdLayoutContextService,
            // why: đếm số lần tạo để chứng minh V3 không cấu hình `context` không bao giờ tạo service (INV-001, D-021).
            useFactory: () => {
              contextServiceCreations++;
              return context;
            },
          },
        ],
      }).compileComponents();
    });

    async function openSwitcher(): Promise<void> {
      (q('[data-context-trigger]') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('renders the header switcher under the title in the brand, anchored to the header, with a popover 24px narrower than the drawer', async () => {
      create({ version: 3, context: { items: contexts } });
      const header = q('[data-v3-header]') as HTMLElement;
      const host = switchers()[0].nativeElement as HTMLElement;
      const instance = switchers()[0].componentInstance as SdLayoutContextSwitcher;

      expect(switchers().length).toBe(1);
      expect(instance.appearance()).toBe('header');
      expect(instance.anchor()).toBe(header);
      expect(q('[data-v3-brand]')?.contains(host)).toBeTrue();
      expect(q('.sd-sidebar-v3__title')?.nextElementSibling).toBe(host);
      expect(q('.sd-sidebar-v3__title')?.textContent?.trim()).toBe('Back Office');
      expect(context.syncItems).toHaveBeenCalledWith(contexts);
      // INV-006: switcher không đổi bề rộng 304px của V3.
      expect((q('[data-v3-sidebar]') as HTMLElement).getBoundingClientRect().width).toBe(304);

      await openSwitcher();

      const popover = overlayRoot().querySelector<HTMLElement>('[data-context-popover]') as HTMLElement;
      expect(popover).not.toBeNull();
      expect(getComputedStyle(popover).width).toBe('280px');
      expect(popover.getBoundingClientRect().left).toBeCloseTo(header.getBoundingClientRect().left + 12, 0);
      expect(popover.getBoundingClientRect().top).toBeCloseTo(header.getBoundingClientRect().bottom, 0);
    });

    it('gives the whole header the hover background while the header switcher is open (README CS1)', async () => {
      // why: Karma không nạp theme — khai --sd-text để nền hover (color-mix) có giá trị thật mà so.
      document.documentElement.style.setProperty('--sd-text', 'rgb(26, 27, 31)');
      try {
        create({ version: 3, context: { items: contexts } });
        const header = q('[data-v3-header]') as HTMLElement;
        const trigger = q('[data-context-trigger]') as HTMLElement;
        expect(header.classList).not.toContain('sd-sidebar-v3__header--context-open');

        await openSwitcher();

        expect(header.classList).toContain('sd-sidebar-v3__header--context-open');
        expect(getComputedStyle(header).borderTopLeftRadius).toBe('12px');
        expect(getComputedStyle(header).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        // Chỉ một lớp nền: trigger đang mở không tô chồng lên nền header.
        expect(getComputedStyle(trigger).backgroundColor).toBe('rgba(0, 0, 0, 0)');

        (switchers()[0].componentInstance as SdLayoutContextSwitcher).close(false);
        fixture.detectChanges();
        expect(header.classList).not.toContain('sd-sidebar-v3__header--context-open');
      } finally {
        document.documentElement.style.removeProperty('--sd-text');
      }
    });

    it('renders the rail switcher under the header toggle at the top of the collapsed rail and opens its popover right of the drawer', async () => {
      create({ version: 3, defaultCollapsed: true, context: { items: contexts } });
      const aside = q('[data-v3-sidebar]') as HTMLElement;
      const header = q('[data-v3-header]') as HTMLElement;
      const host = switchers()[0].nativeElement as HTMLElement;
      const instance = switchers()[0].componentInstance as SdLayoutContextSwitcher;

      expect(switchers().length).toBe(1);
      expect(instance.appearance()).toBe('rail');
      expect(instance.anchor()).toBe(aside);
      expect(header.nextElementSibling).toBe(host);
      expect(host.nextElementSibling?.matches('nav.sd-sidebar-v3__navigation')).toBeTrue();
      const avatar = (q('[data-context-trigger]') as HTMLElement).getBoundingClientRect();
      const firstItem = (q('.sd-sidebar-v3__collapsed-action') as HTMLElement).getBoundingClientRect();
      expect(avatar.top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom);
      expect(avatar.bottom).toBeLessThan(firstItem.top);
      expect(avatar.left + avatar.width / 2).toBeCloseTo(firstItem.left + firstItem.width / 2, 0);

      await openSwitcher();

      const popover = overlayRoot().querySelector<HTMLElement>('[data-context-popover]') as HTMLElement;
      const asideRight = aside.getBoundingClientRect().right;
      expect(popover).not.toBeNull();
      expect(popover.getBoundingClientRect().left).toBeGreaterThanOrEqual(asideRight);
      expect(popover.getBoundingClientRect().left).toBeCloseTo(asideRight + 8, 0);
    });

    it('moves the switcher between the header and the rail when the drawer collapses and expands', () => {
      create({ version: 3, context: { items: contexts } });
      expect((switchers()[0].componentInstance as SdLayoutContextSwitcher).appearance()).toBe('header');

      fixture.componentInstance.toggleCollapsed();
      fixture.detectChanges();
      expect(switchers().length).toBe(1);
      expect((switchers()[0].componentInstance as SdLayoutContextSwitcher).appearance()).toBe('rail');
      expect(q('[data-v3-brand]')).toBeNull();

      fixture.componentInstance.toggleCollapsed();
      fixture.detectChanges();
      expect(switchers().length).toBe(1);
      expect((switchers()[0].componentInstance as SdLayoutContextSwitcher).appearance()).toBe('header');
    });

    it('leaves no gap on the collapsed rail for a switcher that renders nothing', () => {
      create({ version: 3, defaultCollapsed: true });
      const baseline = (q('.sd-sidebar-v3__collapsed-action') as HTMLElement).getBoundingClientRect().top;
      fixture.destroy();

      create({ version: 3, defaultCollapsed: true, context: { items: [] } });

      const empty = switchers()[0].nativeElement as HTMLElement;
      expect(empty.childElementCount).toBe(0);
      expect(empty.getBoundingClientRect().height).toBe(0);
      expect((q('.sd-sidebar-v3__collapsed-action') as HTMLElement).getBoundingClientRect().top).toBe(baseline);
    });

    it('renders as before without context and ignores the V4-only menu fields, expanded or collapsed (R-003, AC-011, INV-001)', () => {
      const v4Fields = {
        section: 'Workspace',
        badge: { value: 'NEW-7', tone: 'warning' as const },
        status: { label: 'Connected', tone: 'success' as const, live: true },
      };
      const soon: SdLayoutMenu = { id: 'soon', title: 'Sắp ra mắt', path: '/soon', permission: true, comingSoon: true, ...v4Fields };
      const v4Group: SdLayoutMenu = { id: 'v4-group', title: 'Nhóm mới', icon: 'science', comingSoon: true, ...v4Fields, children: [soon] };
      create();
      fixture.componentRef.setInput('menus', [v4Group, ...menus]);
      fixture.detectChanges();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(Array.from((q('[data-v3-brand]') as HTMLElement).children).map(child => child.localName)).toEqual(['sd-icon', 'span']);
      expect(root().querySelectorAll('h2').length).toBe(1);
      expect(root().querySelector('sd-layout-menu-tree :is([class*="badge"], [class*="status"], [class*="section"])')).toBeNull();
      for (const value of ['Workspace', 'NEW-7', 'Connected']) expect(root().textContent).withContext(value).not.toContain(value);

      // comingSoon không có nghĩa gì ở V3 (D-005): nhóm vẫn mở/đóng, mục vẫn điều hướng và vẫn tìm thấy.
      const group = groupButton('id:v4-group') as HTMLButtonElement;
      expect(group.hasAttribute('aria-disabled')).toBeFalse();
      expect(group.getAttribute('aria-expanded')).toBe('true');
      const soonButton = allRoute('id:soon') as HTMLButtonElement;
      expect(soonButton.hasAttribute('aria-disabled')).toBeFalse();
      soonButton.click();
      expect(navigate).toHaveBeenCalledWith(['/soon'], { queryParams: {}, state: { switchTab: true } });
      fixture.componentInstance.searchText.set('sap ra mat');
      expect(fixture.componentInstance.searchResults().map(menu => menu.path)).toEqual(['/soon']);

      fixture.componentInstance.toggleCollapsed();
      fixture.detectChanges();
      expect(q('sd-layout-context-switcher')).toBeNull();
      expect((q('[data-v3-header]') as HTMLElement).nextElementSibling?.matches('nav.sd-sidebar-v3__navigation')).toBeTrue();
      expect(root().querySelector('.sd-sidebar-v3__navigation :is([class*="badge"], [class*="status"])')).toBeNull();
      expect(context.syncItems).not.toHaveBeenCalled();
      expect(contextServiceCreations).toBe(0);
    });
  });
});
