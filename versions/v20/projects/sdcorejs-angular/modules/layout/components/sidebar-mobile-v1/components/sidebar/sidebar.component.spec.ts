import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { SdLayoutMenu, SdLayoutStorageService } from '../../../../services';
import { SidebarMobileOverlayComponent } from './sidebar.component';

describe('SidebarMobileOverlayComponent', () => {
  let fixture: ComponentFixture<SidebarMobileOverlayComponent>;
  let component: SidebarMobileOverlayComponent;
  let routerEvents: Subject<unknown>;
  let router: { events: Subject<unknown>; navigate: jasmine.Spy };
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
    router = { events: routerEvents, navigate: jasmine.createSpy('navigate').and.resolveTo(true) };
    storage = {
      lastActiveMenuGroupId: {
        get: jasmine.createSpy('get').and.callFake(() => activeId),
        set: jasmine.createSpy('set').and.callFake((value: string) => (activeId = value)),
      },
    };
    await TestBed.configureTestingModule({
      imports: [SidebarMobileOverlayComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: SdLayoutStorageService, useValue: storage },
      ],
    })
      .overrideComponent(SidebarMobileOverlayComponent, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SidebarMobileOverlayComponent);
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
    expect(windowOpen).toHaveBeenCalledWith('https://example.com');

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

  it('falls back to the last active group and emits an empty title when nothing matches', () => {
    const titleChanged = jasmine.createSpy('titleChanged');
    component.titleMenuGroupChanged.subscribe(titleChanged);
    activeId = 'reports';
    component.currentPath.set('/outside-one');
    routerEvents.next(new NavigationEnd(1, '/outside-one', '/outside-one'));
    expect(component.titleMenuGroup()).toBe('Reports');

    activeId = 'missing';
    component.currentPath.set('/outside-two');
    routerEvents.next(new NavigationEnd(2, '/outside-two', '/outside-two'));
    expect(component.titleMenuGroup()).toBe('');
    expect(titleChanged).toHaveBeenCalledWith('');
  });
});
