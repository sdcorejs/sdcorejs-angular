import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdLayoutUserInfo, SidebarConfigurationV3, resolveSidebarV3Recent } from '../../configurations';
import { SdLayoutMenu, SdLayoutNavigationStateService, SdLayoutRootMenu, getMenuStableKey, searchMenuLeaves } from '../../services';
import { SdLayoutMenuTreeComponent } from '../shared/menu-tree/menu-tree.component';
import { SdLayoutSearchFieldComponent } from '../shared/search-field/search-field.component';
import { SdLayoutUserMenuComponent } from '../shared/user-menu/user-menu.component';

@Component({
  selector: 'sidebar-v3',
  standalone: true,
  imports: [SdIcon, SdLayoutSearchFieldComponent, SdLayoutMenuTreeComponent, SdLayoutUserMenuComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarV3Component {
  readonly #router = inject(Router);
  readonly #document = inject(DOCUMENT);
  readonly #destroyRef = inject(DestroyRef);
  readonly #navigationState = inject(SdLayoutNavigationStateService);
  #initialized = false;

  menus = input<SdLayoutMenu[]>([]);
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV3>();
  isCollapsed = signal(false);
  searchText = signal('');
  activePath = signal(this.#router.url.split(/[?#]/, 1)[0] ?? '');
  searchResults = computed<SdLayoutRootMenu[]>(() => searchMenuLeaves(this.menus(), this.searchText()));
  recentConfiguration = computed(() => resolveSidebarV3Recent(this.sidebar()));
  pinnedKeys = this.#navigationState.pinnedKeys;
  pinnedMenus = this.#navigationState.pinnedMenus;
  recentMenus = this.#navigationState.recentMenus;
  collapsedItems = computed(() =>
    this.menus().map(menu => ({ menu, key: getMenuStableKey(menu), title: menu.tooltipTitle || menu.title || 'Menu' }))
  );

  constructor() {
    effect(() => {
      const menus = this.menus();
      const sidebar = this.sidebar();
      const recentConfiguration = resolveSidebarV3Recent(sidebar);
      untracked(() => {
        this.#navigationState.hydrate(menus, recentConfiguration.maxItems);
        if (this.#initialized) return;
        const persistedCollapsed = this.#navigationState.versionState(3).collapsed;
        this.isCollapsed.set(typeof persistedCollapsed === 'boolean' ? persistedCollapsed : (sidebar.defaultCollapsed ?? false));
        this.#initialized = true;
      });
    });
    this.#router.events.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
      if (event instanceof NavigationEnd) this.activePath.set(event.urlAfterRedirects.split(/[?#]/, 1)[0] ?? '');
    });
  }

  toggleCollapsed(): void {
    this.isCollapsed.update(collapsed => !collapsed);
    this.#navigationState.patchVersionState(3, { collapsed: this.isCollapsed() });
  }

  activateCollapsedMenu(menu: SdLayoutMenu): void {
    if ('path' in menu) this.navigateMenu(menu);
    else {
      this.isCollapsed.set(false);
      this.#navigationState.patchVersionState(3, { collapsed: false });
    }
  }

  navigateMenu(menu: SdLayoutMenu): void {
    if (!('path' in menu)) return;
    this.#navigationState.recordRecent(menu, this.recentConfiguration());
    if (menu.path.includes('http')) {
      this.#document.defaultView?.open(menu.path, '_blank', 'noopener');
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
}
