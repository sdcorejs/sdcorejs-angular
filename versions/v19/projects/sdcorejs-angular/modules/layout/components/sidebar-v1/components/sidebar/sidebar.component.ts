import { NestedTreeControl } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NavigationEnd, Params, Router, RouterModule } from '@angular/router';

import { SdInput, SdSuffixDefDirective } from '@sdcorejs/angular/forms';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdSafeHtmlPipe } from '@sdcorejs/angular/pipes';
import { BrowserUtilities, StringUtilities } from '@sdcorejs/utils/fns';

// NOTE: Import ná»™i bá»™ trong module layout
import { SdLayoutUserInfo, SidebarConfigurationV1 } from '../../../../configurations';
import { HighlightSearchPipe, MenuFocusPipe } from '../../../../pipes';
import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutStorageService } from '../../../../services';
import { LayoutUserComponent } from '../user/user.component';

@Component({
  selector: 'sidebar',
  standalone: true,
  imports: [
    SdInput,
    FormsModule,
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTreeModule,
    SdSafeHtmlPipe,
    MatInputModule,
    MenuFocusPipe,
    MatTooltipModule,
    HighlightSearchPipe,
    SdSuffixDefDirective,
    LayoutUserComponent,
    TranslatePipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  // ==========================================
  // INJECT SERVICES (Thay tháº¿ Constructor rÆ°á»m rÃ )
  // ==========================================
  #router = inject(Router);
  #layoutStorageService = inject(SdLayoutStorageService);
  #menuFocusPipe = inject(MenuFocusPipe);
  #destroyRef = inject(DestroyRef); // DÃ¹ng Ä‘á»ƒ unsubscribe RxJS tá»± Ä‘á»™ng

  // ==========================================
  // SIGNAL INPUTS & OUTPUTS
  // ==========================================
  isShowSidebar = input.required<boolean>();
  menus = input.required<SdLayoutMenu[]>();
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV1>();
  expandSideBar = output<void>();
  popupUserMenuClosed = output<void>();
  popupUserMenuOpened = output<void>();
  showSideBar = output<boolean | null>();

  // ==========================================
  // STATE SIGNALS
  // ==========================================
  screenHeight = window.innerHeight;
  isMobileOrTablet = BrowserUtilities.isMobile();
  isMenuLock = signal<boolean>(this.#layoutStorageService.menuLockStatus?.get() ?? true);
  currentPath = signal<string>(window.location.pathname);
  searchText = signal<string>('');
  titleMenuGroup = signal<string | undefined>('');
  idMenuGroupActive = signal<string | undefined>('');
  menusByGroup = signal<SdLayoutMenu[]>([]);
  #hoveredMenuNodeKey = signal<string | null>(null);
  #pinIconHoverTimerId = signal<ReturnType<typeof setTimeout> | null>(null);
  pinnedMenuGroup = signal<SdLayoutChildrenMenu>(
    this.#layoutStorageService.pinnedMenuGroup.get() ?? {
      id: 'pinned-menu-group',
      title: 'ÄÃ£ ghim',
      children: [],
    }
  );

  // ==========================================
  // COMPUTED STATE
  // ==========================================
  totalMenuInMenusByGroup = computed(() => this.#getTotalMenus(this.menusByGroup()));
  pinnedNodeKeys = computed(() => new Set(this.pinnedMenuGroup().children?.map(m => this.#getMenuNodeKey(m)) ?? []));
  isPinnedMenuGroupActive = computed(() => this.idMenuGroupActive() === this.pinnedMenuGroup().id);

  // ==========================================
  // DATA STRUCTURES
  // ==========================================
  #pinIconHoverTimerDelay: number = 300;
  #isFirstBindingMenu = signal<boolean>(true);
  dataSource = new MatTreeNestedDataSource<SdLayoutMenu>();
  treeControl = new NestedTreeControl<SdLayoutMenu>(node => ('children' in node && node.children?.length ? node.children : []));

  constructor() {
    this.#setupEffects();
    this.#setupSubscriptions();
  }

  #setupEffects(): void {
    effect(() => {
      const currentMenus = this.menus();
      untracked(() => {
        const lastActiveMenuGroupId = this.#layoutStorageService.lastActiveMenuGroupId.get();
        const pinnedGroup = this.pinnedMenuGroup();
        const isPinEnabled = this.sidebar()?.pin?.enabled;
        // Xá»­ lÃ½ khi láº§n Ä‘áº§u vÃ o web (náº¿u chÆ°a cÃ³ active group)
        if (!lastActiveMenuGroupId || (lastActiveMenuGroupId === pinnedGroup?.id && !isPinEnabled)) {
          // Æ¯u tiÃªn pinnedGroup náº¿u Ä‘á»§ Ä‘iá»u kiá»‡n, cÃ²n khÃ´ng láº¥y menu Ä‘áº§u tiá»n dev khai bÃ¡o
          const targetId = isPinEnabled && pinnedGroup?.children?.length ? pinnedGroup?.id : currentMenus?.[0]?.id;
          this.#layoutStorageService.lastActiveMenuGroupId.set(targetId ?? '');
        }

        this.#bindingMenuGroupByCurrentPath(currentMenus);
        this.#isFirstBindingMenu.set(false);
      });
    });
  }

  #setupSubscriptions(): void {
    this.#router.events.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        if (this.currentPath() !== window.location.pathname) {
          this.currentPath.set(window.location.pathname);
          this.#bindingMenuGroupByCurrentPath(this.menus());
        }
      }
    });
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  hasChild = (_: number, node: SdLayoutMenu): boolean => 'children' in node && !!node.children?.length;

  onToggleMenuNode = (menu: SdLayoutMenu): void => {
    this.treeControl.toggle(menu);
  };

  isPinnedNode = (node: SdLayoutMenu): boolean => this.pinnedNodeKeys().has(this.#getMenuNodeKey(node));
  isHoveredNode = (node: SdLayoutMenu): boolean => this.#hoveredMenuNodeKey() === this.#getMenuNodeKey(node);

  expandPinnedGroup = (): void => {
    const group = this.pinnedMenuGroup();
    this.idMenuGroupActive.set(group.id);
    this.#layoutStorageService.lastActiveMenuGroupId.set(group.id || '');
    this.titleMenuGroup.set(group.title);
    this.#setMenusByGroup(group.children ?? []);
    this.searchText.set('');
    this.expandSideBar.emit();
  };

  onTogglePin = (event: MouseEvent, node: SdLayoutMenu): void => {
    event.stopPropagation();
    const key = this.#getMenuNodeKey(node);
    this.pinnedMenuGroup.update(group => {
      const children = group.children ?? [];
      const exists = children.some(m => this.#getMenuNodeKey(m) === key);
      const updatedChildren = exists ? children.filter(m => this.#getMenuNodeKey(m) !== key) : [...children, node];
      const updatedGroup = { id: 'pinned-menu-group', title: 'ÄÃ£ ghim', children: updatedChildren };
      this.#layoutStorageService.pinnedMenuGroup.set(updatedGroup);
      return updatedGroup;
    });
  };

  #onExpandAllMenuNodes = (menus: SdLayoutMenu[]): void => {
    menus?.forEach(menu => {
      this.treeControl.expand(menu);
      if ('children' in menu && menu.children?.length) {
        this.#onExpandAllMenuNodes(menu.children);
      }
    });
  };

  #onCollapseAllMenuNodes = (menus: SdLayoutMenu[]): void => {
    menus?.forEach(menu => {
      this.treeControl.collapse(menu);
      if ('children' in menu && menu.children?.length) {
        this.#onCollapseAllMenuNodes(menu.children);
      }
    });
  };

  toggleMenuLock(event: Event): void {
    event.stopPropagation();
    this.isMenuLock.update(v => !v);
    this.#layoutStorageService.menuLockStatus?.set(this.isMenuLock());
    this.showSideBar.emit(this.isMenuLock());
  }

  openHomePage = (): void => {
    if (!this.isMobileOrTablet) {
      this.#router.navigateByUrl('/layout/home');
    } else {
      window.location.href = '/layout/home';
    }
    this.searchText.set('');
    this.#layoutStorageService.lastActiveMenuGroupId.set('');
  };

  onUserMenuClosed = (): void => this.popupUserMenuClosed.emit();

  onUserMenuOpened = (): void => this.popupUserMenuOpened.emit();

  navigate = (args: { path: string; queryParams: Params }): void => {
    const { path, queryParams } = args;
    if (path.includes('http')) {
      window.open(path);
      return;
    }
    this.#router.navigate([path.split('?')[0]], {
      queryParams,
      state: { switchTab: true },
    });

    if (this.isMobileOrTablet) {
      this.#closeMenu();
    }
  };

  onFilterSearchText = (event: string): void => {
    this.searchText.set(event);
    this.#filterMenuBySearchText(this.menusByGroup());
  };

  onClearSearchText = (): void => {
    this.searchText.set('');
    this.#filterMenuBySearchText(this.menusByGroup());
  };

  expandMenuGroup = (menuGroupNode: SdLayoutMenu): void => {
    this.titleMenuGroup.set(menuGroupNode?.tooltipTitle || menuGroupNode?.title);

    // Case 1: Menu khÃ´ng cÃ³ children
    if (!('children' in menuGroupNode && menuGroupNode.children?.length)) {
      if ('path' in menuGroupNode) {
        this.navigate({ path: menuGroupNode.path, queryParams: menuGroupNode?.queryParams ?? {} });
        return;
      }
    }

    // Case 2: Menu cÃ³ children
    if ('children' in menuGroupNode && menuGroupNode.children?.length) {
      this.#setMenusByGroup(menuGroupNode.children);
      this.searchText.set('');
      this.onFilterSearchText('');
      this.expandSideBar.emit();
    }

    this.idMenuGroupActive.set(menuGroupNode?.id);
    this.#layoutStorageService.lastActiveMenuGroupId.set(menuGroupNode?.id || '');
    if (!this.currentPath()) {
      this.currentPath.set(window.location.pathname);
    }
  };

  // ==========================================
  // Cá»¤M HOVER MENU GROUP & NODE
  // ==========================================
  onMouseOverMenuGroupNode = (event: MouseEvent, menuNode: SdLayoutMenu): void => {
    if (this.idMenuGroupActive() !== menuNode?.id) {
      const menuGroup = event.currentTarget as HTMLElement;
      const menuGroupIcon = menuGroup.querySelector('.c-menu-group-icon') as HTMLElement;
      const brandLightColorOpacity = this.#convertColor(this.sidebar()?.brandLightColor, 0.6);

      if (menuGroupIcon) {
        menuGroupIcon.style.transition = 'all 0.15s';
        menuGroupIcon.style.backgroundColor = brandLightColorOpacity || 'rgba(248, 249, 250, 0.6)';
        if (!(menuGroupIcon instanceof HTMLImageElement)) {
          menuGroupIcon.style.color = this.sidebar()?.brandColor || '#2962FF';
        }
      }
    }
  };

  onMouseLeaveMenuGroupNode = (event: MouseEvent, menuNode: SdLayoutMenu): void => {
    if (this.idMenuGroupActive() !== menuNode?.id) {
      const menuGroup = event.currentTarget as HTMLElement;
      const menuGroupIcon = menuGroup.querySelector('.c-menu-group-icon') as HTMLElement;

      if (menuGroupIcon) {
        menuGroupIcon.style.transition = 'all 0.15s';
        menuGroupIcon.style.backgroundColor = 'transparent';
        if (menuGroupIcon instanceof HTMLImageElement) {
          menuGroupIcon.style.opacity = '0.55';
        } else {
          menuGroupIcon.style.color = '#8C8C8C';
        }
      }
    }
  };

  onMouseOverMenuNode = (event: MouseEvent, menuItem: SdLayoutMenu): void => {
    const menuNode = event.currentTarget as HTMLElement;
    const brandColor = this.sidebar()?.brandColor || '#2962FF';

    // Náº¿u cÃ³ báº­t config pin menu
    if (this.sidebar()?.pin?.enabled) {
      const iconPin = menuNode.querySelector('.c-menu-node-description-icon-pin') as HTMLElement;
      if (iconPin) {
        if (this.#pinIconHoverTimerId()) {
          clearTimeout(this.#pinIconHoverTimerId()!);
          this.#pinIconHoverTimerId.set(null);
        }

        this.#pinIconHoverTimerId.set(
          setTimeout(() => {
            this.#hoveredMenuNodeKey.set(this.#getMenuNodeKey(menuItem));
            iconPin.style.color = brandColor;
            iconPin.style.transition = 'all 0.15s';
            iconPin.style.opacity = '1';
            this.#pinIconHoverTimerId.set(null);
          }, this.#pinIconHoverTimerDelay)
        );
      }
    }

    if (!this.#menuFocusPipe.transform(this.currentPath(), menuItem)) {
      const iconMenu = menuNode.querySelector('.c-menu-node-icon') as HTMLElement;
      const content = menuNode.querySelector('.c-menu-node-description-content') as HTMLElement;
      const iconExpand = menuNode.querySelector('.c-menu-node-description-icon-expand') as HTMLElement;
      const brandLightColorOpacity = this.#convertColor(this.sidebar()?.brandLightColor, 0.6);

      if (menuNode) {
        menuNode.style.transition = 'all 0.15s';
        menuNode.style.backgroundColor = brandLightColorOpacity || 'rgba(248, 249, 250, 0.6)';

        if (iconMenu) {
          iconMenu.style.transition = 'all 0.15s';
          iconMenu.style.color = brandColor;
        }
        if (content) {
          content.style.transition = 'all 0.15s';
          content.style.color = brandColor;
        }
        if (iconExpand) {
          iconExpand.style.transition = 'all 0.15s';
          iconExpand.style.color = brandColor;
        }
      }
    }
  };

  onMouseLeaveMenuNode = (event: MouseEvent, menuItem: SdLayoutMenu): void => {
    const menuNode = event.currentTarget as HTMLElement;

    // Náº¿u cÃ³ báº­t config pin menu
    if (this.sidebar()?.pin?.enabled) {
      const iconPin = menuNode.querySelector('.c-menu-node-description-icon-pin') as HTMLElement;
      if (iconPin) {
        if (this.#pinIconHoverTimerId()) {
          clearTimeout(this.#pinIconHoverTimerId()!);
          this.#pinIconHoverTimerId.set(null);
        }
        this.#hoveredMenuNodeKey.set(null);

        iconPin.style.transition = 'all 0.15s';
        if (!this.isPinnedNode(menuItem)) {
          iconPin.style.color = '#8C8C8C';
          iconPin.style.opacity = '0';
        }
      }
    }

    if (!this.#menuFocusPipe.transform(this.currentPath(), menuItem)) {
      const iconMenu = menuNode.querySelector('.c-menu-node-icon') as HTMLElement;
      const content = menuNode.querySelector('.c-menu-node-description-content') as HTMLElement;
      const iconExpand = menuNode.querySelector('.c-menu-node-description-icon-expand') as HTMLElement;

      if (menuNode) {
        menuNode.style.transition = 'all 0.15s';
        menuNode.style.backgroundColor = 'transparent';

        if (iconMenu) {
          iconMenu.style.transition = 'all 0.15s';
          iconMenu.style.color = '#8C8C8C';
        }
        if (content) {
          content.style.transition = 'all 0.15s';
          content.style.color = '#1F1F1F';
        }
        if (iconExpand) {
          iconExpand.style.transition = 'all 0.15s';
          iconExpand.style.color = '#8C8C8C';
        }
      }
    }
  };

  // ==========================================
  // PRIVATE LOGIC
  // ==========================================
  #setMenusByGroup = (menus: SdLayoutMenu[]): void => {
    this.menusByGroup.set(menus);
    this.dataSource.data = menus;
  };

  #getMenuNodeKey = (node: SdLayoutMenu): string => {
    if (node?.id) {
      return node.id;
    }
    if ('path' in node && node.path) {
      return node.path;
    }

    return node.title || '';
  };

  #getMenuGroupByCurrentPath = (menus: SdLayoutMenu[], menuGroup?: SdLayoutMenu): SdLayoutMenu[] => {
    for (const menu of menus) {
      if ('path' in menu && this.#isMenuPathMatchByCurrentPath(menu.path)) {
        return [menuGroup ?? menu];
      }
      if ('children' in menu && menu.children?.length) {
        const result = this.#getMenuGroupByCurrentPath(menu.children, menuGroup ?? menu);
        if (result?.length) {
          return result;
        }
      }
    }
    return [];
  };

  #bindingMenuGroupByCurrentPath = (menus: SdLayoutMenu[]): void => {
    // Chá»‰ bindingGroup má»›i khi ngÆ°á»i dÃ¹ng khÃ´ng searchText
    if (!this.#getValidSearchText()) {
      const pinnedChildren = this.pinnedMenuGroup()?.children ?? [];

      // Æ¯u tiÃªn: Current path khá»›p vá»›i item trong pinMenuGroup thÃ¬ láº§n Ä‘áº§u vÃ o trang sáº½ hiá»‡n pinnedMenuGroup
      const isPinnedPathMatchValid =
        this.sidebar()?.pin?.enabled &&
        pinnedChildren?.length &&
        this.#getMenuGroupByCurrentPath(pinnedChildren)?.length &&
        this.#isFirstBindingMenu() &&
        this.idMenuGroupActive() !== this.pinnedMenuGroup()?.id;

      if (isPinnedPathMatchValid) {
        const pinned = this.pinnedMenuGroup();
        this.idMenuGroupActive.set(pinned.id);
        this.#layoutStorageService.lastActiveMenuGroupId.set(pinned.id ?? '');
        this.titleMenuGroup.set(pinned.title);
        this.#setMenusByGroup(pinnedChildren);
        this.#expandParentNodesByCurrentPath(pinnedChildren);
        return;
      }

      let menuGroupByPath = this.#getMenuGroupByCurrentPath(menus);
      // Náº¿u khÃ´ng tÃ¬m Ä‘Æ°á»£c path nÃ o khá»›p vá»›i menu
      if (!menuGroupByPath?.length) {
        const lastActiveId = this.#layoutStorageService.lastActiveMenuGroupId.get() || '';
        // Náº¿u cÃ³ pinned group thÃ¬ hiá»‡n máº­c Ä‘á»‹nh lÃ  pinnedMenuGroup
        if (this.sidebar()?.pin?.enabled && lastActiveId === this.pinnedMenuGroup()?.id && pinnedChildren?.length) {
          const pinned = this.pinnedMenuGroup();
          this.idMenuGroupActive.set(pinned.id);
          this.titleMenuGroup.set(pinned.title);
          this.#setMenusByGroup(pinnedChildren);
          this.#expandParentNodesByCurrentPath(pinnedChildren);
          return;
        }
        // Náº¿u khÃ´ng cÃ³ pinnedMenuGroup thÃ¬ menuGroup láº¥y tá»« thao tÃ¡c cuá»‘i cÃ¹ng cá»§a ngÆ°á»i dÃ¹ng
        menuGroupByPath = this.menus()?.filter(menu => menu?.id === lastActiveId) || [];
      }

      // Kiá»ƒm tra láº¡i menuGroupPath Ä‘Ã£ thá»±c sá»± tÃ¬m Ä‘Æ°á»£c chÆ°a?
      if (menuGroupByPath?.length) {
        // Náº¿u user Ä‘ang á»Ÿ pinedGroup vÃ  curentPath cÃ³ chá»©a trong pinnedMenuGroup thÃ¬ return luÃ´n, khÃ´ng chuyá»ƒn sang menuGroup má»›i
        if (
          this.sidebar()?.pin?.enabled &&
          this.idMenuGroupActive() === this.pinnedMenuGroup()?.id &&
          this.#getMenuGroupByCurrentPath(pinnedChildren)?.length
        ) {
          return;
        } else {
          const matchedGroup = menuGroupByPath[0];
          this.idMenuGroupActive.set(matchedGroup?.id);
          this.#layoutStorageService.lastActiveMenuGroupId.set(matchedGroup?.id || '');
          this.titleMenuGroup.set(matchedGroup?.tooltipTitle || matchedGroup?.title);

          if ('children' in matchedGroup && matchedGroup.children?.length) {
            this.menusByGroup.set(matchedGroup.children);
            this.#expandParentNodesByCurrentPath(this.menusByGroup());
          } else {
            this.menusByGroup.set([]);
          }
        }
      } else {
        this.idMenuGroupActive.set('');
        this.titleMenuGroup.set('');
        this.menusByGroup.set([]);
      }

      this.dataSource.data = this.menusByGroup();
    }
  };

  #expandParentNodesByCurrentPath(menus: SdLayoutMenu[]): boolean {
    let shouldPropagate = false;
    for (const menu of menus) {
      if ('path' in menu && this.#isMenuPathMatchByCurrentPath(menu.path)) {
        shouldPropagate = true;
      }
      if ('children' in menu && menu.children?.length) {
        const childHasMatch = this.#expandParentNodesByCurrentPath(menu.children);
        if (childHasMatch) {
          this.treeControl.expand(menu);
          shouldPropagate = true;
        }
      }
    }
    return shouldPropagate;
  }

  #filterMenuBySearchText = (menus: SdLayoutMenu[]): void => {
    const validSearchText = this.#getValidSearchText();
    if (!validSearchText) {
      this.dataSource.data = menus;
      this.#onCollapseAllMenuNodes(menus);
      this.#expandParentNodesByCurrentPath(menus);
    } else {
      const aliasSearchText = StringUtilities.changeAliasLowerCase(validSearchText);
      this.dataSource.data = this.#getMenuByAliasSearchText(menus, aliasSearchText);
      if (this.dataSource.data?.length) {
        this.#onExpandAllMenuNodes(this.dataSource.data);
      }
    }
  };

  #getMenuByAliasSearchText = (menus: SdLayoutMenu[], aliasSearchText: string): SdLayoutMenu[] => {
    const result: SdLayoutMenu[] = [];
    for (const menu of menus) {
      const aliasTitle = StringUtilities.changeAliasLowerCase(menu.title as string);

      if (aliasTitle.includes(aliasSearchText)) {
        result.push(menu);
        continue;
      }

      let matchedChildren: SdLayoutMenu[] = [];
      if ('children' in menu && menu.children?.length) {
        matchedChildren = this.#getMenuByAliasSearchText(menu.children, aliasSearchText);
      }

      if (matchedChildren?.length) {
        result.push({ ...menu, children: matchedChildren });
      }
    }
    return result;
  };

  #isMenuPathMatchByCurrentPath = (path: string): boolean => {
    if (!path) {
      return false;
    }

    if (this.currentPath() === path) {
      return true;
    }

    return this.#normalizePath(this.currentPath()).startsWith(this.#normalizePath(path));
  };

  #normalizePath = (p: string): string => (p.endsWith('/') ? p : p + '/');

  #closeMenu(): void {
    this.showSideBar.emit(null);
  }

  #convertColor = (input: string | undefined, opacity = 1): string => {
    if (!input) {
      return '';
    }

    input = input.trim();
    const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    const rgbRegex = /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i;

    if (hexRegex.test(input)) {
      let hex = input.slice(1);
      if (hex.length === 3) {
        hex = hex
          .split('')
          .map(c => c + c)
          .join('');
      }
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    const rgbMatch = input.match(rgbRegex);
    if (rgbMatch) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, r, g, b] = rgbMatch;
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }

    return input;
  };

  #getValidSearchText = (): string => {
    const normalized = this.#normalizeSearchText(this.searchText());
    return normalized && normalized.length >= 2 ? normalized : '';
  };

  #normalizeSearchText = (searchText: string) => {
    let str: string = searchText?.toString() ?? '';
    /* eslint-disable no-useless-escape */
    str = str.replace(/!|@|%|\^|\*|\(|\)|\+|\=|\<|\>|\?|\/|,|\.|\:|\;|\'|\"|\&|\#|\[|\]|~|\$|_|`|-|{|}|\||\\/g, '');
    str = str.replace(/ + /g, ' ');
    return str.trim();
  };

  #getTotalMenus = (menus: SdLayoutMenu[]): number => {
    return menus.reduce((total, menu) => total + this.#countMenuChildrenNode(menu), 0);
  };

  #countMenuChildrenNode = (menu: SdLayoutMenu): number => {
    if (!('children' in menu) || !menu.children?.length) {
      return 0;
    }

    let count = menu.children.length;
    for (const child of menu.children) {
      count += this.#countMenuChildrenNode(child);
    }
    return count;
  };
}

