import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdLayoutMenu, SdLayoutNavigationStateService, SdLayoutStorageService } from '../../services';
import { SdSidebarV3 } from './main.component';

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
    expect(groups[1].querySelector('sd-icon')).toBeNull();
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
});
