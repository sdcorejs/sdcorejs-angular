import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdLayoutMenu, SdLayoutNavigationStateService, SdLayoutStorageService } from '../../services';
import { SidebarV3Component } from './main.component';

const dashboard: SdLayoutMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const reports: SdLayoutMenu = { id: 'reports', title: 'Báo cáo bán hàng', tooltipTitle: 'Doanh số', path: '/reports', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'work', title: 'Công việc', children: [dashboard, reports] }];

describe('SidebarV3Component', () => {
  let fixture: ComponentFixture<SidebarV3Component>;
  let utilityStyles: HTMLStyleElement;

  beforeEach(async () => {
    localStorage.clear();
    // The library test target omits consumer global styles; load the Core utility declarations under test.
    utilityStyles = document.createElement('style');
    utilityStyles.textContent =
      '.d-flex { display: flex !important; } .justify-content-between { justify-content: space-between !important; } .justify-content-center { justify-content: center !important; }';
    document.head.appendChild(utilityStyles);
    await TestBed.configureTestingModule({ imports: [SidebarV3Component], providers: [provideRouter([])] }).compileComponents();
  });

  afterEach(() => utilityStyles.remove());

  function create(sidebar: Record<string, unknown> = { version: 3 }): void {
    fixture = TestBed.createComponent(SidebarV3Component);
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

  // why: ba tiêu đề section trước đây là literal tiếng Việt trong template, không dịch được.
  it('renders the all-menu section heading from the i18n catalogue', () => {
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
    create();

    const headings = Array.from(fixture.nativeElement.querySelectorAll('h2')).map(h => (h as HTMLElement).textContent?.trim());
    expect(headings).toContain('Tất cả menu');
    expect(headings).not.toContain('');
  });
});
