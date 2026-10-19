import { CdkTrapFocus } from '@angular/cdk/a11y';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, NavigationSkipped, Router } from '@angular/router';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdIsExternalHttpUrl, sdOpenExternal } from '@sdcorejs/angular/utilities';
import {
  ResolvedSidebarRecentConfiguration,
  SdLayoutUserInfo,
  SidebarConfigurationV4,
  normalizeSidebarConfiguration,
} from '../../configurations';
import {
  SdLayoutContextService,
  SdLayoutMenu,
  SdLayoutNavigationStateService,
  getMenuStableKey,
  groupMenusBySection,
  resolveMenuTrailing,
} from '../../services';
import { containsMenuPath, resolveActiveMenuPath } from '../../utils';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdLayoutUserMenuComponent } from '../shared/user-menu/user-menu.component';
import { SdSidebarV4MenuTree, buildSidebarV4SearchResults } from '../sidebar-v4/menu-tree/sidebar-v4-menu-tree.component';

/** `SidebarConfigurationV4` as `normalizeSidebarConfiguration` returns it: every V4 default is filled (INV-012). */
type SdSidebarMobileV4ResolvedConfiguration = SidebarConfigurationV4 &
  Required<Pick<SidebarConfigurationV4, 'itemShape' | 'density' | 'collapsedGroup'>> & {
    recent: ResolvedSidebarRecentConfiguration;
  };

/** One bottom-bar destination resolved from `mobile.bottomBar`. */
interface SdSidebarMobileV4Destination {
  menu: SdLayoutMenu;
  key: string;
  label: string;
  isGroup: boolean;
  isActive: boolean;
  disabled: boolean;
  /** Keys of the group and its ancestor groups, opened when a group destination opens the drawer. */
  expandKeys: string[];
  badge: { value: number | string; tone: 'warning' | 'error' } | null;
  liveTone: 'success' | 'warning' | 'error' | null;
  /** Live status label read out after the title; a badge is described through i18n in the template. */
  liveLabel: string;
  descriptionId: string;
}

interface SdSidebarMobileV4MenuEntry {
  menu: SdLayoutMenu;
  key: string;
  ancestorKeys: string[];
}

let nextMobileV4Id = 0;

/**
 * Sidebar V4 mobile shell (README M1–M3): a 56px app bar, a `min(88vw, 360px)` modal drawer that hosts the V4 menu tree in
 * `mobile` mode (44px rows, combobox search, Pinned/Recent, account footer, Context Switcher bottom sheet) and an opt-in
 * bottom bar built from `mobile.bottomBar` (at most 4 menu ids plus "More"). Routed content is projected into `<main>`.
 *
 * Navigation, pinned and recent behave like `sd-sidebar-v4`. Every way of closing the drawer (backdrop, Escape, menu
 * selection, including the page already open) clears the search and returns focus to the control that opened it (INV-011).
 * Options are read only after `normalizeSidebarConfiguration` (INV-012). Mobile has no rail, so the collapse preference is
 * never read or written. With `context` configured, `context.items` reach `SdLayoutContextService.syncItems()` on init,
 * before the drawer and its switcher first render; without it the context service is never created.
 */
@Component({
  selector: 'sd-sidebar-mobile-v4',
  standalone: true,
  imports: [CdkTrapFocus, SdIcon, SdLayoutContextSwitcher, SdLayoutUserMenuComponent, SdSidebarV4MenuTree, SdTranslatePipe],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-sidebar-mobile-v4',
    '[class.sd-sidebar-mobile-v4--soft]': 'configuration().itemShape === "soft"',
    '[class.sd-sidebar-mobile-v4--bottom-bar]': 'destinations().length > 0',
  },
})
export class SdSidebarMobileV4 {
  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #injector = inject(Injector);
  readonly #navigationState = inject(SdLayoutNavigationStateService);
  readonly #id = `sd-sidebar-mobile-v4-${nextMobileV4Id++}`;
  /** Requested result index; `focusedResultIndex` clamps it to the current results. */
  readonly #focusRequest = signal(0);
  #restoreFocusElement: HTMLElement | null = null;
  #previousBodyOverflow = '';
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly list = viewChild<ElementRef<HTMLElement>>('list');
  private readonly mainTree = viewChild<SdSidebarV4MenuTree>('mainTree');

  menus = input<SdLayoutMenu[]>([]);
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV4>();

  /** `sidebar()` with the V4 defaults filled by `normalizeSidebarConfiguration`, the only place they are resolved (INV-012). */
  protected readonly configuration = computed(
    () => normalizeSidebarConfiguration(this.sidebar()) as SdSidebarMobileV4ResolvedConfiguration
  );
  isDrawerOpen = signal(false);
  searchText = signal('');
  activePath = signal(this.#router.url.split(/[?#]/, 1)[0] ?? '');
  protected readonly collapsedGroupKeys = signal<string[]>([]);
  /** The drawer was opened from the app-bar search button: its search input takes the initial focus. */
  protected readonly focusSearchOnOpen = signal(false);
  /** Search results in the order the tree renders its options (accent-insensitive, without `comingSoon` items). */
  protected readonly searchResults = computed(() => buildSidebarV4SearchResults(this.menus(), this.searchText()));
  /** Index of the keyboard-selected result: the first one when results appear, -1 when there is none. */
  protected readonly focusedResultIndex = computed(() => {
    const count = this.searchResults().length;
    return count ? Math.min(Math.max(this.#focusRequest(), 0), count - 1) : -1;
  });
  recentConfiguration = computed(() => this.configuration().recent);
  pinnedKeys = this.#navigationState.pinnedKeys;
  pinnedMenus = this.#navigationState.pinnedMenus;
  recentMenus = this.#navigationState.recentMenus;

  protected readonly titleId = `${this.#id}-title`;
  protected readonly hasQuery = computed(() => !!this.searchText().trim());
  protected readonly title = computed(() => this.configuration().defaultTitle || 'Back Office');
  protected readonly logoInitial = computed(() => Array.from(this.title().trim())[0]?.toLocaleUpperCase() ?? '');
  /** The hierarchy starts with items that have no section heading. */
  protected readonly leadsWithUnsectioned = computed(() => groupMenusBySection(this.menus())[0]?.section === null);
  protected readonly displayName = computed(() => {
    const user = this.userInfo();
    return user.fullName || user.username || user.email || '';
  });
  /** First letters of the first and last word of the display name, as on the README M1 avatar. */
  protected readonly userInitials = computed(() => {
    const words = this.displayName().trim().split(/\s+/).filter(Boolean);
    const first = Array.from(words[0] ?? '')[0] ?? '';
    const last = words.length > 1 ? (Array.from(words[words.length - 1])[0] ?? '') : '';
    return (first + last).toLocaleUpperCase();
  });

  /** Menus of `mobile.bottomBar` that exist in `menus` (looked up by `id` at any depth), in configured order. */
  protected readonly destinations = computed<SdSidebarMobileV4Destination[]>(() => {
    const ids = this.configuration().mobile?.bottomBar ?? [];
    if (!ids.length) return [];
    const menus = this.menus();
    const entries = indexMenusById(menus);
    const activeMenuPath = resolveActiveMenuPath(menus, this.activePath());
    return ids
      .map(id => entries.get(id))
      .filter((entry): entry is SdSidebarMobileV4MenuEntry => !!entry)
      .map((entry, index) => {
        const { menu, key } = entry;
        const isGroup = 'children' in menu && Array.isArray(menu.children) && menu.children.length > 0;
        const path = 'path' in menu && typeof menu.path === 'string' ? menu.path : '';
        const trailing = resolveMenuTrailing(menu);
        const live = trailing?.kind === 'status' && trailing.live ? trailing : null;
        return {
          menu,
          key,
          label: menu.tooltipTitle || menu.title || '',
          isGroup,
          isActive: !!activeMenuPath && (isGroup ? containsMenuPath(menu, activeMenuPath) : path === activeMenuPath),
          disabled: menu.comingSoon === true,
          expandKeys: [...entry.ancestorKeys, key],
          badge: trailing?.kind === 'badge' ? { value: trailing.value, tone: trailing.tone } : null,
          liveTone: live?.tone ?? null,
          liveLabel: live?.label ?? '',
          descriptionId: `${this.#id}-destination-${index}`,
        };
      });
  });

  constructor() {
    effect(() => {
      const menus = this.menus();
      const maximum = this.configuration().recent.maxItems;
      untracked(() => this.#navigationState.hydrate(menus, maximum));
    });
    // why: switcher chỉ mount khi drawer mở — đối chiếu context ngay lúc khởi tạo (D-021) để listener nhiều tab chạy từ
    // đầu và lần chạm đầu vào menu không kích reload đối chiếu. Không có `context` thì không lấy service: app không cấu
    // hình context không tạo service lẫn listener.
    effect(() => {
      const context = this.configuration().context;
      if (!context) return;
      const items = context.items;
      untracked(() => this.#injector.get(SdLayoutContextService).syncItems(items));
    });
    this.#router.events.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.activePath.set(event.urlAfterRedirects.split(/[?#]/, 1)[0] ?? '');
        this.closeFromNavigation();
        return;
      }
      // why: chọn đúng trang đang mở thì router bỏ qua (NavigationSkipped, navigate trả false) — vẫn là một lựa chọn menu
      // nên đóng drawer. Điều hướng bị guard huỷ (NavigationCancel) giữ drawer mở.
      if (event instanceof NavigationSkipped) this.closeFromNavigation();
    });
    effect(() => {
      const menus = this.menus();
      const activeMenuPath = resolveActiveMenuPath(menus, this.activePath());
      if (!activeMenuPath) return;
      const activeGroupKeys = new Set<string>();
      const visit = (items: SdLayoutMenu[], ancestors: string[]): void => {
        for (const menu of items) {
          if (!('children' in menu) || !containsMenuPath(menu, activeMenuPath)) continue;
          const key = getMenuStableKey(menu, ancestors);
          activeGroupKeys.add(key);
          visit(menu.children ?? [], [...ancestors, menu.title ?? key]);
        }
      };
      visit(menus, []);
      // why: Chỉ mở nhánh khi route/menu đổi; người dùng vẫn được đóng nhánh đang active.
      untracked(() => this.collapsedGroupKeys.update(keys => keys.filter(key => !activeGroupKeys.has(key))));
    });
    // why: chỉ trả lại overflow của body khi chính drawer đang khoá cuộn — không ghi đè giá trị phần khác đặt sau đó.
    this.#destroyRef.onDestroy(() => {
      if (this.isDrawerOpen()) this.#releaseBodyScroll();
    });
  }

  /** Opens the drawer; focus returns to `trigger` (default: the focused element, else the app-bar menu button) on close. */
  openDrawer(trigger?: EventTarget | null): void {
    if (this.isDrawerOpen()) return;
    const active = this.#document.activeElement;
    this.#restoreFocusElement =
      trigger instanceof HTMLElement
        ? trigger
        : active instanceof HTMLElement && active !== this.#document.body
          ? active
          : (this.trigger()?.nativeElement ?? null);
    // why: cdkTrapFocusAutoCapture trả focus về phần tử đang focus lúc mở khi drawer bị huỷ. Safari/iOS không focus nút
    // khi chạm, nên focus trigger trước để lần trả focus đó trùng trigger thay vì nhảy về phần tử khác trong trang.
    this.#restoreFocusElement?.focus({ preventScroll: true });
    this.#previousBodyOverflow = this.#document.body.style.overflow;
    this.#document.body.style.overflow = 'hidden';
    this.isDrawerOpen.set(true);
  }

  /** Opens the drawer with its search focused; focus returns to `trigger` on close. */
  openSearch(trigger?: EventTarget | null): void {
    if (this.isDrawerOpen()) {
      this.#focusSearchField();
      return;
    }
    this.focusSearchOnOpen.set(true);
    this.openDrawer(trigger);
  }

  closeFromBackdrop(): void {
    this.#closeDrawer();
  }

  closeFromEscape(): void {
    this.#closeDrawer();
  }

  closeFromNavigation(): void {
    this.#closeDrawer();
  }

  onDrawerKeydown(event: KeyboardEvent): void {
    // why: Esc đã được lớp trong xử lý (xoá query, đóng popup tài khoản) hoặc đang huỷ gõ IME thì không đóng luôn drawer.
    if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
    event.preventDefault();
    this.closeFromEscape();
  }

  navigateMenu(menu: SdLayoutMenu): void {
    if (!('path' in menu)) return;
    this.#navigationState.recordRecent(menu, this.recentConfiguration());
    // why: `includes('http')` là substring test — `javascript:fetch(...)//http` lọt qua và chạy như
    // script trong origin của app. Parse URL thật rồi mới mở, kèm `noopener,noreferrer`.
    if (sdIsExternalHttpUrl(menu.path)) {
      sdOpenExternal(menu.path);
      this.closeFromNavigation();
      return;
    }
    void this.#router
      .navigate([menu.path.split('?')[0]], { queryParams: menu.queryParams ?? {}, state: { switchTab: true } })
      .then(navigated => {
        if (navigated) this.closeFromNavigation();
      });
  }

  onTogglePinned(menu: SdLayoutMenu): void {
    this.#navigationState.togglePinned(menu);
  }

  protected activateDestination(destination: SdSidebarMobileV4Destination, trigger: HTMLElement): void {
    if (destination.disabled) return;
    if (!destination.isGroup) {
      this.navigateMenu(destination.menu);
      return;
    }
    // why: group không có route — mở drawer tại đúng group đó (và các group cha) như rail V4 với collapsedGroup 'expand'.
    const keys = new Set(destination.expandKeys);
    this.collapsedGroupKeys.update(current => current.filter(key => !keys.has(key)));
    this.openDrawer(trigger);
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
    this.#focusRequest.set(0);
    // why: kết quả bắt đầu ở đầu list và kết quả đầu được chọn sẵn — bỏ vị trí cuộn cũ của cây để nó luôn thấy được.
    const list = this.list()?.nativeElement;
    if (value.trim() && list) list.scrollTop = 0;
  }

  protected clearSearch(): void {
    this.#clearQuery();
    this.searchInput()?.nativeElement.focus();
  }

  protected onSearchKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const count = this.searchResults().length;
        if (!count) return;
        event.preventDefault();
        const next = Math.min(Math.max(this.focusedResultIndex() + (event.key === 'ArrowDown' ? 1 : -1), 0), count - 1);
        this.#focusRequest.set(next);
        this.#revealResult(next);
        return;
      }
      case 'Enter': {
        const result = this.searchResults()[this.focusedResultIndex()];
        if (!result) return;
        event.preventDefault();
        this.navigateMenu(result.menu);
        return;
      }
      case 'Escape':
        // why: Esc đầu xoá query như gợi ý "Esc clear" của kết quả; ô đã trống thì để Esc tới drawer và đóng nó.
        if (!this.searchText()) return;
        event.preventDefault();
        this.#clearQuery();
    }
  }

  #revealResult(index: number): void {
    const tree = this.mainTree();
    // why: listbox cuộn trong nav — option được chọn phải luôn nằm trong vùng thấy được (WCAG 2.4.11).
    if (tree) this.#document.getElementById(tree.resultOptionId(index))?.scrollIntoView({ block: 'nearest' });
  }

  #focusSearchField(): void {
    const field = this.searchInput()?.nativeElement;
    field?.focus();
    field?.select();
  }

  #clearQuery(): void {
    this.searchText.set('');
    this.#focusRequest.set(0);
  }

  #closeDrawer(): void {
    if (!this.isDrawerOpen()) return;
    this.isDrawerOpen.set(false);
    this.focusSearchOnOpen.set(false);
    this.#clearQuery();
    this.#releaseBodyScroll();
    (this.#restoreFocusElement ?? this.trigger()?.nativeElement)?.focus();
    this.#restoreFocusElement = null;
  }

  #releaseBodyScroll(): void {
    this.#document.body.style.overflow = this.#previousBodyOverflow;
  }
}

/** First menu of every `id` in the tree, with the stable keys of its ancestor groups (keys as the V4 tree computes them). */
function indexMenusById(menus: SdLayoutMenu[]): Map<string, SdSidebarMobileV4MenuEntry> {
  const entries = new Map<string, SdSidebarMobileV4MenuEntry>();
  const visit = (items: SdLayoutMenu[] | undefined, ancestors: string[], ancestorKeys: string[]): void => {
    for (const menu of items ?? []) {
      if (!menu || typeof menu !== 'object') continue;
      const key = getMenuStableKey(menu, ancestors);
      const id = typeof menu.id === 'string' ? menu.id.trim() : '';
      if (id && key && !entries.has(id)) entries.set(id, { menu, key, ancestorKeys });
      if ('children' in menu && Array.isArray(menu.children)) {
        visit(menu.children, [...ancestors, menu.title ?? key], [...ancestorKeys, key]);
      }
    }
  };
  visit(menus, [], []);
  return entries;
}
