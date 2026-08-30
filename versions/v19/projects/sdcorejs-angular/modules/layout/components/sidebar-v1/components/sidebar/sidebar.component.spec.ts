import { signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { SdLayoutNavigationStateService, SdLayoutStorageService } from '../../../../services';
import { SdLayoutMenu } from '../../../../services';
import { SdSidebarV1Panel } from './sidebar.component';

function storageCell<T>(initial: T) {
  let value = initial;
  return {
    get: jasmine.createSpy('get').and.callFake(() => value),
    set: jasmine.createSpy('set').and.callFake((next: T) => (value = next)),
  };
}

describe('SdSidebarV1Panel', () => {
  let fixture: ComponentFixture<SdSidebarV1Panel>;
  let component: SdSidebarV1Panel;
  let routerEvents: Subject<unknown>;
  let router: {
    events: Subject<unknown>;
    url: string;
    navigate: jasmine.Spy;
    navigateByUrl: jasmine.Spy;
    createUrlTree: jasmine.Spy;
    serializeUrl: jasmine.Spy;
  };
  let storage: ReturnType<typeof createStorage>;
  let navigationState: {
    pinnedMenus: ReturnType<typeof signal<SdLayoutMenu[]>>;
    hydrate: jasmine.Spy;
    togglePinned: jasmine.Spy;
  };

  const orders: SdLayoutMenu = { id: 'orders', title: 'Orders', path: '/orders', permission: true };
  const users: SdLayoutMenu = { id: 'users', title: 'Người dùng', path: '/admin/users', permission: true };
  const admin: SdLayoutMenu = { id: 'admin', title: 'Administration', children: [users] };
  const group: SdLayoutMenu = { id: 'work', title: 'Work', tooltipTitle: 'Daily work', children: [orders, admin] };
  const report: SdLayoutMenu = { id: 'reports', title: 'Reports', path: '/reports', queryParams: { year: 2026 }, permission: true };
  const menus = [group, report];

  function createStorage() {
    return {
      menuLockStatus: storageCell(true),
      lastActiveMenuGroupId: storageCell(''),
    };
  }

  async function create(
    options: { path?: string; pinned?: SdLayoutMenu[]; pinEnabled?: boolean; mobile?: boolean; logoUrl?: string } = {}
  ) {
    routerEvents = new Subject<unknown>();
    router = {
      events: routerEvents,
      url: options.path ?? '/orders',
      navigate: jasmine.createSpy('navigate').and.resolveTo(true),
      navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
      createUrlTree: jasmine.createSpy('createUrlTree'),
      serializeUrl: jasmine.createSpy('serializeUrl'),
    };
    storage = createStorage();
    navigationState = {
      pinnedMenus: signal(options.pinned ?? []),
      hydrate: jasmine.createSpy('hydrate'),
      togglePinned: jasmine.createSpy('togglePinned'),
    };

    await TestBed.configureTestingModule({
      imports: [SdSidebarV1Panel],
      providers: [
        { provide: Router, useValue: router },
        { provide: SdLayoutStorageService, useValue: storage },
        { provide: SdLayoutNavigationStateService, useValue: navigationState },
      ],
    })
      .overrideComponent(SdSidebarV1Panel, { set: { template: '' } })
      .compileComponents();

    fixture = TestBed.createComponent(SdSidebarV1Panel);
    component = fixture.componentInstance;
    component.currentPath.set(options.path ?? '/orders');
    fixture.componentRef.setInput('menus', menus);
    fixture.componentRef.setInput('userInfo', { fullName: 'Test User' });
    fixture.componentRef.setInput('sidebar', {
      version: 1,
      pin: { enabled: options.pinEnabled ?? true },
      brandColor: '#123456',
      brandLightColor: '#abc',
      logoUrl: options.logoUrl,
    });
    fixture.componentRef.setInput('isShowSidebar', true);
    fixture.componentRef.setInput('isMobile', options.mobile ?? false);
    fixture.detectChanges();
  }

  async function createRealTemplate(options: { show?: boolean } = {}) {
    routerEvents = new Subject<unknown>();
    router = {
      events: routerEvents,
      url: '/orders',
      navigate: jasmine.createSpy('navigate').and.resolveTo(true),
      navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
      createUrlTree: jasmine
        .createSpy('createUrlTree')
        .and.callFake((commands: string[], extras: { queryParams?: Record<string, unknown> }) => ({
          commands,
          queryParams: extras.queryParams ?? {},
        })),
      serializeUrl: jasmine.createSpy('serializeUrl').and.callFake((tree: { commands: string[]; queryParams: Record<string, unknown> }) => {
        const query = Object.entries(tree.queryParams)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
          .join('&');
        return `${tree.commands[0]}${query ? `?${query}` : ''}`;
      }),
    };
    storage = createStorage();
    navigationState = {
      pinnedMenus: signal([report]),
      hydrate: jasmine.createSpy('hydrate'),
      togglePinned: jasmine.createSpy('togglePinned'),
    };

    await TestBed.configureTestingModule({
      imports: [SdSidebarV1Panel, NoopAnimationsModule],
      providers: [
        { provide: Router, useValue: router },
        { provide: SdLayoutStorageService, useValue: storage },
        { provide: SdLayoutNavigationStateService, useValue: navigationState },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SdSidebarV1Panel);
    component = fixture.componentInstance;
    component.currentPath.set('/orders');
    fixture.componentRef.setInput('menus', menus);
    fixture.componentRef.setInput('userInfo', { fullName: 'Test User' });
    fixture.componentRef.setInput('sidebar', {
      version: 1,
      pin: { enabled: true },
      brandColor: '#123456',
      brandLightColor: '#abc',
    });
    fixture.componentRef.setInput('isShowSidebar', options.show ?? true);
    fixture.componentRef.setInput('isMobile', false);
    fixture.detectChanges();
    component.treeControl.expand(admin);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => TestBed.resetTestingModule());

  it('hydrates menus and binds the active group from the current nested path', async () => {
    await create({ path: '/admin/users/detail' });

    expect(navigationState.hydrate).toHaveBeenCalledWith(menus);
    expect(component.idMenuGroupActive()).toBe('work');
    expect(component.titleMenuGroup()).toBe('Daily work');
    expect(component.menusByGroup()).toEqual([orders, admin]);
    expect(component.dataSource.data).toEqual([orders, admin]);
    expect(component.treeControl.isExpanded(admin)).toBeTrue();
    expect(component.totalMenuInMenusByGroup()).toBe(3);
  });

  it('keeps only the most exact menu active when a parent path also matches', async () => {
    const appointment: SdLayoutMenu = { id: 'appointment', title: 'Lịch hẹn', path: '/appointment', permission: true };
    const appointmentCs: SdLayoutMenu = { id: 'appointment-cs', title: 'Lịch hẹn CS', path: '/appointment/cs', permission: true };
    await create({ path: '/appointment/cs' });

    fixture.componentRef.setInput('menus', [{ id: 'appointments', title: 'Lịch hẹn', children: [appointment, appointmentCs] }]);
    fixture.detectChanges();

    expect(component.activeMenuPath()).toBe('/appointment/cs');
  });

  it('uses the shared apps fallback when V1 has no configured logo and preserves a custom logo', async () => {
    await create();

    expect(component.logoUrl()).toBeUndefined();

    fixture.componentRef.setInput('sidebar', {
      ...component.sidebar(),
      logoUrl: 'https://cdn.example.com/company.svg',
    });
    fixture.detectChanges();
    expect(component.logoUrl()).toBe('https://cdn.example.com/company.svg');
  });

  it('prefers a matching pinned group on first binding and can expand it again', async () => {
    const pinned = { ...users, id: undefined };
    await create({ path: '/admin/users', pinned: [pinned] });

    expect(component.idMenuGroupActive()).toBe('pinned-menu-group');
    expect(component.pinnedNodeKeys()).toEqual(new Set(['/admin/users']));
    expect(component.isPinnedNode(pinned)).toBeTrue();

    component.searchText.set('old');
    component.expandPinnedGroup();
    expect(component.menusByGroup()).toEqual([pinned]);
    expect(component.searchText()).toBe('');
    expect(storage.lastActiveMenuGroupId.set).toHaveBeenCalledWith('pinned-menu-group');
  });

  it('falls back to the last active group and clears state when no group matches', async () => {
    await create({ path: '/outside', pinEnabled: false });
    storage.lastActiveMenuGroupId.set('work');
    routerEvents.next(new NavigationEnd(1, '/still-outside', '/still-outside'));

    expect(component.idMenuGroupActive()).toBe('work');
    expect(component.menusByGroup()).toEqual([orders, admin]);

    storage.lastActiveMenuGroupId.set('missing');
    routerEvents.next(new NavigationEnd(2, '/another-outside', '/another-outside'));
    expect(component.idMenuGroupActive()).toBe('');
    expect(component.titleMenuGroup()).toBe('');
    expect(component.menusByGroup()).toEqual([]);
  });

  it('handles tree, pin, lock, home and user-menu actions', async () => {
    await create();
    const stopPropagation = jasmine.createSpy('stopPropagation');
    const expanded = jasmine.createSpy('expanded');
    const sidebarState = jasmine.createSpy('sidebarState');
    const opened = jasmine.createSpy('opened');
    const closed = jasmine.createSpy('closed');
    component.expandSideBar.subscribe(expanded);
    component.showSideBar.subscribe(sidebarState);
    component.popupUserMenuOpened.subscribe(opened);
    component.popupUserMenuClosed.subscribe(closed);

    expect(component.hasChild(0, group)).toBeTrue();
    expect(component.hasChild(0, orders)).toBeFalse();
    component.onToggleMenuNode(group);
    expect(component.treeControl.isExpanded(group)).toBeTrue();
    component.onTogglePin({ stopPropagation } as unknown as MouseEvent, orders);
    expect(stopPropagation).toHaveBeenCalled();
    expect(navigationState.togglePinned).toHaveBeenCalledWith(orders);

    component.toggleMenuLock({ stopPropagation } as unknown as Event);
    expect(component.isMenuLock()).toBeFalse();
    expect(storage.menuLockStatus.set).toHaveBeenCalledWith(false);
    expect(sidebarState).toHaveBeenCalledWith(false);

    component.searchText.set('query');
    component.openHomePage();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/layout/home');
    expect(component.searchText()).toBe('');

    component.onUserMenuOpened();
    component.onUserMenuClosed();
    expect(opened).toHaveBeenCalled();
    expect(closed).toHaveBeenCalled();
  });

  it('navigates internal and external links and closes after mobile navigation', async () => {
    await create({ mobile: true });
    const sidebarState = jasmine.createSpy('sidebarState');
    component.showSideBar.subscribe(sidebarState);
    const windowOpen = spyOn(window, 'open');

    component.navigate({ path: 'https://example.com/docs', queryParams: {} });
    expect(windowOpen).toHaveBeenCalledWith('https://example.com/docs', '_blank', 'noopener,noreferrer');
    expect(router.navigate).not.toHaveBeenCalled();

    component.navigate({ path: '/reports?old=1', queryParams: { year: 2026 } });
    expect(router.navigate).toHaveBeenCalledWith(['/reports'], {
      queryParams: { year: 2026 },
      state: { switchTab: true },
    });
    expect(sidebarState).toHaveBeenCalledWith(null);
  });

  it('refuses to open a non-http scheme that merely contains the substring "http"', async () => {
    await create();
    const windowOpen = spyOn(window, 'open');

    component.navigate({ path: 'javascript:fetch("//evil.example.com")//http', queryParams: {} });

    expect(windowOpen).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['javascript:fetch("//evil.example.com")//http'], jasmine.any(Object));
  });

  it('expands child groups, navigates leaf groups, and filters nested menus by normalized text', async () => {
    await create({ path: '/orders' });
    const expanded = jasmine.createSpy('expanded');
    component.expandSideBar.subscribe(expanded);

    component.expandMenuGroup(group);
    expect(component.titleMenuGroup()).toBe('Daily work');
    expect(component.menusByGroup()).toEqual([orders, admin]);
    expect(expanded).toHaveBeenCalled();

    component.onFilterSearchText('  nguoi dung!! ');
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].id).toBe('admin');
    expect(component.treeControl.isExpanded(component.dataSource.data[0])).toBeTrue();

    component.onClearSearchText();
    expect(component.dataSource.data).toEqual([orders, admin]);

    component.expandMenuGroup(report);
    expect(router.navigate).toHaveBeenCalledWith(['/reports'], {
      queryParams: { year: 2026 },
      state: { switchTab: true },
    });
  });

  it('matches menus by route path even when the title has no matching characters', async () => {
    await create({ path: '/orders' });
    component.expandMenuGroup(group);

    component.onFilterSearchText('users');

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].id).toBe('admin');
  });

  it('matches menus by ordered initials of the title (at least 2 chars)', async () => {
    await create({ path: '/orders' });
    component.expandMenuGroup(group);

    component.onFilterSearchText('nd');

    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].id).toBe('admin');
  });

  it('applies and clears group hover styles for hex, rgb and image icons', async () => {
    await create();
    component.idMenuGroupActive.set('other');
    const host = document.createElement('div');
    const icon = document.createElement('span');
    icon.className = 'c-menu-group-icon';
    host.appendChild(icon);
    const event = { currentTarget: host } as unknown as MouseEvent;

    component.onMouseOverMenuGroupNode(event, group);
    expect(icon.style.backgroundColor).toBe('rgba(170, 187, 204, 0.6)');
    expect(icon.style.color).toBe('rgb(18, 52, 86)');
    component.onMouseLeaveMenuGroupNode(event, group);
    expect(icon.style.backgroundColor).toBe('transparent');

    fixture.componentRef.setInput('sidebar', { version: 1, brandLightColor: 'rgb(1, 2, 3)' });
    fixture.detectChanges();
    component.onMouseOverMenuGroupNode(event, group);
    expect(icon.style.backgroundColor).toBe('rgba(1, 2, 3, 0.6)');

    const image = document.createElement('img');
    image.className = 'c-menu-group-icon';
    host.replaceChildren(image);
    component.onMouseLeaveMenuGroupNode(event, group);
    expect(image.style.opacity).toBe('0.55');
  });

  it('applies delayed pin and menu-node hover styles and restores them on leave', fakeAsync(async () => {
    await create({ path: '/outside' });
    const host = document.createElement('div');
    host.innerHTML = `
      <span class="c-menu-node-icon"></span>
      <span class="c-menu-node-description-content"></span>
      <span class="c-menu-node-description-icon-expand"></span>
      <span class="c-menu-node-description-icon-pin"></span>`;
    const event = { currentTarget: host } as unknown as MouseEvent;

    component.onMouseOverMenuNode(event, orders);
    tick(300);
    expect(component.isHoveredNode(orders)).toBeTrue();
    expect((host.querySelector('.c-menu-node-description-icon-pin') as HTMLElement).style.opacity).toBe('1');
    expect(host.style.backgroundColor).toBe('rgba(170, 187, 204, 0.6)');

    component.onMouseLeaveMenuNode(event, orders);
    expect(component.isHoveredNode(orders)).toBeFalse();
    expect((host.querySelector('.c-menu-node-description-icon-pin') as HTMLElement).style.opacity).toBe('0');
    expect(host.style.backgroundColor).toBe('transparent');
  }));

  // -------------------------------------------------------------------------
  // A11y — mục menu từng là <div (click)> mang aria-hidden="true": cả cụm biến
  // mất khỏi accessibility tree và bàn phím không điều hướng được.
  // -------------------------------------------------------------------------

  /** Bắn keydown lên `el` rồi chạy handler với target === currentTarget (như DOM thật). */
  function pressOn(el: HTMLElement, key: string, handler: (ev: KeyboardEvent) => void): KeyboardEvent {
    const listener = ((ev: Event) => handler(ev as KeyboardEvent)) as EventListener;
    el.addEventListener('keydown', listener);
    const ev = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    el.dispatchEvent(ev);
    el.removeEventListener('keydown', listener);
    return ev;
  }

  it('Enter on a menu item navigates, same as a click', async () => {
    await create({ path: '/outside' });

    pressOn(document.createElement('div'), 'Enter', ev => component.onMenuNodeKeydown(ev, report as any));

    expect(router.navigate).toHaveBeenCalledWith(['/reports'], {
      queryParams: { year: 2026 },
      state: { switchTab: true },
    });
  });

  it('Space on a menu item navigates and blocks the page scroll', async () => {
    await create({ path: '/outside' });

    const ev = pressOn(document.createElement('div'), ' ', keyEvent => component.onMenuNodeKeydown(keyEvent, report as any));

    expect(router.navigate).toHaveBeenCalled();
    expect(ev.defaultPrevented).toBe(true);
  });

  it('Enter on a parent menu node expands it, same as a click', async () => {
    await create({ path: '/outside' });
    expect(component.treeControl.isExpanded(admin)).toBeFalse();

    pressOn(document.createElement('div'), 'Enter', ev => component.onToggleMenuNodeKeydown(ev, admin));

    expect(component.treeControl.isExpanded(admin)).toBeTrue();
  });

  // why: nút ghim nằm LỒNG trong mục menu — Enter trên nút ghim không được kéo theo điều hướng.
  it('ignores keyboard events bubbling up from the nested pin button', async () => {
    await create({ path: '/outside' });
    const wrapper = document.createElement('div');
    const pin = document.createElement('button');
    wrapper.appendChild(pin);

    const listener = ((ev: Event) => component.onMenuNodeKeydown(ev as KeyboardEvent, report as any)) as EventListener;
    wrapper.addEventListener('keydown', listener);
    pin.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    wrapper.removeEventListener('keydown', listener);

    expect(router.navigate).not.toHaveBeenCalled();
  });

  describe('real template accessibility', () => {
    function accessibleNameSource(element: HTMLElement): string {
      return element.getAttribute('aria-label')?.trim() || element.textContent?.trim() || '';
    }

    beforeEach(async () => createRealTemplate());

    it('gives every rendered control and link an accessible name source', () => {
      const root = fixture.nativeElement as HTMLElement;
      const controls = root.querySelectorAll<HTMLElement>('button, a[href], [role="button"]');
      expect(controls.length).toBeGreaterThan(0);

      for (const control of controls) {
        expect(accessibleNameSource(control)).withContext(control.outerHTML).not.toBe('');
      }
      for (const groupButton of root.querySelectorAll<HTMLElement>('.c-menu-group > button')) {
        expect(groupButton.getAttribute('aria-label')?.trim()).withContext(groupButton.outerHTML).toBeTruthy();
      }
    });

    it('renders a valid home href and named native links for every leaf', () => {
      const root = fixture.nativeElement as HTMLElement;
      const home = root.querySelector('.c-logo a') as HTMLAnchorElement;
      const leafLinks = root.querySelectorAll<HTMLAnchorElement>('.c-menu-tree-container a.c-menu-node-description-content[href]');

      expect(home.getAttribute('href')).toBe('/layout/home');
      expect(home.getAttribute('href')).not.toContain('javascript:');
      expect(leafLinks.length).toBe(2);
      expect(Array.from(leafLinks).map(link => accessibleNameSource(link))).toEqual(jasmine.arrayContaining(['Orders', 'Người dùng']));
    });

    it('uses Material treeitems with neutral wrappers and explicit groups', () => {
      const root = fixture.nativeElement as HTMLElement;
      const tree = root.querySelector('mat-tree') as HTMLElement;
      const treeItems = root.querySelectorAll<HTMLElement>('mat-nested-tree-node');

      expect(root.querySelectorAll('.c-menu-tree-container li').length).toBe(0);
      expect(tree.getAttribute('role')).toBe('tree');
      expect(treeItems.length).toBeGreaterThan(0);
      for (const treeItem of treeItems) {
        expect(treeItem.getAttribute('role')).toBe('treeitem');
      }
      expect(root.querySelector('.c-menu-node-group')?.getAttribute('role')).toBe('group');
    });

    it('contains hidden focusables inside an inert boundary without aria-hidden', () => {
      fixture.componentRef.setInput('isShowSidebar', false);
      fixture.detectChanges();
      const tree = (fixture.nativeElement as HTMLElement).querySelector('.c-menu-tree') as HTMLElement;
      const focusable = tree.querySelector<HTMLElement>('button, a[href], input, [tabindex]');

      expect(tree.hasAttribute('inert')).toBeTrue();
      expect(tree.closest('[aria-hidden="true"]')).toBeNull();
      expect(focusable).not.toBeNull();
      expect(focusable?.closest('[inert]')).toBe(tree);

      fixture.componentRef.setInput('isShowSidebar', true);
      fixture.detectChanges();
      expect(tree.hasAttribute('inert')).toBeFalse();
    });
  });
});
