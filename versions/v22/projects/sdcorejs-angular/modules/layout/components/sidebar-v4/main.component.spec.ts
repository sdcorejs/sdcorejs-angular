import { OverlayContainer } from '@angular/cdk/overlay';
import { WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdLayoutContext, SidebarConfigurationV4 } from '../../configurations';
import {
  SdLayoutChildrenMenu,
  SdLayoutContextService,
  SdLayoutMenu,
  SdLayoutNavigationStateService,
  SdLayoutRootMenu,
  SdLayoutStorageService,
} from '../../services';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdSidebarV3 } from '../sidebar-v3/main.component';
import { SdSidebarV4 } from './main.component';

const overview: SdLayoutRootMenu = {
  id: 'overview',
  title: 'Tổng quan',
  path: '/overview',
  icon: 'space_dashboard',
  permission: true,
  section: 'Workspace',
};
const sales: SdLayoutRootMenu = {
  id: 'sales',
  title: 'Báo cáo bán hàng',
  path: '/reports/sales',
  queryParams: { view: 'month' },
  icon: 'bar_chart',
  permission: true,
  section: 'Workspace',
};
const members: SdLayoutRootMenu = { id: 'members', title: 'Thành viên', path: '/settings/members', permission: true };
const stock: SdLayoutRootMenu = { id: 'stock', title: 'Báo cáo tồn kho', path: '/settings/stock', permission: true };
// comingSoon: hiện trong cây nhưng không bao giờ có trong kết quả search (AC-004)
const gitlab: SdLayoutRootMenu = { id: 'gitlab', title: 'Báo cáo GitLab', path: '/settings/gitlab', permission: true, comingSoon: true };
const settings: SdLayoutChildrenMenu = {
  id: 'settings',
  title: 'Cài đặt',
  icon: 'settings',
  section: 'Project',
  children: [members, stock, gitlab],
};
const docs: SdLayoutRootMenu = { id: 'docs', title: 'Tài liệu', path: '/help/docs', permission: true };
const help: SdLayoutChildrenMenu = { id: 'help', title: 'Trợ giúp', icon: 'help', section: 'Project', children: [docs] };
const menus: SdLayoutMenu[] = [overview, sales, settings, help];

const contexts: SdLayoutContext[] = [
  { id: 'hq', title: 'Head Office', subtitle: 'Owner' },
  { id: 'north', title: 'North Branch', subtitle: 'Manager' },
];

interface ContextServiceStub {
  current: WritableSignal<SdLayoutContext | null>;
  items: WritableSignal<readonly SdLayoutContext[]>;
  switchingId: WritableSignal<string | null>;
  switchFailed: WritableSignal<boolean>;
  changedElsewhere: WritableSignal<boolean>;
  syncItems: jasmine.Spy;
  setCurrentContext: jasmine.Spy;
  reload: jasmine.Spy;
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
  };
  stub.syncItems.and.callFake((items: readonly SdLayoutContext[] | null | undefined) => {
    const list = items ?? [];
    stub.items.set(list);
    if (!stub.current() && list.length) stub.current.set(list[0]);
  });
  return stub;
}

const isApplePlatform = /mac|iphone|ipad|ipod/i.test(
  (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || ''
);

/** Ctrl+K, or ⌘K on Apple platforms — the shortcut the sidebar listens for on the current platform. */
function shortcut(init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {
    key: 'k',
    ctrlKey: !isApplePlatform,
    metaKey: isApplePlatform,
    bubbles: true,
    cancelable: true,
    ...init,
  });
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

describe('SdSidebarV4', () => {
  let fixture: ComponentFixture<SdSidebarV4>;
  let context: ContextServiceStub;

  async function configure(): Promise<void> {
    localStorage.clear();
    context = createContextStub();
    await TestBed.configureTestingModule({
      imports: [SdSidebarV4, SdSidebarV3],
      providers: [provideRouter([]), { provide: SdLayoutContextService, useValue: context }],
    }).compileComponents();
    // why: setLanguage ghi localStorage nên spec chạy trước có thể để lại ngôn ngữ khác; chốt 'en' trước khi dựng fixture.
    TestBed.inject(I18nService).setLanguage('en', { reload: false });
  }

  beforeEach(configure);

  afterEach(() => TestBed.inject(I18nService).setLanguage('vi', { reload: false }));

  function create(sidebar: Partial<SidebarConfigurationV4> = {}, items: SdLayoutMenu[] = menus): void {
    fixture = TestBed.createComponent(SdSidebarV4);
    fixture.componentRef.setInput('menus', items);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User' });
    fixture.componentRef.setInput('sidebar', { version: 4, ...sidebar });
    fixture.detectChanges();
  }

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const q = <T extends HTMLElement = HTMLElement>(selector: string): T | null => host().querySelector<T>(selector);
  const qa = (selector: string): HTMLElement[] => Array.from(host().querySelectorAll<HTMLElement>(selector));
  const text = (element: Element | null | undefined): string => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const hostVariable = (name: string): string => getComputedStyle(host()).getPropertyValue(name).trim();
  const overlayRoot = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();
  const storage = (): SdLayoutStorageService => TestBed.inject(SdLayoutStorageService);
  const searchInput = (): HTMLInputElement | null => q<HTMLInputElement>('[data-v4-search-input]');
  const group = (key: string): HTMLButtonElement | null => q<HTMLButtonElement>(`[data-v4-tree] [data-menu-group="${key}"]`);
  const row = (key: string): HTMLButtonElement | null => q<HTMLButtonElement>(`[data-v4-tree] [data-menu-key="${key}"]`);
  const resultKeys = (): string[] => qa('[data-v4-result]').map(option => option.getAttribute('data-menu-key') ?? '');

  function type(value: string): void {
    const input = searchInput() as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function press(key: string): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    (searchInput() as HTMLInputElement).dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  describe('header and layout (R-001, R-005)', () => {
    it('renders the logo initial, the default title and a labelled collapse button', () => {
      create();

      expect(text(q('[data-v4-logo]'))).toBe('B');
      expect(text(q('[data-v4-title]'))).toBe('Back Office');
      const toggle = q<HTMLButtonElement>('[data-v4-toggle]') as HTMLButtonElement;
      expect(toggle.type).toBe('button');
      expect(toggle.getAttribute('aria-label')).toBe('Collapse sidebar');
      expect(toggle.getAttribute('aria-expanded')).toBe('true');
      expect(q('nav[data-v4-nav]')?.getAttribute('aria-label')).toBe('Primary navigation');
      expect(q('main[data-v4-content]')).not.toBeNull();
    });

    it('shows the configured logo image and title', () => {
      create({ defaultTitle: 'Orkestr', logoUrl: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });

      expect(q('[data-v4-logo] img')?.getAttribute('src')).toContain('data:image/gif');
      expect(text(q('[data-v4-title]'))).toBe('Orkestr');
    });

    it('measures a 280px drawer and offsets the content by the same width (R-005)', () => {
      create();

      expect(q('[data-v4-sidebar]')?.getBoundingClientRect().width).toBe(280);
      expect(getComputedStyle(q('[data-v4-content]') as HTMLElement).marginLeft).toBe('280px');
    });

    it('keeps the account popup inside the expanded drawer, 12px from each edge', () => {
      // why: target Karma không nạp utility class toàn cục; khai lại các class mà popup tài khoản dùng cho vị trí và kích thước.
      const utilities = document.createElement('style');
      utilities.textContent = `
        .position-relative { position: relative !important; }
        .p-8 { padding: 8px !important; }
        .border { border: 1px solid currentColor !important; }
      `;
      document.head.appendChild(utilities);
      try {
        create();
        (q('[data-user-trigger]') as HTMLButtonElement).click();
        fixture.detectChanges();

        const popup = (q('[data-user-menu]') as HTMLElement).getBoundingClientRect();
        const drawer = (q('[data-v4-sidebar]') as HTMLElement).getBoundingClientRect();
        expect(popup.right).toBeLessThanOrEqual(drawer.right);
        expect(popup.left).toBeCloseTo(drawer.left + 12, 0);
        expect(popup.right).toBeCloseTo(drawer.right - 12, 0);
      } finally {
        utilities.remove();
      }
    });

    it('declares the size tokens on the host with pill and compact defaults (AC-008)', () => {
      create();

      expect(host().classList).toContain('sd-sidebar-v4');
      expect(host().classList).not.toContain('sd-sidebar-v4--soft');
      expect(host().classList).not.toContain('sd-sidebar-v4--comfortable');
      expect(hostVariable('--sd-sidebar-v4-width')).toBe('280px');
      expect(hostVariable('--sd-sidebar-v4-rail-width')).toBe('72px');
      expect(hostVariable('--sd-sidebar-v4-item-height')).toBe('36px');
      expect(hostVariable('--sd-sidebar-v4-child-height')).toBe('32px');
      expect(hostVariable('--sd-sidebar-v4-item-radius')).toBe('999px');
      const root = getComputedStyle(row('id:overview') as HTMLElement);
      expect(root.minHeight).toBe('36px');
      expect(root.borderTopLeftRadius).toBe('999px');
      expect(getComputedStyle(row('id:members') as HTMLElement).minHeight).toBe('32px');
    });

    it('switches radius and row heights through the soft and comfortable modifiers (AC-008)', () => {
      create({ itemShape: 'soft', density: 'comfortable' });

      expect(host().classList).toContain('sd-sidebar-v4--soft');
      expect(host().classList).toContain('sd-sidebar-v4--comfortable');
      expect(hostVariable('--sd-sidebar-v4-item-radius')).toBe('8px');
      expect(hostVariable('--sd-sidebar-v4-item-height')).toBe('40px');
      expect(hostVariable('--sd-sidebar-v4-child-height')).toBe('34px');
      const root = getComputedStyle(row('id:overview') as HTMLElement);
      expect(root.minHeight).toBe('40px');
      expect(root.borderTopLeftRadius).toBe('8px');
      expect(getComputedStyle(row('id:members') as HTMLElement).minHeight).toBe('34px');
    });

    it('raises rows and controls to 44px under a coarse pointer, also when comfortable (AC-008)', () => {
      create({ density: 'comfortable' });

      simulateCoarsePointer(host());
      const toggle = q('[data-v4-toggle]') as HTMLElement;
      simulateCoarsePointer(toggle);

      expect(hostVariable('--sd-sidebar-v4-item-height')).toBe('44px');
      expect(hostVariable('--sd-sidebar-v4-child-height')).toBe('44px');
      expect(getComputedStyle(row('id:overview') as HTMLElement).minHeight).toBe('44px');
      expect(getComputedStyle(row('id:members') as HTMLElement).minHeight).toBe('44px');
      expect(toggle.getBoundingClientRect().height).toBe(44);
    });
  });

  describe('navigation (AC-002)', () => {
    it('navigates root and child rows like V3 and records them as recent', () => {
      create();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const state = TestBed.inject(SdLayoutNavigationStateService);

      row('id:sales')?.click();
      expect(navigate).toHaveBeenCalledWith(['/reports/sales'], { queryParams: { view: 'month' }, state: { switchTab: true } });
      expect(state.recentKeys()[0]).toBe('id:sales');

      row('id:members')?.click();
      expect(navigate).toHaveBeenCalledWith(['/settings/members'], { queryParams: {}, state: { switchTab: true } });
      expect(state.recentKeys()).toEqual(['id:members', 'id:sales']);
    });

    it('opens an absolute http(s) menu with noopener,noreferrer and never a javascript: url', () => {
      const portal: SdLayoutRootMenu = { id: 'portal', title: 'Portal', path: 'https://example.com/portal', permission: true };
      create({}, [...menus, portal]);
      const windowOpen = spyOn(window, 'open');
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      row('id:portal')?.click();
      expect(windowOpen).toHaveBeenCalledWith('https://example.com/portal', '_blank', 'noopener,noreferrer');
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

    it('reveals only the branch holding the active route; a branch the user closes stays closed until the route changes', async () => {
      create();
      for (const key of ['id:settings', 'id:help']) {
        group(key)?.click();
        fixture.detectChanges();
      }
      expect(group('id:settings')?.getAttribute('aria-expanded')).toBe('false');
      expect(group('id:help')?.getAttribute('aria-expanded')).toBe('false');

      const router = TestBed.inject(Router);
      router.resetConfig([{ path: 'settings/:id', children: [] }]);
      await router.navigateByUrl('/settings/stock?tab=1#top');
      fixture.detectChanges();

      expect(group('id:settings')?.getAttribute('aria-expanded')).toBe('true');
      expect(row('id:stock')?.getAttribute('aria-current')).toBe('page');
      expect(group('id:help')?.getAttribute('aria-expanded')).toBe('false');

      group('id:settings')?.click();
      fixture.detectChanges();
      expect(row('id:stock')).toBeNull();
      expect(group('id:settings')?.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('collapse state (AC-003)', () => {
    it('stores the collapsed state in the version 3 entry and restores it on re-creation (D-004)', () => {
      create();
      const patch = spyOn(TestBed.inject(SdLayoutNavigationStateService), 'patchVersionState').and.callThrough();

      q('[data-v4-toggle]')?.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.isCollapsed()).toBeTrue();
      expect(patch).toHaveBeenCalledWith(3, { collapsed: true });
      expect(storage().readVersionState(3).collapsed).toBeTrue();
      expect(Object.keys(storage().versionStates.get() ?? {})).toEqual(['3']);

      fixture.destroy();
      create();
      expect(fixture.componentInstance.isCollapsed()).toBeTrue();
      expect(q('[data-v4-sidebar]')?.getAttribute('data-collapsed')).toBe('true');
    });

    it('uses defaultCollapsed when nothing is stored, and a stored choice wins over it', () => {
      create({ defaultCollapsed: true });
      expect(fixture.componentInstance.isCollapsed()).toBeTrue();
      fixture.destroy();

      storage().patchVersionState(3, { collapsed: false });
      create({ defaultCollapsed: true });
      expect(fixture.componentInstance.isCollapsed()).toBeFalse();
    });

    // why: mỗi sidebar chạy trong injector mới — handle storage giữ giá trị trong bộ nhớ nên lần chạy thứ hai sẽ bỏ qua
    // lần ghi khởi tạo và làm lệch tập key.
    it('writes the same storage keys as V3 when collapsing', async () => {
      localStorage.clear();
      create();
      fixture.componentInstance.toggleCollapsed();
      fixture.detectChanges();
      expect(fixture.componentInstance.isCollapsed()).toBeTrue();
      const v4Keys = Object.keys(localStorage).sort();

      TestBed.resetTestingModule();
      await configure();
      localStorage.clear();
      const v3 = TestBed.createComponent(SdSidebarV3);
      v3.componentRef.setInput('menus', menus);
      v3.componentRef.setInput('userInfo', { fullName: 'Demo User' });
      v3.componentRef.setInput('sidebar', { version: 3 });
      v3.detectChanges();
      v3.componentInstance.toggleCollapsed();
      v3.detectChanges();
      expect(v3.componentInstance.isCollapsed()).toBeTrue();
      const v3Keys = Object.keys(localStorage).sort();

      expect(v3Keys.length).toBeGreaterThan(0);
      expect(v4Keys).toEqual(v3Keys);
    });
  });

  describe('search (AC-004)', () => {
    it('focuses the search with the platform shortcut and shows its hint', () => {
      create();
      (document.activeElement as HTMLElement | null)?.blur();

      const event = shortcut();
      document.body.dispatchEvent(event);
      fixture.detectChanges();

      expect(event.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(searchInput());
      expect(text(q('[data-v4-search-shortcut]'))).toBe(isApplePlatform ? '⌘K' : 'Ctrl K');
      expect(q('[data-v4-search-shortcut]')?.getAttribute('aria-hidden')).toBe('true');
      expect(searchInput()?.getAttribute('aria-keyshortcuts')).toBe(isApplePlatform ? 'Meta+K' : 'Control+K');
      expect(searchInput()?.placeholder).toBe('Search menu');
    });

    it('expands a collapsed rail before focusing the search and stores the expanded state', () => {
      create({ defaultCollapsed: true });
      expect(searchInput()).toBeNull();

      document.body.dispatchEvent(shortcut());
      fixture.detectChanges();

      expect(fixture.componentInstance.isCollapsed()).toBeFalse();
      expect(storage().readVersionState(3).collapsed).toBeFalse();
      expect(document.activeElement).toBe(searchInput());
    });

    it('ignores the shortcut when the event was already handled or does not match', () => {
      create();
      (document.activeElement as HTMLElement | null)?.blur();
      const block = (event: Event): void => event.preventDefault();
      document.body.addEventListener('keydown', block);
      try {
        document.body.dispatchEvent(shortcut());
        fixture.detectChanges();
        expect(document.activeElement).not.toBe(searchInput());
      } finally {
        document.body.removeEventListener('keydown', block);
      }

      const ignored: [string, KeyboardEvent][] = [
        ['plain K', new KeyboardEvent('keydown', { key: 'k', bubbles: true, cancelable: true })],
        ['Shift+K', shortcut({ shiftKey: true })],
        ['Alt+K', shortcut({ altKey: true })],
        // ⌘K ngoài nền tảng Apple (và Ctrl+K trên Apple) không phải phím tắt của nền tảng đó.
        ['other platform modifier', shortcut({ ctrlKey: isApplePlatform, metaKey: !isApplePlatform })],
        ['both modifiers', shortcut({ ctrlKey: true, metaKey: true })],
        ['another key', shortcut({ key: 'j', code: 'KeyJ' })],
        // Colemak/Dvorak: chữ Latin khác 'k' nằm ở vị trí KeyK — không chiếm Ctrl/⌘+E của bố cục đó.
        ['Latin letter on the K position', shortcut({ key: 'e', code: 'KeyK' })],
      ];
      for (const [label, event] of ignored) {
        document.body.dispatchEvent(event);
        fixture.detectChanges();
        expect(event.defaultPrevented).withContext(label).toBeFalse();
      }
      expect(document.activeElement).not.toBe(searchInput());
    });

    it('accepts the physical K key on a non-Latin keyboard layout', () => {
      create();
      (document.activeElement as HTMLElement | null)?.blur();

      const event = shortcut({ key: 'л', code: 'KeyK' });
      document.body.dispatchEvent(event);
      fixture.detectChanges();

      expect(event.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(searchInput());
    });

    it('leaves the shortcut alone while focus is in a modal dialog or a CDK overlay', () => {
      create();
      const dialog = document.createElement('div');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      const dialogButton = dialog.appendChild(document.createElement('button'));
      document.body.appendChild(dialog);
      const overlayButton = overlayRoot().appendChild(document.createElement('button'));
      try {
        for (const [label, target] of [
          ['aria-modal dialog', dialogButton],
          ['CDK overlay', overlayButton],
        ] as const) {
          target.focus();
          const event = shortcut();
          target.dispatchEvent(event);
          fixture.detectChanges();
          expect(event.defaultPrevented).withContext(label).toBeFalse();
          expect(document.activeElement).withContext(label).toBe(target);
        }
      } finally {
        dialog.remove();
        overlayButton.remove();
      }
    });

    it('lists accent-insensitive results without comingSoon items and preselects the first one', () => {
      create();

      type('bao cao');

      expect(resultKeys()).toEqual(['id:sales', 'id:stock']);
      expect(text(q('[data-v4-result-count]'))).toBe('2 results');
      const input = searchInput() as HTMLInputElement;
      const options = qa('[data-v4-result]');
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.getAttribute('aria-controls')).toBe(q('[data-v4-results]')?.id ?? 'missing');
      expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
      expect(options[0].getAttribute('aria-selected')).toBe('true');
      expect(group('id:settings')).toBeNull();
      expect(q('[data-v4-search-shortcut]')).toBeNull();
      expect(q('[data-v4-search-clear]')?.getAttribute('aria-label')).toBe('Clear search');
      expect(q('[data-v4-search-field]')?.classList).toContain('sd-sidebar-v4__search-field--filled');
    });

    it('moves the selection with the arrow keys, opens it with Enter and clears the query with Escape', () => {
      create();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      type('bao cao');
      const input = searchInput() as HTMLInputElement;
      const option = (index: number): HTMLElement => qa('[data-v4-result]')[index];

      expect(press('ArrowDown').defaultPrevented).toBeTrue();
      expect(input.getAttribute('aria-activedescendant')).toBe(option(1).id);
      expect(option(1).getAttribute('aria-selected')).toBe('true');
      expect(option(0).getAttribute('aria-selected')).toBe('false');
      press('ArrowDown');
      expect(input.getAttribute('aria-activedescendant')).toBe(option(1).id);
      press('ArrowUp');
      press('ArrowUp');
      expect(input.getAttribute('aria-activedescendant')).toBe(option(0).id);

      press('ArrowDown');
      expect(press('Enter').defaultPrevented).toBeTrue();
      expect(navigate).toHaveBeenCalledOnceWith(['/settings/stock'], { queryParams: {}, state: { switchTab: true } });

      expect(press('Escape').defaultPrevented).toBeTrue();
      expect(input.value).toBe('');
      expect(fixture.componentInstance.searchText()).toBe('');
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.getAttribute('aria-activedescendant')).toBeNull();
      expect(q('[data-v4-results]')).toBeNull();
      expect(group('id:settings')).not.toBeNull();
      expect(press('Escape').defaultPrevented).toBeFalse();
    });

    it('renders the empty state as a collapsed combobox without an active option', () => {
      create();

      type('zzz');

      expect(text(q('[data-v4-empty]'))).toContain('zzz');
      expect(text(q('[data-v4-result-count]'))).toBe('0 results');
      const input = searchInput() as HTMLInputElement;
      expect(input.getAttribute('aria-expanded')).toBe('false');
      expect(input.getAttribute('aria-controls')).toBeNull();
      expect(input.getAttribute('aria-activedescendant')).toBeNull();
      expect(press('ArrowDown').defaultPrevented).toBeFalse();
      expect(press('Enter').defaultPrevented).toBeFalse();
    });

    it('keeps the keyboard-selected result inside the visible list and starts a new query from the top', () => {
      const catalog: SdLayoutRootMenu[] = Array.from({ length: 30 }, (_, index) => ({
        id: `item-${index}`,
        title: `Item ${index}`,
        path: `/items/${index}`,
        permission: true,
        section: 'Catalog',
      }));
      create({}, catalog);
      // why: transform giữ drawer `position: fixed` trong host cao 420px để list chắc chắn phải cuộn.
      host().style.cssText = 'display:block; position:relative; width:1024px; height:420px; min-height:0; transform:translateZ(0)';
      type('item');
      const list = q('[data-v4-nav]') as HTMLElement;
      const input = searchInput() as HTMLInputElement;
      const options = (): HTMLElement[] => qa('[data-v4-result]');
      const selected = (): HTMLElement => document.getElementById(input.getAttribute('aria-activedescendant') ?? '') as HTMLElement;
      const isVisible = (option: HTMLElement): boolean => {
        const box = option.getBoundingClientRect();
        const view = list.getBoundingClientRect();
        return box.top >= view.top - 1 && box.bottom <= view.bottom + 1;
      };
      expect(list.scrollHeight).toBeGreaterThan(list.clientHeight);

      for (let step = 0; step < 20; step++) press('ArrowDown');
      expect(selected()).toBe(options()[20]);
      expect(list.scrollTop).toBeGreaterThan(0);
      expect(isVisible(selected())).toBeTrue();

      for (let step = 0; step < 20; step++) press('ArrowUp');
      expect(selected()).toBe(options()[0]);
      expect(isVisible(selected())).toBeTrue();

      for (let step = 0; step < 25; step++) press('ArrowDown');
      expect(list.scrollTop).toBeGreaterThan(0);
      type('item 2');
      expect(list.scrollTop).toBe(0);
      expect(selected()).toBe(options()[0]);
      expect(isVisible(selected())).toBeTrue();

      // Xoá query bằng Esc hoặc nút clear: cây hiện lại từ đầu list.
      type('item');
      for (let step = 0; step < 25; step++) press('ArrowDown');
      expect(list.scrollTop).toBeGreaterThan(0);
      press('Escape');
      expect(list.scrollTop).toBe(0);

      type('item');
      for (let step = 0; step < 25; step++) press('ArrowDown');
      expect(list.scrollTop).toBeGreaterThan(0);
      q('[data-v4-search-clear]')?.click();
      fixture.detectChanges();
      expect(list.scrollTop).toBe(0);
    });

    it('hides the shortcut hint under a coarse pointer', () => {
      create();
      const hint = q('[data-v4-search-shortcut]') as HTMLElement;
      expect(getComputedStyle(hint).display).not.toBe('none');

      simulateCoarsePointer(hint);

      expect(getComputedStyle(hint).display).toBe('none');
    });

    it('clears the query from the clear button and keeps focus in the search', () => {
      create();
      type('bao');

      q('[data-v4-search-clear]')?.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.searchText()).toBe('');
      expect(document.activeElement).toBe(searchInput());
      expect(q('[data-v4-search-clear]')).toBeNull();
      expect(q('[data-v4-search-shortcut]')).not.toBeNull();
    });
  });

  describe('collapsed rail (AC-005)', () => {
    it('renders a 72px rail with the logo, the expand and search buttons and the compact account', () => {
      create({ defaultCollapsed: true });

      expect(host().classList).toContain('sd-sidebar-v4--collapsed');
      expect(q('[data-v4-sidebar]')?.getBoundingClientRect().width).toBe(72);
      expect(getComputedStyle(q('[data-v4-content]') as HTMLElement).marginLeft).toBe('72px');
      expect(q('[data-v4-logo]')).not.toBeNull();
      expect(q('[data-v4-title]')).toBeNull();
      expect(searchInput()).toBeNull();
      const toggle = q<HTMLButtonElement>('[data-v4-toggle]') as HTMLButtonElement;
      expect(toggle.getAttribute('aria-label')).toBe('Expand sidebar');
      expect(toggle.getAttribute('aria-expanded')).toBe('false');
      expect(q('[data-v4-rail-search]')?.getAttribute('aria-label')).toBe('Search menu');
      expect(q('nav[data-v4-nav] [data-v4-rail]')).not.toBeNull();
      expect(q('[data-v4-rail-item="id:settings"]')).not.toBeNull();
      expect(q('[data-user-trigger]')?.classList).toContain('sd-layout-user-menu__trigger--compact');

      toggle.focus();
      toggle.click();
      fixture.detectChanges();
      expect(q('[data-v4-toggle]')).toBe(toggle);
      expect(document.activeElement).toBe(toggle);
      expect(toggle.getAttribute('aria-label')).toBe('Collapse sidebar');
    });

    it('opens the tree flyout for a rail group by default', () => {
      create({ defaultCollapsed: true });

      q('[data-v4-rail-item="id:settings"]')?.click();
      fixture.detectChanges();

      expect(overlayRoot().querySelector('[data-v4-flyout]')).not.toBeNull();
      expect(fixture.componentInstance.isCollapsed()).toBeTrue();
    });

    it("expands the drawer and opens the group when collapsedGroup is 'expand'", () => {
      create({ collapsedGroup: 'expand' });
      group('id:settings')?.click();
      fixture.detectChanges();
      fixture.componentInstance.toggleCollapsed();
      fixture.detectChanges();

      q('[data-v4-rail-item="id:settings"]')?.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.isCollapsed()).toBeFalse();
      expect(storage().readVersionState(3).collapsed).toBeFalse();
      expect(group('id:settings')?.getAttribute('aria-expanded')).toBe('true');
      expect(overlayRoot().querySelector('[data-v4-flyout]')).toBeNull();
    });

    it('expands and focuses the search from the rail search button', () => {
      create({ defaultCollapsed: true });

      q('[data-v4-rail-search]')?.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.isCollapsed()).toBeFalse();
      expect(document.activeElement).toBe(searchInput());
    });
  });

  describe('sections (D-003, AC-007)', () => {
    it('renders Pinned and Recent with headings, hides them while searching and has no All menu heading', () => {
      create();
      spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      TestBed.inject(SdLayoutNavigationStateService).togglePinned(overview);
      fixture.componentInstance.navigateMenu(stock);
      fixture.detectChanges();

      expect(qa('h2').map(heading => text(heading))).toEqual(['Pinned', 'Recent']);
      expect(text(q('[data-v4-pinned] [data-menu-key="id:overview"]'))).toContain('Tổng quan · Workspace');
      expect(q('[data-v4-pinned] [data-pin-key="id:overview"]')).not.toBeNull();
      expect(text(q('[data-v4-recent] [data-menu-key="id:stock"]'))).toContain('Báo cáo tồn kho · Cài đặt');
      expect(q('[data-v4-recent] [data-pin-key]')).toBeNull();
      expect(qa('[data-v4-tree] [data-v4-section-label]').map(label => text(label))).toEqual(['Workspace', 'Project']);
      expect(text(host())).not.toContain('All menus');

      type('bao');
      expect(q('[data-v4-pinned]')).toBeNull();
      expect(q('[data-v4-recent]')).toBeNull();
    });

    it('hides Recent when recent is disabled', () => {
      create({ recent: { enabled: false } });
      spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      fixture.componentInstance.navigateMenu(stock);
      fixture.detectChanges();

      expect(q('[data-v4-recent]')).toBeNull();
    });

    it('spaces a leading unsectioned group away from the shortcut sections', () => {
      const unsectioned: SdLayoutRootMenu = { id: 'home', title: 'Home', path: '/home', icon: 'home', permission: true };
      create({}, [unsectioned, ...menus]);
      const tree = q('[data-v4-tree]') as HTMLElement;
      expect(getComputedStyle(tree).marginTop).toBe('0px');

      TestBed.inject(SdLayoutNavigationStateService).togglePinned(overview);
      fixture.detectChanges();

      expect(getComputedStyle(tree).marginTop).toBe('16px');
    });
  });

  describe('context switcher (AC-018, R-008)', () => {
    const switcher = () => fixture.debugElement.query(By.directive(SdLayoutContextSwitcher));

    it('renders the header switcher under the title, anchored to the header, with a popover 24px narrower than the drawer', async () => {
      create({ context: { items: contexts } });
      const header = q('[data-v4-header]') as HTMLElement;
      const instance = switcher()?.componentInstance as SdLayoutContextSwitcher;

      expect(instance.appearance()).toBe('header');
      expect(instance.anchor()).toBe(header);
      expect(q('[data-v4-title]')?.nextElementSibling).toBe(switcher().nativeElement);
      expect(context.syncItems).toHaveBeenCalledWith(contexts);

      q('[data-context-trigger]')?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const popover = overlayRoot().querySelector<HTMLElement>('[data-context-popover]') as HTMLElement;
      expect(getComputedStyle(popover).width).toBe('256px');
      expect(popover.getBoundingClientRect().left).toBeCloseTo(header.getBoundingClientRect().left + 12, 0);
    });

    it('gives the whole header the hover background while the header switcher is open (README CS1)', async () => {
      // why: Karma không nạp theme — khai --sd-text để nền hover (color-mix) có giá trị thật mà so.
      document.documentElement.style.setProperty('--sd-text', 'rgb(26, 27, 31)');
      try {
        create({ context: { items: contexts } });
        const header = q('[data-v4-header]') as HTMLElement;
        const trigger = q('[data-context-trigger]') as HTMLElement;
        // why: transition nền 120ms làm màu đọc ngay sau khi mở vẫn là màu cũ (trong suốt) dù rule sai — tắt để phép so có nghĩa.
        trigger.style.transition = 'none';
        expect(header.classList).not.toContain('sd-sidebar-v4__header--context-open');

        trigger.click();
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        expect(header.classList).toContain('sd-sidebar-v4__header--context-open');
        expect(getComputedStyle(header).borderTopLeftRadius).toBe('12px');
        expect(getComputedStyle(header).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        // Chỉ một lớp nền: trigger đang mở không tô chồng lên nền header.
        expect(getComputedStyle(trigger).backgroundColor).toBe('rgba(0, 0, 0, 0)');

        (switcher().componentInstance as SdLayoutContextSwitcher).close(false);
        fixture.detectChanges();
        expect(header.classList).not.toContain('sd-sidebar-v4__header--context-open');
      } finally {
        document.documentElement.style.removeProperty('--sd-text');
      }
    });

    it('renders the rail switcher at the top of the collapsed rail and opens its popover to the right of the drawer', async () => {
      create({ defaultCollapsed: true, context: { items: contexts } });
      const instance = switcher()?.componentInstance as SdLayoutContextSwitcher;
      const aside = q('[data-v4-sidebar]') as HTMLElement;

      expect(instance.appearance()).toBe('rail');
      expect(instance.anchor()).toBe(aside);
      expect(q('[data-v4-logo]')?.nextElementSibling).toBe(switcher().nativeElement);
      expect(getComputedStyle(switcher().nativeElement).marginBottom).toBe('12px');

      q('[data-context-trigger]')?.click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const popover = overlayRoot().querySelector<HTMLElement>('[data-context-popover]') as HTMLElement;
      const asideRight = aside.getBoundingClientRect().right;
      expect(popover.getBoundingClientRect().left).toBeGreaterThanOrEqual(asideRight);
      expect(popover.getBoundingClientRect().left).toBeCloseTo(asideRight + 8, 0);
    });

    it('rings the rail notice dot with the V4 sidebar background', () => {
      document.documentElement.style.setProperty('--sd-sidebar-v4-bg', 'rgb(243, 244, 247)');
      try {
        create({ defaultCollapsed: true, context: { items: contexts } });

        expect(hostVariable('--sd-layout-context-switcher-dot-ring-color')).toBe('rgb(243, 244, 247)');
      } finally {
        document.documentElement.style.removeProperty('--sd-sidebar-v4-bg');
      }
    });

    it('leaves no gap on the rail for a switcher that renders nothing', () => {
      create({ defaultCollapsed: true });
      const baseline = (q('[data-v4-toggle]') as HTMLElement).getBoundingClientRect().top;
      fixture.destroy();

      create({ defaultCollapsed: true, context: { items: [] } });

      const empty = switcher().nativeElement as HTMLElement;
      expect(getComputedStyle(empty).marginTop).toBe('0px');
      expect(getComputedStyle(empty).marginBottom).toBe('0px');
      expect((q('[data-v4-toggle]') as HTMLElement).getBoundingClientRect().top).toBe(baseline);
    });

    it('renders no switcher without context, expanded or collapsed', () => {
      create();
      expect(q('sd-layout-context-switcher')).toBeNull();

      fixture.componentInstance.toggleCollapsed();
      fixture.detectChanges();

      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(context.syncItems).not.toHaveBeenCalled();
    });
  });
});
