import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { sdIsExternalHttpUrl, sdOpenExternal } from '@sdcorejs/angular/utilities';
import { SdLayoutUserInfo, SidebarConfigurationV2, resolveSidebarV2Interaction } from '../../configurations';
import { SdLayoutMenu, SdLayoutNavigationStateService, getMenuStableKey } from '../../services';
import { SdLayoutMenuTreeComponent } from '../shared/menu-tree/menu-tree.component';
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
import { SdLayoutUserMenuComponent } from '../shared/user-menu/user-menu.component';

interface SidebarV2RailItem {
  menu: SdLayoutMenu;
  key: string;
  title: string;
}

@Component({
  selector: 'sd-sidebar-v2',
  standalone: true,
  imports: [SdIcon, SdLayoutSearchFieldComponent, SdLayoutMenuTreeComponent, SdLayoutUserMenuComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // why: Escape-để-đóng-flyout gom về HOST. Trước đây handler nằm trên div bọc và trên <section>
  // flyout — cả hai đều không focusable nên chỉ chạy nhờ event nổi bọt từ con, đồng thời khai
  // interaction handler trên phần tử không nhận được focus. Host là tổ tiên của tất cả nên hành vi
  // giữ nguyên hệt như cũ.
  host: {
    '(keydown.escape)': 'closeFromEscape()',
  },
})
export class SdSidebarV2 {
  readonly #router = inject(Router);
  readonly #destroyRef = inject(DestroyRef);
  readonly #navigationState = inject(SdLayoutNavigationStateService);

  menus = input<SdLayoutMenu[]>([]);
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV2>();
  activeGroupKey = signal('');
  isFlyoutOpen = signal(false);
  isFlyoutLocked = signal(false);
  searchText = signal('');
  activePath = signal(this.#router.url.split(/[?#]/, 1)[0] ?? '');

  interaction = computed(() => resolveSidebarV2Interaction(this.sidebar()));
  railItems = computed<SidebarV2RailItem[]>(() =>
    this.menus()
      .map(menu => ({ menu, key: getMenuStableKey(menu), title: menu.tooltipTitle || menu.title || 'Menu' }))
      .filter(item => !!item.key)
  );
  activeGroup = computed(() => this.railItems().find(item => item.key === this.activeGroupKey())?.menu);
  contextMenus = computed<SdLayoutMenu[]>(() => {
    const activeGroup = this.activeGroup();
    if (!activeGroup) return [];
    return 'children' in activeGroup && activeGroup.children?.length ? activeGroup.children : [activeGroup];
  });
  pinnedKeys = this.#navigationState.pinnedKeys;

  constructor() {
    effect(() => {
      const menus = this.menus();
      untracked(() => {
        this.#navigationState.hydrate(menus);
        const persistedState = this.#navigationState.versionState(2);
        if (persistedState.activeGroupKey && !this.activeGroupKey()) this.activeGroupKey.set(persistedState.activeGroupKey);
      });
    });
    this.#router.events.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
      if (!(event instanceof NavigationEnd)) return;
      this.activePath.set(event.urlAfterRedirects.split(/[?#]/, 1)[0] ?? '');
      this.closeFromNavigation();
    });
  }

  selectGroup(menu: SdLayoutMenu): void {
    const key = getMenuStableKey(menu);
    if (!key) return;

    if (this.interaction() === 'click') {
      if (this.activeGroupKey() === key && this.isFlyoutOpen()) {
        this.#closeFlyout();
        return;
      }
      this.#openGroup(key, false);
      return;
    }

    if (this.activeGroupKey() === key && this.isFlyoutLocked()) {
      this.#closeFlyout();
      return;
    }
    this.#openGroup(key, true);
  }

  previewGroup(menu: SdLayoutMenu): void {
    if (this.interaction() !== 'hover-lock' || this.isFlyoutLocked()) return;
    const key = getMenuStableKey(menu);
    if (key) this.#openGroup(key, false, false);
  }

  leaveFlyout(): void {
    if (this.interaction() === 'hover-lock' && !this.isFlyoutLocked()) this.#closeFlyout(false);
  }

  closeFromBackdrop(): void {
    this.#closeFlyout();
  }

  closeFromEscape(): void {
    this.#closeFlyout();
  }

  closeFromNavigation(): void {
    this.#closeFlyout();
  }

  onNavigate(menu: SdLayoutMenu): void {
    if (!('path' in menu)) return;
    this.#navigationState.recordRecent(menu, { enabled: true, maxItems: 5 });
    // why: `includes('http')` là substring test — `javascript:fetch(...)//http` lọt qua và chạy như
    // script trong origin của app. Parse URL thật rồi mới mở, kèm `noopener,noreferrer`.
    if (sdIsExternalHttpUrl(menu.path)) {
      sdOpenExternal(menu.path);
      this.closeFromNavigation();
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

  #openGroup(key: string, locked: boolean, persist = true): void {
    this.activeGroupKey.set(key);
    this.isFlyoutOpen.set(true);
    this.isFlyoutLocked.set(locked);
    this.searchText.set('');
    if (persist) this.#navigationState.patchVersionState(2, { activeGroupKey: key, locked });
  }

  #closeFlyout(persist = true): void {
    this.isFlyoutOpen.set(false);
    this.isFlyoutLocked.set(false);
    this.searchText.set('');
    if (persist) this.#navigationState.patchVersionState(2, { locked: false });
  }
}
