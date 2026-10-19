import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdIsExternalHttpUrl, sdOpenExternal } from '@sdcorejs/angular/utilities';
import {
  ResolvedSidebarRecentConfiguration,
  SdLayoutUserInfo,
  SidebarConfigurationV4,
  normalizeSidebarConfiguration,
} from '../../configurations';
import { SdLayoutMenu, SdLayoutNavigationStateService, getMenuStableKey, groupMenusBySection } from '../../services';
import { containsMenuPath, resolveActiveMenuPath } from '../../utils';
import { SdLayoutContextSwitcher } from '../shared/context-switcher/context-switcher.component';
import { SdLayoutUserMenuComponent } from '../shared/user-menu/user-menu.component';
import { SdSidebarV4MenuTree, buildSidebarV4SearchResults } from './menu-tree/sidebar-v4-menu-tree.component';

/** `SidebarConfigurationV4` as `normalizeSidebarConfiguration` returns it: every V4 default is filled (INV-012). */
type SdSidebarV4ResolvedConfiguration = SidebarConfigurationV4 &
  Required<Pick<SidebarConfigurationV4, 'defaultCollapsed' | 'itemShape' | 'density' | 'collapsedGroup'>> & {
    recent: ResolvedSidebarRecentConfiguration;
  };

/**
 * Sidebar V4 desktop shell: a 280px drawer (72px rail when collapsed) with the brand header and Context Switcher,
 * a pill search (`Ctrl+K` / `⌘K`), Pinned and Recent shortcuts, the V4 menu tree and the account footer.
 * Routed content is projected into `<main>`.
 *
 * Routing, recent/pinned handling and the collapse preference behave like `sd-sidebar-v3`; the collapsed state is
 * stored in the same version 3 entry (D-004). Options are read only after `normalizeSidebarConfiguration` (INV-012);
 * `brandColor` / `brandLightColor` are ignored. Size tokens (`--sd-sidebar-v4-width`, `-rail-width`, `-item-height`,
 * `-child-height`, `-item-radius`) are declared on the host and follow `density`, `itemShape` and the pointer type.
 */
@Component({
  selector: 'sd-sidebar-v4',
  standalone: true,
  imports: [SdIcon, SdLayoutContextSwitcher, SdLayoutUserMenuComponent, SdSidebarV4MenuTree, SdTranslatePipe],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-sidebar-v4',
    '[class.sd-sidebar-v4--collapsed]': 'isCollapsed()',
    '[class.sd-sidebar-v4--soft]': 'configuration().itemShape === "soft"',
    '[class.sd-sidebar-v4--comfortable]': 'configuration().density === "comfortable"',
    '(document:keydown)': 'onDocumentKeydown($event)',
  },
})
export class SdSidebarV4 {
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #changeDetector = inject(ChangeDetectorRef);
  readonly #navigationState = inject(SdLayoutNavigationStateService);
  readonly #document = inject(DOCUMENT);
  readonly #applePlatform = isApplePlatform(this.#document.defaultView?.navigator);
  /** Requested result index; `focusedResultIndex` clamps it to the current results. */
  readonly #focusRequest = signal(0);
  #initialized = false;
  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly mainTree = viewChild.required<SdSidebarV4MenuTree>('mainTree');
  private readonly headerSwitcher = viewChild<SdLayoutContextSwitcher>('headerSwitcher');

  menus = input<SdLayoutMenu[]>([]);
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV4>();

  /** `sidebar()` with the V4 defaults filled by `normalizeSidebarConfiguration`, the only place they are resolved (INV-012). */
  protected readonly configuration = computed(() => normalizeSidebarConfiguration(this.sidebar()) as SdSidebarV4ResolvedConfiguration);
  isCollapsed = signal(false);
  protected readonly collapsedGroupKeys = signal<string[]>([]);
  searchText = signal('');
  activePath = signal(this.#router.url.split(/[?#]/, 1)[0] ?? '');
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

  protected readonly hasQuery = computed(() => !!this.searchText().trim());
  protected readonly title = computed(() => this.configuration().defaultTitle || 'Back Office');
  protected readonly logoInitial = computed(() => Array.from(this.title().trim())[0]?.toLocaleUpperCase() ?? '');
  /** The hierarchy starts with items that have no section heading. */
  protected readonly leadsWithUnsectioned = computed(() => groupMenusBySection(this.menus())[0]?.section === null);
  protected readonly shortcutHint = this.#applePlatform ? '⌘K' : 'Ctrl K';
  protected readonly shortcutKeys = this.#applePlatform ? 'Meta+K' : 'Control+K';
  /** The header Context Switcher popover is open; the whole header then takes the hover background (README CS1). */
  protected readonly contextOpen = computed(() => this.headerSwitcher()?.isOpen() ?? false);

  constructor() {
    effect(() => {
      const menus = this.menus();
      const configuration = this.configuration();
      untracked(() => {
        this.#navigationState.hydrate(menus, configuration.recent.maxItems);
        if (this.#initialized) return;
        const persistedCollapsed = this.#navigationState.versionState(3).collapsed;
        this.isCollapsed.set(typeof persistedCollapsed === 'boolean' ? persistedCollapsed : configuration.defaultCollapsed);
        this.#initialized = true;
      });
    });
    this.#router.events.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
      if (event instanceof NavigationEnd) this.activePath.set(event.urlAfterRedirects.split(/[?#]/, 1)[0] ?? '');
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
  }

  /** Collapses or expands the drawer and stores the choice in the version 3 entry, like V3 (D-004). */
  toggleCollapsed(): void {
    this.#setCollapsed(!this.isCollapsed());
  }

  /** Expands a collapsed drawer, then moves focus to the menu search. */
  focusSearch(): void {
    if (this.isCollapsed()) {
      this.#setCollapsed(false);
      // why: ô search chỉ render khi drawer mở rộng — chạy change detection ngay để có phần tử mà focus.
      this.#changeDetector.detectChanges();
    }
    const field = this.searchInput()?.nativeElement;
    field?.focus();
    field?.select();
  }

  /** Collapsed rail: a leaf navigates; a group expands the drawer and opens that group, like V3. */
  activateCollapsedMenu(menu: SdLayoutMenu): void {
    if ('path' in menu) {
      this.navigateMenu(menu);
      return;
    }
    const key = getMenuStableKey(menu);
    this.#setCollapsed(false);
    this.collapsedGroupKeys.update(keys => keys.filter(current => current !== key));
  }

  navigateMenu(menu: SdLayoutMenu): void {
    if (!('path' in menu)) return;
    this.#navigationState.recordRecent(menu, this.recentConfiguration());
    // why: `includes('http')` là substring test — `javascript:fetch(...)//http` lọt qua và chạy như
    // script trong origin của app. Parse URL thật rồi mới mở, kèm `noopener,noreferrer`.
    if (sdIsExternalHttpUrl(menu.path)) {
      sdOpenExternal(menu.path);
      return;
    }
    void this.#router.navigate([menu.path.split('?')[0]], {
      queryParams: menu.queryParams ?? {},
      state: { switchTab: true },
    });
  }

  onTogglePinned(menu: SdLayoutMenu): void {
    this.#navigationState.togglePinned(menu);
  }

  protected onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchText.set(value);
    this.#focusRequest.set(0);
    // why: kết quả bắt đầu ở đầu list và kết quả đầu được chọn sẵn — bỏ vị trí cuộn cũ của cây để nó luôn thấy được.
    if (value.trim()) this.list().nativeElement.scrollTop = 0;
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
        if (!this.searchText()) return;
        event.preventDefault();
        this.#clearQuery();
    }
  }

  protected onDocumentKeydown(event: KeyboardEvent): void {
    // why: phím tắt đã được phần khác xử lý (defaultPrevented) thì nhường; chỉ preventDefault khi V4 thật sự xử lý.
    if (event.defaultPrevented || !this.#isSearchShortcut(event) || this.#focusIsInOverlay()) return;
    event.preventDefault();
    this.focusSearch();
  }

  /** Focus sits in a modal dialog or a CDK overlay (popover, flyout, menu); the shortcut must not pull it to the drawer behind. */
  #focusIsInOverlay(): boolean {
    return !!this.#document.activeElement?.closest('[aria-modal="true"], .cdk-overlay-container');
  }

  #revealResult(index: number): void {
    // why: listbox cuộn trong nav — option được chọn phải luôn nằm trong vùng thấy được, nếu không Enter mở một mục người
    // dùng không thấy (WCAG 2.4.11). Option đã render sẵn nên cuộn ngay, không cần chờ render.
    this.#document.getElementById(this.mainTree().resultOptionId(index))?.scrollIntoView({ block: 'nearest' });
  }

  #isSearchShortcut(event: KeyboardEvent): boolean {
    // why: bàn phím không phải Latin (vd tiếng Nga) cho `key` khác 'k' — chỉ khi đó mới dựa vào phím vật lý KeyK; bố cục
    // Latin khác (Colemak, Dvorak) giữ nguyên chữ của nó, không chiếm Ctrl/⌘ + chữ đang nằm ở vị trí KeyK.
    const key = event.key ?? '';
    const isK = /^[a-z]$/i.test(key) ? key.toLowerCase() === 'k' : event.code === 'KeyK';
    if (!isK || event.altKey || event.shiftKey) return false;
    // why: Ctrl+K trên Mac là phím sửa dòng của ô nhập — chỉ nhận ⌘K ở đó, và Ctrl+K ở nền tảng khác.
    return this.#applePlatform ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
  }

  #clearQuery(): void {
    this.searchText.set('');
    this.#focusRequest.set(0);
    // why: cây hiện lại thay cho kết quả — bắt đầu từ đầu list thay vì giữ vị trí cuộn của danh sách kết quả.
    this.list().nativeElement.scrollTop = 0;
  }

  #setCollapsed(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
    this.#navigationState.patchVersionState(3, { collapsed });
  }
}

function isApplePlatform(navigator: Navigator | undefined): boolean {
  const userAgentData = (navigator as (Navigator & { userAgentData?: { platform?: string } }) | undefined)?.userAgentData;
  return /mac|iphone|ipad|ipod/i.test(userAgentData?.platform || navigator?.platform || '');
}
