import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SD_LAYOUT_CONFIGURATION } from '../../configurations';
import { SdLayoutMenu, SdLayoutNavigationStateService } from '../../services';
import { SidebarMobileV3Component } from './main.component';

const dashboard: SdLayoutMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const reports: SdLayoutMenu = { id: 'reports', title: 'Báo cáo bán hàng', path: '/reports', permission: true };
const menus: SdLayoutMenu[] = [{ id: 'work', title: 'Công việc', children: [dashboard, reports] }];

describe('SidebarMobileV3Component', () => {
  let fixture: ComponentFixture<SidebarMobileV3Component>;
  let signout: jasmine.Spy;

  beforeEach(async () => {
    localStorage.clear();
    document.body.style.overflow = '';
    signout = jasmine.createSpy('signout');
    await TestBed.configureTestingModule({
      imports: [SidebarMobileV3Component],
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
    fixture = TestBed.createComponent(SidebarMobileV3Component);
    fixture.componentRef.setInput('menus', menus);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User', role: { text: 'Operator' } });
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
});
