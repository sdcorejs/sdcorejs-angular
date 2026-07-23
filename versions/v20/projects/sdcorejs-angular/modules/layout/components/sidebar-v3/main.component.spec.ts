import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SdLayoutMenu, SdLayoutNavigationStateService, SdLayoutStorageService } from '../../services';
import { SidebarV3Component } from './main.component';

const dashboard: SdLayoutMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const reports: SdLayoutMenu = { id: 'reports', title: 'Báo cáo bán hàng', tooltipTitle: 'Doanh số', path: '/reports', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'work', title: 'Công việc', children: [dashboard, reports] }];

describe('SidebarV3Component', () => {
  let fixture: ComponentFixture<SidebarV3Component>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({ imports: [SidebarV3Component], providers: [provideRouter([])] }).compileComponents();
  });

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
});
