import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
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

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SidebarMobileV2Component], providers: [provideRouter([])] }).compileComponents();
    fixture = TestBed.createComponent(SidebarMobileV2Component);
    fixture.componentRef.setInput('menus', [dashboard, work, admin, reports, help]);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User' });
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
});
