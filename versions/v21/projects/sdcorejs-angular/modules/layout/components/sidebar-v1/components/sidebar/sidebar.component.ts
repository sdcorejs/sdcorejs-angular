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
import { SdUtilities } from '@sdcorejs/angular/utilities';

// NOTE: Import ná»™i bá»™ trong module layout
import { SdLayoutUserInfo, SidebarConfigurationV1 } from '../../../../configurations';
import { HighlightSearchPipe, MenuFocusPipe } from '../../../../pipes';
import { SdLayoutMenu, SdLayoutStorageService } from '../../../../services';
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
  isMobileOrTablet = SdUtilities.isMobile();
  isMenuLock = signal<boolean>(this.#layoutStorageService.menuLockStatus?.get() ?? true);
  currentPath = signal<string>(window.location.pathname);
  searchText = signal<string>('');
  titleMenuGroup = signal<string | undefined>('');
  idMenuGroupActive = signal<string | undefined>('');
  menusByGroup = signal<SdLayoutMenu[]>([]);

  // ==========================================
  // COMPUTED STATE
  // ==========================================
  totalMenuInMenusByGroup = computed(() => this.#getTotalMenus(this.menusByGroup()));

  // ==========================================
  // DATA STRUCTURES
  // ==========================================
  dataSource = new MatTreeNestedDataSource<SdLayoutMenu>();
  treeControl = new NestedTreeControl<SdLayoutMenu>(node => ('children' in node && node.children?.length ? node.children : []));

  constructor() {
    // 1. EFFECT: Láº¯ng nghe menus Ä‘áº§u vÃ o thay Ä‘á»•i
    effect(() => {
      const currentMenus = this.menus();

      untracked(() => {
        const lastActiveMenuGroupId = this.#layoutStorageService.lastActiveMenuGroupId.get();
        // Láº§n Ä‘áº§u vÃ o web, náº¿u user chÆ°a thao tÃ¡c gÃ¬ sáº½ máº·c Ä‘á»‹nh hiá»‡n menuGroup Ä‘áº§u tiÃªn
        if (!lastActiveMenuGroupId) {
          this.#layoutStorageService.lastActiveMenuGroupId.set(currentMenus?.[0]?.id ?? '');
        }
        this.#bindingMenuGroupByCurrentPath(currentMenus);
      });
    });

    // 2. Láº¯ng nghe Router Event (Sá»­ dá»¥ng takeUntilDestroyed thay tháº¿ ngOnDestroy)
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
      this.menusByGroup.set(menuGroupNode.children);
      this.dataSource.data = this.menusByGroup();
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
    if (!this.#menuFocusPipe.transform(this.currentPath(), menuItem)) {
      const menuNode = event.currentTarget as HTMLElement;
      const iconMenu = menuNode.querySelector('.c-menu-node-icon') as HTMLElement;
      const content = menuNode.querySelector('.c-menu-node-description-content') as HTMLElement;
      const iconExpand = menuNode.querySelector('.c-menu-node-description-icon-expand') as HTMLElement;
      const brandLightColorOpacity = this.#convertColor(this.sidebar()?.brandLightColor, 0.6);

      if (menuNode) {
        menuNode.style.transition = 'all 0.15s';
        menuNode.style.backgroundColor = brandLightColorOpacity || 'rgba(248, 249, 250, 0.6)';

        const brandColor = this.sidebar()?.brandColor || '#2962FF';
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
    if (!this.#menuFocusPipe.transform(this.currentPath(), menuItem)) {
      const menuNode = event.currentTarget as HTMLElement;
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
  #getMenuGroupByCurrentPath = (menus: SdLayoutMenu[], menuGroup?: SdLayoutMenu): SdLayoutMenu[] => {
    for (const menu of menus) {
      if ('path' in menu && this.#isMenuPathMatchByCurrentPath(menu.path)) {
        return [menuGroup ?? menu];
      }
      if ('children' in menu && menu.children?.length) {
        const result = this.#getMenuGroupByCurrentPath(menu.children, menuGroup ?? menu);
        if (result?.length) return result;
      }
    }
    return [];
  };

  #bindingMenuGroupByCurrentPath = (menus: SdLayoutMenu[]): void => {
    const normalizeSearchText = this.#normalizeSearchText(this.searchText());

    if (!normalizeSearchText || normalizeSearchText.length < 3) {
      let menuGroupByPath = this.#getMenuGroupByCurrentPath(menus);

      if (!menuGroupByPath?.length) {
        const lastActiveId = this.#layoutStorageService.lastActiveMenuGroupId.get() || '';
        menuGroupByPath = this.menus()?.filter(menu => menu?.id === lastActiveId) || [];
      }

      if (menuGroupByPath?.length) {
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
    const normalizeSearchText = this.#normalizeSearchText(this.searchText());

    if (!normalizeSearchText || normalizeSearchText.length < 2) {
      this.dataSource.data = menus;
      this.#onCollapseAllMenuNodes(menus);
      this.#expandParentNodesByCurrentPath(menus);
    } else {
      const aliasSearchText = SdUtilities.changeAliasLowerCase(normalizeSearchText);
      this.dataSource.data = this.#getMenuByAliasSearchText(menus, aliasSearchText);
      if (this.dataSource.data?.length) {
        this.#onExpandAllMenuNodes(this.dataSource.data);
      }
    }
  };

  #getMenuByAliasSearchText = (menus: SdLayoutMenu[], aliasSearchText: string): SdLayoutMenu[] => {
    const result: SdLayoutMenu[] = [];
    for (const menu of menus) {
      const aliasTitle = SdUtilities.changeAliasLowerCase(menu.title as string);

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
    if (!path) return false;
    if (this.currentPath() === path) return true;
    return this.#normalizePath(this.currentPath()).startsWith(this.#normalizePath(path));
  };

  #normalizePath = (p: string): string => (p.endsWith('/') ? p : p + '/');

  #closeMenu(): void {
    this.showSideBar.emit(null);
  }

  #convertColor = (input: string | undefined, opacity = 1): string => {
    if (!input) return '';
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

