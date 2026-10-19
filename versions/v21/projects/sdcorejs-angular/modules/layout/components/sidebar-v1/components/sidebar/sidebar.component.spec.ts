import { OverlayContainer } from '@angular/cdk/overlay';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { SdLayoutContext, SdLayoutContextConfiguration } from '../../../../configurations';
import { SdLayoutContextService, SdLayoutNavigationStateService, SdLayoutStorageService } from '../../../../services';
import { SdLayoutMenu } from '../../../../services';
import { SdLayoutContextSwitcher } from '../../../shared/context-switcher/context-switcher.component';
import { SdSidebarV1Panel } from './sidebar.component';

function storageCell<T>(initial: T) {
  let value = initial;
  return {
    get: jasmine.createSpy('get').and.callFake(() => value),
    set: jasmine.createSpy('set').and.callFake((next: T) => (value = next)),
  };
}

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

/**
 * Applies, as inline styles, the declarations of the stylesheet `@media (pointer: coarse)` rules that match `element`, in
 * source order — a stand-in for a touch device, which Karma cannot emulate.
 */
function simulateCoarsePointer(element: HTMLElement): void {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSMediaRule) || !rule.conditionText.includes('pointer: coarse')) continue;
      for (const inner of Array.from(rule.cssRules)) {
        if (!(inner instanceof CSSStyleRule) || !element.matches(inner.selectorText)) continue;
        for (const property of Array.from(inner.style)) element.style.setProperty(property, inner.style.getPropertyValue(property));
      }
    }
  }
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

  async function createSearchInput() {
    await createRealTemplate();
    const searchGroup: SdLayoutMenu = {
      id: 'search-group',
      title: 'Search group',
      children: [
        { id: 'product', title: 'Sản phẩm', path: '/product', permission: true },
        ...Array.from({ length: 10 }, (_, index) => ({
          id: `search-${index}`,
          title: `Other ${index}`,
          path: `/other-${index}`,
          permission: true,
        })),
      ],
    };
    fixture.componentRef.setInput('menus', [searchGroup]);
    fixture.detectChanges();
    component.expandMenuGroup(searchGroup);
    fixture.detectChanges();
    await fixture.whenStable();
    return (fixture.nativeElement as HTMLElement).querySelector<HTMLInputElement>('.c-menu-search-input')!;
  }

  it('filters from the native search input and restores the menu and input focus when cleared', async () => {
    const input = await createSearchInput();
    input.value = 'san pham';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    expect(component.searchText()).toBe('san pham');
    expect(component.dataSource.data.map(menu => menu.id)).toEqual(['product']);

    const clear = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.c-menu-search-clear')!;
    expect(clear.getAttribute('aria-label')).toBeTruthy();
    clear.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(component.searchText()).toBe('');
    expect(component.dataSource.data.length).toBe(11);
    expect(document.activeElement).toBe(input);
  });

  it('buffers native search input during IME composition', async () => {
    const input = await createSearchInput();
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    input.value = 'san pham';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(component.searchText()).toBe('');
    expect(component.dataSource.data.length).toBe(11);
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: 'san pham' }));
    fixture.detectChanges();
    expect(component.searchText()).toBe('san pham');
    expect(component.dataSource.data.map(menu => menu.id)).toEqual(['product']);
  });

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

    it('keeps the focused Material branch exposed through collapse and expansion', () => {
      const parent = fixture.nativeElement.querySelector('mat-nested-tree-node.expanded') as HTMLElement;
      const toggle = parent.querySelector('button[aria-expanded]') as HTMLButtonElement;
      parent.focus();
      expect(document.activeElement).toBe(parent);
      expect(parent.closest('[aria-hidden="true"]')).toBeNull();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');

      toggle.click();
      fixture.detectChanges();
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(parent);
      expect(parent.closest('[aria-hidden="true"]')).toBeNull();

      toggle.click();
      fixture.detectChanges();
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(parent.closest('[aria-hidden="true"]')).toBeNull();
    });

    it('exposes the focused nested route and its visible label', () => {
      const parent = fixture.nativeElement.querySelector('mat-nested-tree-node.expanded') as HTMLElement;
      const route = parent.querySelector('mat-nested-tree-node a[href]') as HTMLAnchorElement;
      route.focus();
      expect(document.activeElement).toBe(route);
      expect(route.closest('[aria-hidden="true"]')).toBeNull();
      expect(route.textContent).toContain(users.title);
    });

    it('uses the full menu height while keeping the user footer below the icon rail', () => {
      const children: SdLayoutMenu[] = Array.from({ length: 30 }, (_, index) => ({
        id: `item-${index}`,
        title: `Menu ${index}`,
        path: `/item-${index}`,
        permission: true,
      }));
      const groups: SdLayoutMenu[] = Array.from({ length: 20 }, (_, index) => ({
        id: `group-${index}`,
        title: `Group ${index}`,
        children,
      }));
      fixture.componentRef.setInput('menus', groups);
      fixture.detectChanges();
      component.expandMenuGroup(groups[0]);
      fixture.detectChanges();

      const root = fixture.nativeElement as HTMLElement;
      root.style.cssText = 'display:block;height:640px;width:290px';
      const wrapper = root.querySelector<HTMLElement>('.wrapper')!;
      const tree = root.querySelector<HTMLElement>('.c-menu-tree-container')!;
      const rail = root.querySelector<HTMLElement>('.c-menu-group')!;
      const footer = root.querySelector<HTMLElement>('.c-footer')!;
      const search = root.querySelector<HTMLElement>('.c-menu-tree-search')!;

      for (const height of [640, 400]) {
        root.style.height = `${height}px`;
        const searchTop = search.getBoundingClientRect().top;
        expect(wrapper.getBoundingClientRect().bottom - tree.getBoundingClientRect().bottom).toBeLessThanOrEqual(4);
        expect(rail.getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().top + 1);
        expect(footer.getBoundingClientRect().right).toBeLessThanOrEqual(tree.getBoundingClientRect().left);
        expect(footer.getBoundingClientRect().bottom).toBeCloseTo(wrapper.getBoundingClientRect().bottom, 0);
        expect(tree.scrollHeight).toBeGreaterThan(tree.clientHeight);
        expect(rail.scrollHeight).toBeGreaterThan(rail.clientHeight);

        tree.scrollTop = tree.scrollHeight;
        rail.scrollTop = rail.scrollHeight;
        const lastMenu = tree.querySelectorAll<HTMLElement>('.c-menu-node');
        expect(lastMenu[lastMenu.length - 1].getBoundingClientRect().bottom).toBeLessThanOrEqual(tree.getBoundingClientRect().bottom + 1);
        const lastGroup = rail.querySelectorAll<HTMLElement>('button');
        expect(lastGroup[lastGroup.length - 1].getBoundingClientRect().bottom).toBeLessThanOrEqual(footer.getBoundingClientRect().top + 1);
        expect(search.getBoundingClientRect().top).toBe(searchTop);
      }
    });

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

  // -------------------------------------------------------------------------
  // Context switcher (R-008, D-010): dòng phụ dưới tiêu đề khi sidebar mở,
  // avatar ngay dưới logo khi thu gọn về rail 56px. Không có `context` thì không đổi gì (INV-001).
  // -------------------------------------------------------------------------
  describe('context switcher (R-008, AC-011, AC-018)', () => {
    const contexts: SdLayoutContext[] = [
      { id: 'hq', title: 'Head Office', subtitle: 'Owner' },
      { id: 'north', title: 'North Branch', subtitle: 'Manager' },
    ];
    let context: ContextServiceStub;

    const root = () => fixture.nativeElement as HTMLElement;
    const q = (selector: string) => root().querySelector<HTMLElement>(selector);
    const switchers = () => fixture.debugElement.queryAll(By.directive(SdLayoutContextSwitcher));
    const switcher = () => switchers()[0]?.componentInstance as SdLayoutContextSwitcher;
    const overlayRoot = () => TestBed.inject(OverlayContainer).getContainerElement();

    async function createWithContext(options: { show?: boolean; context?: SdLayoutContextConfiguration; menus?: SdLayoutMenu[] } = {}) {
      routerEvents = new Subject<unknown>();
      router = {
        events: routerEvents,
        url: '/orders',
        navigate: jasmine.createSpy('navigate').and.resolveTo(true),
        navigateByUrl: jasmine.createSpy('navigateByUrl').and.resolveTo(true),
        createUrlTree: jasmine.createSpy('createUrlTree').and.callFake((commands: string[]) => ({ commands })),
        serializeUrl: jasmine.createSpy('serializeUrl').and.callFake((tree: { commands: string[] }) => tree.commands[0]),
      };
      storage = createStorage();
      navigationState = {
        pinnedMenus: signal<SdLayoutMenu[]>([]),
        hydrate: jasmine.createSpy('hydrate'),
        togglePinned: jasmine.createSpy('togglePinned'),
      };
      context = createContextStub();

      await TestBed.configureTestingModule({
        imports: [SdSidebarV1Panel, NoopAnimationsModule],
        providers: [
          { provide: Router, useValue: router },
          { provide: SdLayoutStorageService, useValue: storage },
          { provide: SdLayoutNavigationStateService, useValue: navigationState },
          { provide: SdLayoutContextService, useValue: context },
        ],
      }).compileComponents();

      fixture = TestBed.createComponent(SdSidebarV1Panel);
      // why: panel V1 nằm trong luồng tài liệu — cả suite để lại DOM trên body nên host trôi xuống gần đáy viewport
      // và CDK lật/đẩy popover. Cố định panel ở đầu trang như trong layout thật để phép đo vị trí không phụ thuộc thứ tự spec.
      Object.assign((fixture.nativeElement as HTMLElement).style, { position: 'fixed', top: '0px', left: '0px', height: '100vh' });
      component = fixture.componentInstance;
      component.currentPath.set('/orders');
      fixture.componentRef.setInput('menus', options.menus ?? menus);
      fixture.componentRef.setInput('userInfo', { fullName: 'Test User' });
      fixture.componentRef.setInput('sidebar', {
        version: 1,
        brandColor: '#123456',
        brandLightColor: '#abc',
        ...(options.context ? { context: options.context } : {}),
      });
      fixture.componentRef.setInput('isShowSidebar', options.show ?? true);
      fixture.componentRef.setInput('isMobile', false);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    async function openSwitcher() {
      q('[data-context-trigger]')!.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('renders the header switcher directly under the title, anchored to the header, with a popover 24px narrower than the sidebar', async () => {
      await createWithContext({ context: { items: contexts } });
      const header = q('.c-header')!;
      const titleGroup = q('.c-title-menu-group')!;
      const title = titleGroup.querySelector<HTMLElement>('span')!;
      const host = switchers()[0].nativeElement as HTMLElement;

      expect(switchers().length).toBe(1);
      expect(switcher().appearance()).toBe('header');
      expect(switcher().anchor()).toBe(header);
      expect(host.parentElement).toBe(titleGroup);
      expect(title.nextElementSibling).toBe(host);
      expect(context.syncItems).toHaveBeenCalledWith(contexts);

      // Tiêu đề giữ nguyên dáng; trigger là dòng phụ bên dưới và không kế thừa chữ đậm 16px của tiêu đề.
      const trigger = q('[data-context-trigger]')!;
      expect(getComputedStyle(title).fontWeight).toBe('700');
      expect(getComputedStyle(title).fontSize).toBe('16px');
      expect(trigger.getBoundingClientRect().top).toBeGreaterThanOrEqual(title.getBoundingClientRect().bottom - 1);
      expect(getComputedStyle(trigger).fontWeight).toBe('400');
      expect(getComputedStyle(trigger).letterSpacing).toBe('normal');

      await openSwitcher();

      const popover = overlayRoot().querySelector<HTMLElement>('[data-context-popover]')!;
      const sidebarWidth = q('.wrapper')!.getBoundingClientRect().width;
      expect(switcher().isOpen()).toBeTrue();
      expect(popover.getBoundingClientRect().width).toBeCloseTo(sidebarWidth - 24, 0);
      expect(popover.getBoundingClientRect().left).toBeCloseTo(header.getBoundingClientRect().left + 12, 0);
      expect(popover.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom - 1);
    });

    it('shows the context avatar directly below the logo on the collapsed rail and opens its popover to the right', async () => {
      await createWithContext({ show: false, context: { items: contexts } });
      const logo = q('.c-logo')!;
      const host = switchers()[0].nativeElement as HTMLElement;

      expect(switchers().length).toBe(1);
      expect(switcher().appearance()).toBe('rail');
      expect(switcher().anchor()).toBe(logo);
      expect(logo.nextElementSibling).toBe(host);
      expect(q('.c-title-menu-group sd-layout-context-switcher')).toBeNull();

      const logoRect = logo.getBoundingClientRect();
      const triggerRect = q('[data-context-trigger]')!.getBoundingClientRect();
      expect(triggerRect.top).toBeGreaterThanOrEqual(logoRect.bottom);
      expect(triggerRect.left + triggerRect.width / 2).toBeCloseTo(logoRect.left + logoRect.width / 2, 0);
      expect(triggerRect.bottom).toBeLessThanOrEqual(q('.c-body')!.getBoundingClientRect().top);

      await openSwitcher();

      const popover = overlayRoot().querySelector<HTMLElement>('[data-context-popover]')!;
      expect(switcher().isOpen()).toBeTrue();
      expect(popover.getBoundingClientRect().left).toBeCloseTo(logoRect.right + 8, 0);
      expect(popover.getBoundingClientRect().top).toBeCloseTo(triggerRect.top, 0);
    });

    // why: pointer thô cho trigger rail vùng chạm 44px (tràn 8px quanh avatar 28px) — không được lấn lên link trang chủ.
    it('keeps the 44px coarse-pointer rail hit area clear of the home link under the logo', async () => {
      await createWithContext({ show: false, context: { items: contexts } });
      const host = switchers()[0].nativeElement as HTMLElement;
      const trigger = q('[data-context-trigger]')!;
      const home = q('.c-logo a')!;
      expect(getComputedStyle(host).marginTop).toBe('4px');

      simulateCoarsePointer(host);
      simulateCoarsePointer(trigger);

      const triggerRect = trigger.getBoundingClientRect();
      const homeRect = home.getBoundingClientRect();
      expect(triggerRect.width).toBe(44);
      expect(triggerRect.height).toBe(44);
      const overlaps =
        triggerRect.left < homeRect.right &&
        homeRect.left < triggerRect.right &&
        triggerRect.top < homeRect.bottom &&
        homeRect.top < triggerRect.bottom;
      expect(overlaps).withContext(`trigger top ${triggerRect.top}, home bottom ${homeRect.bottom}`).toBeFalse();
      // Phía dưới cũng không lấn lên nút nhóm đầu tiên của rail.
      expect(triggerRect.bottom).toBeLessThanOrEqual(q('.c-menu-group > button')!.getBoundingClientRect().top);
    });

    it('swaps the header switcher for the rail avatar when the sidebar collapses, and back when it expands', async () => {
      await createWithContext({ context: { items: contexts } });
      expect(switcher().appearance()).toBe('header');

      fixture.componentRef.setInput('isShowSidebar', false);
      fixture.detectChanges();
      expect(switchers().length).toBe(1);
      expect(switcher().appearance()).toBe('rail');

      fixture.componentRef.setInput('isShowSidebar', true);
      fixture.detectChanges();
      expect(switchers().length).toBe(1);
      expect(switcher().appearance()).toBe('header');
    });

    // why: popover nằm trong overlay CDK có backdrop phủ màn hình — chuột rời sidenav thì main thu gọn sidebar
    // đang mở tạm (hover) và huỷ luôn switcher. Báo qua cặp output popup như menu người dùng để giữ sidebar mở.
    it('reports the header popover through the sidebar popup outputs so a hover-expanded sidebar stays open', async () => {
      await createWithContext({ context: { items: contexts } });
      const opened = jasmine.createSpy('opened');
      const closed = jasmine.createSpy('closed');
      component.popupUserMenuOpened.subscribe(opened);
      component.popupUserMenuClosed.subscribe(closed);

      await openSwitcher();
      expect(opened).toHaveBeenCalledTimes(1);
      expect(closed).not.toHaveBeenCalled();

      switcher().close(false);
      fixture.detectChanges();
      expect(opened).toHaveBeenCalledTimes(1);
      expect(closed).toHaveBeenCalledTimes(1);
    });

    // why: main mở rộng sidebar khi nhận popupUserMenuOpened — rail mà báo thì switcher rail bị thay bằng bản header.
    it('keeps the rail popover silent so the collapsed rail is not expanded under it', async () => {
      await createWithContext({ show: false, context: { items: contexts } });
      const opened = jasmine.createSpy('opened');
      const closed = jasmine.createSpy('closed');
      component.popupUserMenuOpened.subscribe(opened);
      component.popupUserMenuClosed.subscribe(closed);

      await openSwitcher();
      expect(switcher().isOpen()).toBeTrue();
      switcher().close(false);
      fixture.detectChanges();

      expect(opened).not.toHaveBeenCalled();
      expect(closed).not.toHaveBeenCalled();
    });

    it('leaves no gap under the logo for a context without items', async () => {
      await createWithContext({ show: false, context: { items: [] } });
      const host = switchers()[0].nativeElement as HTMLElement;

      expect(getComputedStyle(host).marginTop).toBe('0px');
      expect(getComputedStyle(host).marginBottom).toBe('0px');
      expect(host.getBoundingClientRect().height).toBe(0);
    });

    it('renders the V1 header and menus as before without context, even for menus with V4-only fields (AC-011, INV-001)', async () => {
      const v4Fields = {
        section: 'Workspace',
        badge: { value: 'NEW-7', tone: 'warning' as const },
        status: { label: 'Connected', tone: 'success' as const, live: true },
      };
      const soon: SdLayoutMenu = { id: 'soon', title: 'Soon', path: '/soon', permission: true, comingSoon: true, ...v4Fields };
      const v4Group: SdLayoutMenu = {
        id: 'v4-group',
        title: 'Group',
        icon: 'widgets',
        comingSoon: true,
        ...v4Fields,
        children: [{ ...orders, ...v4Fields }, soon],
      };
      await createWithContext({ menus: [v4Group] });
      component.expandMenuGroup(v4Group);
      fixture.detectChanges();

      for (const show of [false, true]) {
        fixture.componentRef.setInput('isShowSidebar', show);
        fixture.detectChanges();
        const header = q('.c-header')!;
        const titleGroup = q('.c-title-menu-group')!;
        expect(q('sd-layout-context-switcher')).withContext(`show=${show}`).toBeNull();
        expect(Array.from(header.children).map(child => child.classList[0])).toEqual(['c-logo', 'c-title-menu-group']);
        expect(Array.from(titleGroup.classList).filter(name => name.startsWith('c-title-menu-group--'))).toEqual([]);
        expect(titleGroup.children.length).toBe(1);
      }

      expect(context.syncItems).not.toHaveBeenCalled();
      expect(root().querySelector(':is(.c-header, .c-body) :is([class*="badge"], [class*="status"], [class*="section"])')).toBeNull();
      expect(root().textContent).not.toContain('Workspace');
      expect(root().textContent).not.toContain('NEW-7');
      expect(root().textContent).not.toContain('Connected');

      // comingSoon không có nghĩa gì ở V1 (D-005): mục vẫn là link điều hướng như cũ.
      const soonLink = Array.from(root().querySelectorAll<HTMLAnchorElement>('a.c-menu-node-description-content')).find(link =>
        link.textContent?.includes('Soon')
      )!;
      expect(soonLink.getAttribute('href')).toBe('/soon');
      expect(soonLink.hasAttribute('aria-disabled')).toBeFalse();
      soonLink.click();
      expect(router.navigate).toHaveBeenCalledWith(['/soon'], { queryParams: {}, state: { switchTab: true } });
    });
  });
});
