import { ChangeDetectionStrategy as SdAngular22ChangeDetectionStrategy } from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { OverlayContainer } from '@angular/cdk/overlay';
import { Component, WritableSignal, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, Routes, provideRouter } from '@angular/router';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdLayoutContext, SidebarConfigurationV4 } from '../../configurations';
import {
  SdLayoutChildrenMenu,
  SdLayoutContextService,
  SdLayoutMenu,
  SdLayoutNavigationStateService,
  SdLayoutRootMenu,
} from '../../services';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdSidebarV4MenuTree } from '../sidebar-v4/menu-tree/sidebar-v4-menu-tree.component';
import { SdSidebarMobileV4 } from './main.component';

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
  tooltipTitle: 'Bán hàng',
  path: '/reports/sales',
  queryParams: { view: 'month' },
  icon: 'bar_chart',
  permission: true,
  section: 'Workspace',
};
const approvals: SdLayoutRootMenu = {
  id: 'approvals',
  title: 'Phê duyệt',
  path: '/approvals',
  icon: 'approval',
  permission: true,
  section: 'Execution',
  badge: { value: 3, tone: 'warning' },
};
const runs: SdLayoutRootMenu = {
  id: 'runs',
  title: 'Lượt chạy',
  path: '/runs',
  icon: 'memory',
  permission: true,
  section: 'Execution',
  status: { label: '1 đang chạy', tone: 'success', live: true },
};
const members: SdLayoutRootMenu = { id: 'members', title: 'Thành viên', path: '/settings/members', permission: true };
const stock: SdLayoutRootMenu = { id: 'stock', title: 'Báo cáo tồn kho', path: '/settings/stock', permission: true };
const gitlab: SdLayoutRootMenu = { id: 'gitlab', title: 'GitLab', path: '/settings/gitlab', permission: true, comingSoon: true };
const settings: SdLayoutChildrenMenu = {
  id: 'settings',
  title: 'Cài đặt',
  icon: 'settings',
  section: 'Project',
  children: [members, stock, gitlab],
};
const menus: SdLayoutMenu[] = [overview, sales, approvals, runs, settings];

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

// why: Karma không nạp theme — khai các token gốc mà đường viền / shadow (color-mix) của V4 dựng từ đó, để có giá trị thật mà đo.
const THEME_TOKENS: Record<string, string> = {
  '--sd-text': 'rgb(26, 27, 31)',
  '--sd-border': 'rgb(196, 198, 208)',
  '--sd-surface': 'rgb(255, 255, 255)',
  '--sd-primary': 'rgb(0, 92, 187)',
  '--sd-primary-light': 'rgb(219, 232, 245)',
};

@Component({
  changeDetection: SdAngular22ChangeDetectionStrategy.Eager,
  standalone: true,
  template: '',
})
class BlankPage {}

// Route thật cho NavigationEnd / NavigationSkipped / NavigationCancel (guard từ chối '/blocked').
const routes: Routes = [
  { path: 'blocked', canActivate: [() => false], component: BlankPage },
  { path: '**', component: BlankPage },
];

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

describe('SdSidebarMobileV4', () => {
  let fixture: ComponentFixture<SdSidebarMobileV4>;
  let context: ContextServiceStub;
  /** How many times the context service was created; it must stay 0 for apps without `context`. */
  let contextServiceCreations: number;

  beforeEach(async () => {
    localStorage.clear();
    document.body.style.overflow = '';
    for (const [name, value] of Object.entries(THEME_TOKENS)) document.documentElement.style.setProperty(name, value);
    context = createContextStub();
    contextServiceCreations = 0;
    await TestBed.configureTestingModule({
      imports: [SdSidebarMobileV4],
      providers: [
        provideRouter(routes),
        {
          provide: SdLayoutContextService,
          useFactory: () => {
            contextServiceCreations++;
            return context;
          },
        },
      ],
    }).compileComponents();
    // why: setLanguage ghi localStorage nên spec chạy trước có thể để lại ngôn ngữ khác; chốt 'en' trước khi dựng fixture.
    TestBed.inject(I18nService).setLanguage('en', { reload: false });
  });

  afterEach(() => {
    document.body.style.overflow = '';
    for (const name of Object.keys(THEME_TOKENS)) document.documentElement.style.removeProperty(name);
    TestBed.inject(I18nService).setLanguage('vi', { reload: false });
  });

  function create(sidebar: Partial<SidebarConfigurationV4> = {}, items: SdLayoutMenu[] = menus): void {
    fixture = TestBed.createComponent(SdSidebarMobileV4);
    fixture.componentRef.setInput('menus', items);
    fixture.componentRef.setInput('userInfo', { fullName: 'Demo User', role: { text: 'Operator' } });
    fixture.componentRef.setInput('sidebar', { version: 4, ...sidebar });
    fixture.detectChanges();
  }

  const host = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const q = <T extends HTMLElement = HTMLElement>(selector: string): T | null => host().querySelector<T>(selector);
  const qa = (selector: string): HTMLElement[] => Array.from(host().querySelectorAll<HTMLElement>(selector));
  const text = (element: Element | null | undefined): string => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();
  const height = (element: Element | null): number => Math.round(element?.getBoundingClientRect().height ?? -1);
  const width = (element: Element | null): number => Math.round(element?.getBoundingClientRect().width ?? -1);
  const menuTrigger = (): HTMLButtonElement => q<HTMLButtonElement>('[data-v4m-menu-trigger]') as HTMLButtonElement;
  const drawer = (): HTMLElement | null => q('[data-v4m-drawer]');
  const searchInput = (): HTMLInputElement | null => q<HTMLInputElement>('[data-v4m-search-input]');
  const tree = (): SdSidebarV4MenuTree => fixture.debugElement.query(By.css('[data-v4m-tree]'))?.componentInstance as SdSidebarV4MenuTree;
  const destinationKeys = (): string[] => qa('[data-v4m-destination]').map(item => item.getAttribute('data-v4m-destination') ?? '');
  const destination = (key: string): HTMLButtonElement | null => q<HTMLButtonElement>(`[data-v4m-destination="${key}"]`);

  /** Focuses then clicks `button`, like a keyboard or pointer user, so the drawer records it as the trigger. */
  function activate(button: HTMLElement): void {
    button.focus();
    button.click();
    fixture.detectChanges();
  }

  /** Moves focus into the open drawer, so a later assertion proves focus really travels back to the trigger. */
  function focusInDrawer(element: HTMLElement | null = searchInput()): void {
    (element as HTMLElement).focus();
    expect(document.activeElement).withContext('focus moved into the drawer').toBe(element);
  }

  function type(value: string): void {
    const input = searchInput() as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function press(target: Element, key: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  }

  describe('app bar (M1)', () => {
    it('renders a 56px app bar with the menu button, title, search button and the user initials', () => {
      create();

      const appBar = q('[data-v4m-appbar]') as HTMLElement;
      expect(getComputedStyle(host()).display).toBe('block');
      expect(height(appBar)).toBe(56);
      expect(getComputedStyle(appBar).borderBottomWidth).toBe('1px');

      const trigger = menuTrigger();
      expect(trigger.type).toBe('button');
      expect(trigger.getAttribute('aria-label')).toBe('Open menu');
      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect([width(trigger), height(trigger)]).toEqual([44, 44]);

      const title = q('[data-v4m-appbar-title]') as HTMLElement;
      expect(text(title)).toBe('Back Office');
      expect(getComputedStyle(title).fontSize).toBe('18px');
      expect(getComputedStyle(title).fontWeight).toBe('500');

      const search = q<HTMLButtonElement>('[data-v4m-search-trigger]') as HTMLButtonElement;
      expect(search.getAttribute('aria-label')).toBe('Search menu');
      expect([width(search), height(search)]).toEqual([44, 44]);

      const avatar = q('[data-v4m-avatar]') as HTMLElement;
      expect(text(avatar)).toBe('DU');
      expect([width(avatar), height(avatar)]).toEqual([32, 32]);
      expect(avatar.getAttribute('role')).toBe('img');
      expect(avatar.getAttribute('aria-label')).toBe('Demo User');
      expect(avatar.hasAttribute('aria-hidden')).toBeFalse();
    });

    it('hides a nameless avatar from assistive technology instead of exposing an unnamed image', () => {
      create();
      fixture.componentRef.setInput('userInfo', {});
      fixture.detectChanges();

      const avatar = q('[data-v4m-avatar]') as HTMLElement;
      expect(avatar.getAttribute('aria-hidden')).toBe('true');
      expect(avatar.hasAttribute('role')).toBeFalse();
      expect(avatar.hasAttribute('aria-label')).toBeFalse();
    });

    it('shows the configured default title', () => {
      create({ defaultTitle: 'Orkestr' });

      expect(text(q('[data-v4m-appbar-title]'))).toBe('Orkestr');
    });
  });

  describe('drawer (M2, AC-009, INV-011)', () => {
    it('opens from the app bar as a focus-trapped modal dialog with the V4 tree in mobile mode', () => {
      create();
      activate(menuTrigger());

      const panel = drawer() as HTMLElement;
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(panel.getAttribute('aria-modal')).toBe('true');
      expect(panel.getAttribute('aria-labelledby')).toBe(q('[data-v4m-drawer-title]')?.id ?? 'missing');
      const trap = fixture.debugElement.query(By.directive(CdkTrapFocus))?.injector.get(CdkTrapFocus);
      expect(trap?.enabled).toBeTrue();
      expect(trap?.autoCapture).toBeTrue();
      expect(menuTrigger().getAttribute('aria-expanded')).toBe('true');
      expect(document.body.style.overflow).toBe('hidden');

      expect(width(panel)).toBe(Math.round(Math.min(window.innerWidth * 0.88, 360)));
      const style = getComputedStyle(panel);
      expect([style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomRightRadius]).toEqual(['0px', '24px', '24px']);
      expect(style.boxShadow).not.toBe('none');

      expect(tree().mode()).toBe('mobile');
      expect(q('[data-v4m-tree]')?.closest('nav')).toBe(q('[data-v4m-nav]'));
      expect(getComputedStyle(host()).getPropertyValue('--sd-sidebar-v4-item-height').trim()).toBe('44px');
      expect(height(q('[data-v4m-tree] [data-menu-key="id:overview"]'))).toBe(44);
      expect(height(q('[data-v4m-tree] [data-menu-key="id:members"]'))).toBe(44);
      expect(height(q('[data-v4m-search-field]'))).toBe(44);

      const close = q<HTMLButtonElement>('[data-v4m-close]') as HTMLButtonElement;
      expect(close.getAttribute('aria-label')).toBe('Close');
      expect([width(close), height(close)]).toEqual([44, 44]);
      expect(q('[data-v4m-footer] sd-layout-user-menu')).not.toBeNull();
      expect(q('[data-v4m-nav]')?.getAttribute('aria-label')).toBe('All menus');
    });

    it('keeps focus inside the drawer when non-focusable content is clicked, so Escape still closes it', () => {
      create();
      activate(menuTrigger());
      const panel = drawer() as HTMLElement;
      expect(panel.getAttribute('tabindex')).toBe('-1');

      // Trình duyệt chuyển focus tới tổ tiên focus được gần nhất của chỗ được click — với tabindex -1 đó là chính drawer.
      const title = q('[data-v4m-drawer-title]') as HTMLElement;
      const focusTarget = title.closest<HTMLElement>('[tabindex], button, input, a[href]') as HTMLElement;
      expect(focusTarget).toBe(panel);
      focusInDrawer(focusTarget);

      expect(press(document.activeElement as HTMLElement, 'Escape').defaultPrevented).toBeTrue();
      fixture.detectChanges();
      expect(drawer()).toBeNull();
      expect(document.activeElement).toBe(menuTrigger());
    });

    it('closes through the backdrop, the close button, Escape and a menu selection, each clearing the query and returning focus to the trigger', async () => {
      create();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const closePaths: [string, () => Promise<void>][] = [
        ['backdrop', async () => (q('[data-v4m-backdrop]') as HTMLElement).click()],
        ['close button', async () => (q('[data-v4m-close]') as HTMLElement).click()],
        ['escape', async () => void press(document.activeElement as HTMLElement, 'Escape')],
        [
          'menu selection',
          async () => {
            (qa('[data-v4-result]')[0] as HTMLElement).click();
            await fixture.whenStable();
          },
        ],
      ];

      for (const [label, close] of closePaths) {
        activate(menuTrigger());
        type('bao cao');
        expect(qa('[data-v4-result]').length).withContext(label).toBeGreaterThan(0);
        // Esc trong ô search có query chỉ xoá query — đặt focus lên nút đóng cho đường Esc của drawer.
        focusInDrawer(label === 'escape' ? q('[data-v4m-close]') : searchInput());

        await close();
        fixture.detectChanges();

        expect(drawer()).withContext(label).toBeNull();
        expect(fixture.componentInstance.searchText()).withContext(label).toBe('');
        expect(document.activeElement).withContext(label).toBe(menuTrigger());
        expect(menuTrigger().getAttribute('aria-expanded')).withContext(label).toBe('false');
        expect(document.body.style.overflow).withContext(label).toBe('');
      }
      expect(navigate).toHaveBeenCalledOnceWith(['/reports/sales'], { queryParams: { view: 'month' }, state: { switchTab: true } });

      activate(menuTrigger());
      expect((searchInput() as HTMLInputElement).value).toBe('');
    });

    it('closes when the selected menu is the page already open, but stays open when a guard cancels the navigation', async () => {
      const blocked: SdLayoutRootMenu = { id: 'blocked', title: 'Bị chặn', path: '/blocked', permission: true };
      create({}, [...menus, blocked]);
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/reports/sales?view=month');
      fixture.detectChanges();
      expect(fixture.componentInstance.activePath()).toBe('/reports/sales');

      // Cùng URL: router phát NavigationSkipped và navigate() trả false — vẫn là một lựa chọn menu (INV-011).
      activate(menuTrigger());
      type('ban hang');
      focusInDrawer();
      (q('[data-v4-result][data-menu-key="id:sales"]') as HTMLElement).click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(drawer()).toBeNull();
      expect(fixture.componentInstance.searchText()).toBe('');
      expect(document.activeElement).toBe(menuTrigger());
      expect(document.body.style.overflow).toBe('');
      expect(router.url).toBe('/reports/sales?view=month');

      activate(menuTrigger());
      (q('[data-v4m-tree] [data-menu-key="id:blocked"]') as HTMLElement).click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(router.url).toBe('/reports/sales?view=month');
      expect(drawer()).not.toBeNull();
    });

    it('clears a query with Escape in the search first, then closes the drawer on the next Escape', () => {
      create();
      activate(menuTrigger());
      type('bao cao');
      focusInDrawer();

      expect(press(searchInput() as HTMLInputElement, 'Escape').defaultPrevented).toBeTrue();
      expect(drawer()).not.toBeNull();
      expect(fixture.componentInstance.searchText()).toBe('');

      // Esc huỷ phần đang gõ của IME không phải lệnh đóng drawer.
      press(searchInput() as HTMLInputElement, 'Escape', { isComposing: true });
      expect(drawer()).not.toBeNull();

      press(searchInput() as HTMLInputElement, 'Escape');
      expect(drawer()).toBeNull();
      expect(document.activeElement).toBe(menuTrigger());
    });

    it('opens the drawer and focuses its search from the app-bar search button, then returns focus to that button', async () => {
      create();
      const search = q<HTMLButtonElement>('[data-v4m-search-trigger]') as HTMLButtonElement;

      activate(search);
      await fixture.whenStable();

      expect(drawer()).not.toBeNull();
      expect(document.activeElement).toBe(searchInput());

      press(q('[data-v4m-close]') as HTMLElement, 'Escape');
      expect(document.activeElement).toBe(search);
    });

    it('closes after an external menu opens with noopener,noreferrer and never opens a javascript: url', () => {
      create();
      const windowOpen = spyOn(window, 'open');
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      fixture.componentInstance.openDrawer();
      fixture.detectChanges();

      fixture.componentInstance.navigateMenu({ id: 'docs', title: 'Docs', path: 'https://example.com/docs', permission: true });
      fixture.detectChanges();
      expect(windowOpen).toHaveBeenCalledWith('https://example.com/docs', '_blank', 'noopener,noreferrer');
      expect(navigate).not.toHaveBeenCalled();
      expect(drawer()).toBeNull();

      windowOpen.calls.reset();
      fixture.componentInstance.navigateMenu({
        id: 'evil',
        title: 'Evil',
        path: 'javascript:fetch("//evil.example.com")//http',
        permission: true,
      });
      expect(windowOpen).not.toHaveBeenCalled();
    });

    it('navigates tree rows like the desktop sidebar and records them as recent', async () => {
      create();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      const state = TestBed.inject(SdLayoutNavigationStateService);
      activate(menuTrigger());
      const row = q('[data-v4m-tree] [data-menu-key="id:members"]') as HTMLElement;
      focusInDrawer(row);

      row.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(navigate).toHaveBeenCalledOnceWith(['/settings/members'], { queryParams: {}, state: { switchTab: true } });
      expect(state.recentKeys()[0]).toBe('id:members');
      expect(drawer()).toBeNull();
      expect(document.activeElement).toBe(menuTrigger());
    });

    it('drives the results as a combobox and keeps one tree instance for hierarchy and results', async () => {
      create();
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      activate(menuTrigger());
      const treeBefore = tree();
      const input = searchInput() as HTMLInputElement;

      type('bao cao');

      expect(tree()).toBe(treeBefore);
      expect(tree().presentation()).toBe('results');
      expect(qa('[data-v4-result]').map(option => option.getAttribute('data-menu-key'))).toEqual(['id:sales', 'id:stock']);
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.getAttribute('aria-controls')).toBe(q('[data-v4-results]')?.id ?? 'missing');
      expect(input.getAttribute('aria-activedescendant')).toBe(qa('[data-v4-result]')[0].id);
      expect(q('[data-v4m-search-clear]')?.getAttribute('aria-label')).toBe('Clear search');

      expect(press(input, 'ArrowDown').defaultPrevented).toBeTrue();
      expect(input.getAttribute('aria-activedescendant')).toBe(qa('[data-v4-result]')[1].id);
      expect(press(input, 'Enter').defaultPrevented).toBeTrue();
      expect(navigate).toHaveBeenCalledOnceWith(['/settings/stock'], { queryParams: {}, state: { switchTab: true } });
      await fixture.whenStable();
      fixture.detectChanges();
      expect(drawer()).toBeNull();
    });

    it('clears the query from the clear button and keeps focus in the search', () => {
      create();
      activate(menuTrigger());
      type('bao cao');

      (q('[data-v4m-search-clear]') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(fixture.componentInstance.searchText()).toBe('');
      expect(tree().presentation()).toBe('hierarchy');
      expect(document.activeElement).toBe(searchInput());
    });

    it('keeps the search text at 13px, raised to 16px under a coarse pointer so iOS does not zoom on focus', () => {
      create();
      activate(menuTrigger());
      const input = searchInput() as HTMLInputElement;
      expect(getComputedStyle(input).fontSize).toBe('13px');

      simulateCoarsePointer(input);

      expect(getComputedStyle(input).fontSize).toBe('16px');
    });

    it('renders Pinned and Recent in mobile mode and hides them while searching', () => {
      create();
      const state = TestBed.inject(SdLayoutNavigationStateService);
      state.togglePinned(overview);
      state.recordRecent(sales, { enabled: true, maxItems: 5 });
      activate(menuTrigger());

      expect(text(q('[data-v4m-pinned]'))).toContain('Tổng quan');
      expect(text(q('[data-v4m-recent]'))).toContain('Báo cáo bán hàng');
      const shortcutTrees = fixture.debugElement
        .queryAll(By.directive(SdSidebarV4MenuTree))
        .map(debug => debug.componentInstance as SdSidebarV4MenuTree)
        .filter(instance => instance.presentation() === 'shortcuts');
      expect(shortcutTrees.length).toBe(2);
      expect(shortcutTrees.every(instance => instance.mode() === 'mobile')).toBeTrue();

      type('bao');
      expect(q('[data-v4m-pinned]')).toBeNull();
      expect(q('[data-v4m-recent]')).toBeNull();
    });

    it('applies the soft item shape from the normalized configuration', () => {
      create({ itemShape: 'soft' });
      expect(getComputedStyle(host()).getPropertyValue('--sd-sidebar-v4-item-radius').trim()).toBe('8px');
      fixture.destroy();

      create({ itemShape: 'unknown' as never });
      expect(getComputedStyle(host()).getPropertyValue('--sd-sidebar-v4-item-radius').trim()).toBe('999px');
    });

    it('never writes the collapsed state and releases body scroll when destroyed while open', () => {
      create();
      fixture.componentInstance.openDrawer();
      fixture.detectChanges();
      expect(document.body.style.overflow).toBe('hidden');

      fixture.componentInstance.closeFromBackdrop();
      fixture.componentInstance.openDrawer();
      fixture.detectChanges();
      expect(TestBed.inject(SdLayoutNavigationStateService).versionState(3).collapsed).toBeUndefined();

      fixture.destroy();
      expect(document.body.style.overflow).toBe('');
    });

    it('leaves the body overflow of other owners alone when destroyed while closed', () => {
      create();
      fixture.componentInstance.openDrawer();
      fixture.componentInstance.closeFromBackdrop();
      document.body.style.overflow = 'clip';

      fixture.destroy();

      expect(document.body.style.overflow).toBe('clip');
    });
  });

  describe('bottom bar (M1, AC-010, INV-011)', () => {
    afterEach(() => {
      for (const name of ['--sd-sidebar-v4-active-bg', '--sd-sidebar-v4-active-shadow', '--sd-sidebar-v4-active-ink']) {
        document.documentElement.style.removeProperty(name);
      }
    });

    it('keeps at most four configured destinations, skips unknown ids and adds More', () => {
      create({ mobile: { bottomBar: ['overview', 'missing', 'sales', 'approvals', 'runs'] } });

      // normalize giới hạn 4 id trước, rồi id không tồn tại mới bị bỏ — thanh có thể ít hơn 4 đích.
      expect(destinationKeys()).toEqual(['id:overview', 'id:sales', 'id:approvals']);
      const more = q<HTMLButtonElement>('[data-v4m-more]') as HTMLButtonElement;
      // why: textContent của nút gồm cả ligature của icon — đọc riêng phần nhãn.
      expect(text(more.querySelector('[data-v4m-label]'))).toBe('More');
      expect((more.parentElement as HTMLElement).lastElementChild).toBe(more);
      expect(text(destination('id:sales')?.querySelector('[data-v4m-label]'))).toBe('Bán hàng');
      fixture.destroy();

      create({ mobile: { bottomBar: ['overview', 'sales', 'approvals', 'runs', 'settings'] } });
      expect(destinationKeys()).toEqual(['id:overview', 'id:sales', 'id:approvals', 'id:runs']);
    });

    it('renders a 64px bar of equal columns fixed to the bottom and pads the content above it', () => {
      create({ mobile: { bottomBar: ['overview', 'sales', 'approvals', 'runs'] } });

      const bar = q('[data-v4m-bottom-bar]') as HTMLElement;
      expect(bar.tagName).toBe('NAV');
      expect(bar.getAttribute('aria-label')).toBe('Primary navigation');
      expect(getComputedStyle(bar).position).toBe('fixed');
      expect(getComputedStyle(bar).borderTopWidth).toBe('1px');
      // Cột 64px dưới đường viền 1px; safe-area bằng 0 trong Karma.
      expect(height(bar)).toBe(65);
      const columns = [...qa('[data-v4m-destination]'), q('[data-v4m-more]') as HTMLElement];
      expect(columns.length).toBe(5);
      expect(new Set(columns.map(width)).size).toBe(1);
      expect(new Set(columns.map(height))).toEqual(new Set([64]));
      const indicator = (destination('id:overview') as HTMLElement).querySelector('[data-v4m-indicator]');
      expect([width(indicator), height(indicator)]).toEqual([56, 30]);
      expect(getComputedStyle(q('[data-v4m-content]') as HTMLElement).paddingBottom).toBe('65px');
    });

    it('names the bottom-bar navigation apart from the drawer navigation', () => {
      create({ mobile: { bottomBar: ['overview'] } });
      activate(q('[data-v4m-more]') as HTMLElement);

      const names = qa('nav').map(nav => nav.getAttribute('aria-label'));
      expect(q('[data-v4m-bottom-bar]')?.getAttribute('aria-label')).toBe('Primary navigation');
      expect(q('[data-v4m-nav]')?.getAttribute('aria-label')).toBe('All menus');
      expect(new Set(names).size).toBe(names.length);
    });

    it('marks the destination of the current route with aria-current, the primary-light indicator and a filled primary icon', () => {
      create({ mobile: { bottomBar: ['overview', 'sales'] } });

      fixture.componentInstance.activePath.set('/reports/sales');
      fixture.detectChanges();

      const active = destination('id:sales') as HTMLButtonElement;
      const idle = destination('id:overview') as HTMLButtonElement;
      expect(active.getAttribute('aria-current')).toBe('page');
      expect(idle.getAttribute('aria-current')).toBeNull();
      const indicator = (button: HTMLElement): HTMLElement => button.querySelector('[data-v4m-indicator]') as HTMLElement;
      // THEME_TOKENS: --sd-primary-light = rgb(219, 232, 245), --sd-primary = rgb(0, 92, 187).
      expect(getComputedStyle(indicator(active)).backgroundColor).toBe('rgb(219, 232, 245)');
      expect(getComputedStyle(indicator(active)).color).toBe('rgb(0, 92, 187)');
      expect(getComputedStyle(indicator(active)).boxShadow).toBe('none');
      expect(getComputedStyle(indicator(idle)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(active.querySelector('mat-icon')?.classList).toContain('material-icons');
      expect(active.querySelector('mat-icon')?.classList).not.toContain('material-icons-outlined');
      expect(idle.querySelector('mat-icon')?.classList).toContain('material-icons-outlined');
      expect(getComputedStyle(active.querySelector('[data-v4m-label]') as HTMLElement).fontWeight).toBe('500');
      expect(getComputedStyle(idle.querySelector('[data-v4m-label]') as HTMLElement).fontWeight).toBe('400');
    });

    it('marks a group destination that holds the current route with aria-current="true"', () => {
      create({ mobile: { bottomBar: ['settings', 'overview'] } });

      fixture.componentInstance.activePath.set('/settings/members');
      fixture.detectChanges();

      const group = destination('id:settings') as HTMLButtonElement;
      expect(group.getAttribute('aria-current')).toBe('true');
      expect(destination('id:overview')?.getAttribute('aria-current')).toBeNull();
      const indicator = group.querySelector('[data-v4m-indicator]') as HTMLElement;
      expect(getComputedStyle(indicator).backgroundColor).toBe('rgb(219, 232, 245)');
    });

    it('keeps the primary-light indicator without a shadow when a preset turns the V4 active item into a raised surface', () => {
      // Như graphite: item active của cây là bề mặt trắng có viền shadow — indicator của bottom bar vẫn theo README M1/K.
      document.documentElement.style.setProperty('--sd-sidebar-v4-active-bg', 'rgb(255, 255, 255)');
      document.documentElement.style.setProperty('--sd-sidebar-v4-active-shadow', '0 0 0 1px rgb(225, 227, 232)');
      document.documentElement.style.setProperty('--sd-sidebar-v4-active-ink', 'rgb(22, 24, 29)');
      create({ mobile: { bottomBar: ['sales'] } });
      host().style.setProperty('--sd-sidebar-v4-active-bg', 'rgb(255, 255, 255)');
      host().style.setProperty('--sd-sidebar-v4-active-shadow', '0 0 0 1px rgb(225, 227, 232)');

      fixture.componentInstance.activePath.set('/reports/sales');
      fixture.detectChanges();

      const indicator = destination('id:sales')?.querySelector('[data-v4m-indicator]') as HTMLElement;
      expect(getComputedStyle(indicator).backgroundColor).toBe('rgb(219, 232, 245)');
      expect(getComputedStyle(indicator).boxShadow).toBe('none');
      expect(getComputedStyle(indicator).color).toBe('rgb(0, 92, 187)');
    });

    it('navigates a destination like the desktop sidebar without opening the drawer', () => {
      create({ mobile: { bottomBar: ['sales'] } });
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

      (destination('id:sales') as HTMLButtonElement).click();
      fixture.detectChanges();

      expect(navigate).toHaveBeenCalledOnceWith(['/reports/sales'], { queryParams: { view: 'month' }, state: { switchTab: true } });
      expect(drawer()).toBeNull();
    });

    it('shows a mini attention badge and a live dot, described for assistive technology', () => {
      create({ mobile: { bottomBar: ['approvals', 'runs', 'overview'] } });

      const badge = (destination('id:approvals') as HTMLElement).querySelector('[data-v4m-badge]') as HTMLElement;
      expect(text(badge)).toBe('3');
      expect(height(badge)).toBe(16);
      expect(badge.getAttribute('aria-hidden')).toBe('true');
      const describedBy = (key: string): string =>
        text(document.getElementById(destination(key)?.getAttribute('aria-describedby') ?? 'missing'));
      expect(describedBy('id:approvals')).toBe('3 pending');

      const dot = (destination('id:runs') as HTMLElement).querySelector('[data-v4m-live]') as HTMLElement;
      expect([width(dot), height(dot)]).toEqual([8, 8]);
      expect(describedBy('id:runs')).toBe('1 đang chạy');
      expect(destination('id:overview')?.hasAttribute('aria-describedby')).toBeFalse();
    });

    it('opens the drawer from More and returns focus to it on close', () => {
      create({ mobile: { bottomBar: ['overview'] } });
      const more = q<HTMLButtonElement>('[data-v4m-more]') as HTMLButtonElement;
      expect(more.getAttribute('aria-expanded')).toBe('false');

      activate(more);
      expect(drawer()).not.toBeNull();
      expect(more.getAttribute('aria-expanded')).toBe('true');
      // Mở lại khi đang mở không đổi nơi trả focus.
      fixture.componentInstance.openDrawer(menuTrigger());
      focusInDrawer();

      (q('[data-v4m-backdrop]') as HTMLElement).click();
      fixture.detectChanges();
      expect(drawer()).toBeNull();
      expect(document.activeElement).toBe(more);
    });

    it('opens the drawer on a group destination with that group expanded, and leaves a comingSoon destination inert', () => {
      const docs: SdLayoutRootMenu = {
        id: 'docs',
        title: 'Tài liệu',
        path: '/docs',
        icon: 'menu_book',
        permission: true,
        comingSoon: true,
      };
      create({ mobile: { bottomBar: ['settings', 'docs'] } }, [...menus, docs]);
      const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
      fixture.componentInstance.openDrawer();
      fixture.detectChanges();
      (q('[data-v4m-tree] [data-menu-group="id:settings"]') as HTMLButtonElement).click();
      fixture.componentInstance.closeFromBackdrop();
      fixture.detectChanges();

      const group = destination('id:settings') as HTMLButtonElement;
      expect(group.getAttribute('aria-haspopup')).toBe('dialog');
      activate(group);
      expect(drawer()).not.toBeNull();
      expect(q('[data-v4m-tree] [data-menu-group="id:settings"]')?.getAttribute('aria-expanded')).toBe('true');
      fixture.componentInstance.closeFromBackdrop();
      fixture.detectChanges();

      const soon = destination('id:docs') as HTMLButtonElement;
      expect(soon.getAttribute('aria-disabled')).toBe('true');
      soon.click();
      fixture.detectChanges();
      expect(navigate).not.toHaveBeenCalled();
      expect(drawer()).toBeNull();
    });

    it('renders no bottom bar without mobile.bottomBar, with an empty list or with only unknown ids', () => {
      for (const sidebar of [{}, { mobile: {} }, { mobile: { bottomBar: [] } }, { mobile: { bottomBar: ['missing', ' '] } }]) {
        create(sidebar);
        const label = JSON.stringify(sidebar);
        expect(q('[data-v4m-bottom-bar]')).withContext(label).toBeNull();
        expect(getComputedStyle(q('[data-v4m-content]') as HTMLElement).paddingBottom)
          .withContext(label)
          .toBe('0px');
        fixture.destroy();
      }
    });
  });

  describe('context switcher (AC-018, R-008, D-027)', () => {
    const switcher = () => fixture.debugElement.query(By.directive(SdLayoutContextSwitcher));
    const overlayRoot = (): HTMLElement => TestBed.inject(OverlayContainer).getContainerElement();

    it('renders the sheet switcher under the drawer title and opens its bottom sheet above the drawer', async () => {
      create({ context: { items: contexts } });
      activate(menuTrigger());

      const instance = switcher()?.componentInstance as SdLayoutContextSwitcher;
      expect(instance.appearance()).toBe('sheet');
      expect(q('[data-v4m-drawer-title]')?.nextElementSibling).toBe(switcher().nativeElement);
      expect(switcher().nativeElement.closest('[data-v4m-header]')).not.toBeNull();
      expect(context.syncItems).toHaveBeenCalledWith(contexts);

      (q('[data-context-trigger]') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();

      const sheet = overlayRoot().querySelector<HTMLElement>('[data-context-sheet]') as HTMLElement;
      expect(sheet).not.toBeNull();
      sheet.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      fixture.detectChanges();

      expect(instance.isOpen()).toBeFalse();
      expect(drawer()).not.toBeNull();
      expect(document.activeElement).toBe(q('[data-context-trigger]'));
    });

    it('reconciles the configured context on init, before the drawer and its switcher first render', () => {
      create({ context: { items: contexts } });

      expect(drawer()).toBeNull();
      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(context.syncItems).toHaveBeenCalledOnceWith(contexts);
      expect(contextServiceCreations).toBe(1);
    });

    it('renders no switcher and never creates the context service without context', () => {
      create();
      activate(menuTrigger());

      expect(q('sd-layout-context-switcher')).toBeNull();
      expect(context.syncItems).not.toHaveBeenCalled();
      expect(contextServiceCreations).toBe(0);
    });
  });
});
