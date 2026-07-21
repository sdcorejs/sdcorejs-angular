import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SdLayoutMenu, SdLayoutNavigationStateService } from '../../services';
import { SidebarMobileV3Component } from './main.component';

const dashboard: SdLayoutMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const reports: SdLayoutMenu = { id: 'reports', title: 'Báo cáo bán hàng', path: '/reports', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'work', title: 'Công việc', children: [dashboard, reports] }];

describe('SidebarMobileV3Component', () => {
  let fixture: ComponentFixture<SidebarMobileV3Component>;

  beforeEach(async () => {
    localStorage.clear();
    document.body.style.overflow = '';
    await TestBed.configureTestingModule({ imports: [SidebarMobileV3Component], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(SidebarMobileV3Component);
    fixture.componentRef.setInput('menus', menus);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User' });
    fixture.componentRef.setInput('sidebar', { version: 3 });
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('opens the unified drawer and locks body scroll', () => {
    fixture.componentInstance.openDrawer();

    expect(fixture.componentInstance.isDrawerOpen()).toBeTrue();
    expect(document.body.style.overflow).toBe('hidden');
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

  it('releases body scroll when destroyed while open', () => {
    fixture.componentInstance.openDrawer();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.destroy();

    expect(document.body.style.overflow).toBe('');
    expect(TestBed.inject(Router)).toBeDefined();
  });
});
