import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { SD_LAYOUT_CONFIGURATION } from '../../configurations';
import { SdLayoutMenu } from '../../services';
import { SidebarMobileV2Component } from './main.component';

const dashboard: SdLayoutMenu = { id: 'dashboard', title: 'Tổng quan', path: '/dashboard', permission: true };
const work: SdLayoutMenu = { id: 'work', title: 'Công việc', children: [dashboard] };
const admin: SdLayoutMenu = {
  id: 'admin',
  title: 'Quản trị',
  children: [{ id: 'users', title: 'Người dùng', path: '/users', permission: true }],
};
const reports: SdLayoutMenu = { id: 'reports', title: 'Báo cáo', children: [{ title: 'Doanh số', path: '/reports', permission: true }] };
const help: SdLayoutMenu = { id: 'help', title: 'Trợ giúp', children: [{ title: 'FAQ', path: '/help', permission: true }] };

describe('SidebarMobileV2Component', () => {
  let fixture: ComponentFixture<SidebarMobileV2Component>;
  let router: Router;
  let signout: jasmine.Spy;

  beforeEach(async () => {
    signout = jasmine.createSpy('signout');
    await TestBed.configureTestingModule({
      imports: [SidebarMobileV2Component],
      providers: [
        provideRouter([]),
        {
          provide: SD_LAYOUT_CONFIGURATION,
          useValue: {
            sidebar: { version: 2 },
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
    fixture = TestBed.createComponent(SidebarMobileV2Component);
    fixture.componentRef.setInput('menus', [dashboard, work, admin, reports, help]);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User', role: { text: 'Operator' } });
    fixture.componentRef.setInput('sidebar', { version: 2, primaryMenuIds: ['admin', 'missing', 'admin'] });
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('normalizes three unique primary groups and keeps the remaining groups under More', () => {
    expect(fixture.componentInstance.primaryMenus().map(menu => menu.id)).toEqual(['admin', 'dashboard', 'work']);
    expect(fixture.componentInstance.overflowMenus().map(menu => menu.id)).toEqual(['reports', 'help']);
  });

  it('shows static mobile identity with a direct sign-out action', () => {
    fixture.componentInstance.openMore();
    fixture.detectChanges();

    const sheet = fixture.nativeElement.querySelector('[data-v2-sheet]') as HTMLElement;
    const accountRow = sheet.querySelector('[data-mobile-account-row]') as HTMLElement;
    expect(accountRow.querySelector('[data-user-summary]')).not.toBeNull();
    expect(accountRow.querySelector('[data-user-role]')?.textContent).toContain('Operator');
    expect(sheet.querySelector('[data-user-trigger]')).toBeNull();
    expect(sheet.querySelector('[data-user-action="update-profile"]')).not.toBeNull();
    expect(sheet.querySelector('[data-notification-badge]')?.textContent).toContain('5');
    expect(accountRow.classList).toContain('sd-layout-user-menu__mobile--inline');
    expect(getComputedStyle(accountRow).flexDirection).toBe('row');

    (sheet.querySelector('[data-user-action="signout"]') as HTMLButtonElement).click();

    expect(signout).toHaveBeenCalledTimes(1);
  });

  it('opens More as a sheet containing only overflow groups', () => {
    fixture.componentInstance.openMore();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSheetOpen()).toBeTrue();
    expect(fixture.nativeElement.querySelector('[data-v2-sheet]').textContent).toContain('Báo cáo');
    expect(fixture.nativeElement.querySelector('[data-v2-sheet]').textContent).toContain('Trợ giúp');
  });

  it('opens groups in context but navigates leaf primaries directly', () => {
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    fixture.componentInstance.activateMenu(work);
    expect(fixture.componentInstance.sheetGroupKey()).toBe('id:work');

    fixture.componentInstance.activateMenu(dashboard);
    expect(navigate).toHaveBeenCalledWith(['/dashboard'], jasmine.any(Object));
  });

  it('closes on Escape, restores focus and releases body scroll', () => {
    const trigger = fixture.nativeElement.querySelector('[data-mobile-menu-key="id:work"]') as HTMLButtonElement;
    trigger.focus();
    trigger.click();
    fixture.detectChanges();
    expect(document.body.style.overflow).toBe('hidden');

    fixture.nativeElement.querySelector('[data-v2-sheet]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.isSheetOpen()).toBeFalse();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(trigger);
  });

  it('uses the shared search field inside the open sheet', () => {
    fixture.componentInstance.openMore();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'sd-layout-search-field input[data-autoid="forms-input-layout-v2-mobile-search"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.placeholder).toBe('Tìm trong menu');
  });

  it('always exposes a compatible pin action inside the mobile sheet', () => {
    fixture.componentInstance.openMore();
    fixture.detectChanges();

    const pin = fixture.nativeElement.querySelector('[data-pin-key]') as HTMLButtonElement;
    expect(pin).not.toBeNull();
    expect(getComputedStyle(pin).opacity).toBe('1');
    expect(pin.querySelector('mat-icon')?.textContent?.trim()).toBe('push_pin');
  });
});
