import { NestedTreeControl } from '@angular/cdk/tree';
import { CommonModule, DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NavigationEnd, Params, Router, RouterModule } from '@angular/router';

import { SdInput, SdSuffixDefDirective } from '@sdcorejs/angular/forms';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdSafeHtmlPipe } from '@sdcorejs/angular/pipes';
import { sdIsExternalHttpUrl, sdOpenExternal } from '@sdcorejs/angular/utilities';
import { StringUtilities } from '@sdcorejs/utils/fns';

// NOTE: Import nội bộ trong module layout
import { SdLayoutUserInfo, SidebarConfigurationV1 } from '../../../../configurations';
import { HighlightSearchPipe, MenuFocusPipe } from '../../../../pipes';
import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutNavigationStateService, SdLayoutStorageService } from '../../../../services';
import { resolveActiveMenuPath } from '../../../../utils';
import { LayoutUserComponent } from '../user/user.component';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'sd-sidebar-v1-panel',
  standalone: true,
  imports: [
    SdIcon,
    SdInput,
    FormsModule,
    CommonModule,
    RouterModule,
    MatTreeModule,
    SdSafeHtmlPipe,
    MatInputModule,
    MenuFocusPipe,
    MatTooltipModule,
    HighlightSearchPipe,
    SdSuffixDefDirective,
    LayoutUserComponent,
    SdTranslatePipe,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdSidebarV1Panel {
  // ==========================================
  // INJECT SERVICES (Thay thế Constructor rườm rà)
  // ==========================================
  #router = inject(Router);
  #layoutStorageService = inject(SdLayoutStorageService);
  #navigationState = inject(SdLayoutNavigationStateService);
  #menuFocusPipe = inject(MenuFocusPipe);
  #i18n = inject(I18nService);
  #window = inject(DOCUMENT).defaultView;
  #destroyRef = inject(DestroyRef); // Dùng để unsubscribe RxJS tự động

  // ==========================================
  // SIGNAL INPUTS & OUTPUTS
  // ==========================================
  isShowSidebar = input.required<boolean>();
  menus = input.required<SdLayoutMenu[]>();
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV1>();
  isMobile = input(false);
  expandSideBar = output<void>();
  popupUserMenuClosed = output<void>();
  popupUserMenuOpened = output<void>();
  showSideBar = output<boolean | null>();

  // ==========================================
  // STATE SIGNALS
  // ==========================================
  isMenuLock = signal<boolean>(this.#layoutStorageService.menuLockStatus?.get() ?? true);
  currentPath = signal<string>(this.#window?.location.pathname ?? this.#router.url.split(/[?#]/, 1)[0] ?? '');
  searchText = signal<string>('');
  titleMenuGroup = signal<string | undefined>('');
  idMenuGroupActive = signal<string | undefined>('');
  menusByGroup = signal<SdLayoutMenu[]>([]);
  #hoveredMenuNodeKey = signal<string | null>(null);
  #pinIconHoverTimerId = signal<ReturnType<typeof setTimeout> | null>(null);
  // why: `title` của nhóm ghim là nhãn HIỂN THỊ (đổ vào `titleMenuGroup` trên header), không phải
  // id — phải dịch. Tính trong computed nên đổi ngôn ngữ là tiêu đề nhóm đổi theo.
  pinnedMenuGroup = computed<SdLayoutChildrenMenu>(() => ({
    id: 'pinned-menu-group',
    title: this.#i18n.t('core.module.layout.sidebar.pinned'),
    children: this.#navigationState.pinnedMenus(),
  }));

  // ==========================================
  // COMPUTED STATE
  // ==========================================
  totalMenuInMenusByGroup = computed(() => this.#getTotalMenus(this.menusByGroup()));
  logoUrl = computed(() => this.sidebar().logoUrl?.trim() || undefined);
  pinnedNodeKeys = computed(() => new Set(this.pinnedMenuGroup().children?.map(m => this.#getMenuNodeKey(m)) ?? []));
  isPinnedMenuGroupActive = computed(() => this.idMenuGroupActive() === this.pinnedMenuGroup().id);
  // Path khớp sát nhất trong nhánh menu đang hiển thị. Nhờ nó '/appointment' hết sáng khi đang ở '/appointment/cs'.
  activeMenuPath = computed(() => resolveActiveMenuPath(this.menusByGroup(), this.currentPath()));

  // ==========================================
  // DATA STRUCTURES
  // ==========================================
  #pinIconHoverTimerDelay = 300;
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
        this.#navigationState.hydrate(currentMenus);
        const lastActiveMenuGroupId = this.#layoutStorageService.lastActiveMenuGroupId.get();
        const pinnedGroup = this.pinnedMenuGroup();
        const isPinEnabled = this.sidebar()?.pin?.enabled;
        // Xử lý khi lần đầu vào web (nếu chưa có active group)
        if (!lastActiveMenuGroupId || (lastActiveMenuGroupId === pinnedGroup?.id && !isPinEnabled)) {
          // Ưu tiên pinnedGroup nếu đủ điều kiện, còn không lấy menu đầu tiền dev khai báo
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
        const currentPath = event.urlAfterRedirects.split(/[?#]/, 1)[0] ?? '';
        if (this.currentPath() !== currentPath) {
          this.currentPath.set(currentPath);
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

  menuNodeHref = (node: { path: string; queryParams?: Params }): string => {
    if (sdIsExternalHttpUrl(node.path)) return node.path;
    return this.#router.serializeUrl(
      this.#router.createUrlTree([node.path.split('?')[0]], {
        queryParams: node.queryParams ?? {},
      })
    );
  };

  onMenuNodeClick = (event: MouseEvent, node: { path: string; queryParams?: Params }): void => {
    event.preventDefault();
    this.navigate({ path: node.path, queryParams: node.queryParams ?? {} });
  };

  // why: giữ public keyboard handler cũ để không làm thay đổi declaration API.
  onMenuNodeKeydown = (event: KeyboardEvent, node: { path: string; queryParams: Params }): void => {
    if (event.target !== event.currentTarget) return;
    // why: chặn Space cuộn trang.
    event.preventDefault();
    this.navigate({ path: node.path, queryParams: node.queryParams ?? {} });
  };

  // why: giữ public keyboard handler cũ; native branch button now owns keyboard activation.
  onToggleMenuNodeKeydown = (event: KeyboardEvent, menu: SdLayoutMenu): void => {
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    this.onToggleMenuNode(menu);
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
    this.#navigationState.togglePinned(node);
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
    this.#router.navigateByUrl('/layout/home');
    this.searchText.set('');
    this.#layoutStorageService.lastActiveMenuGroupId.set('');
  };

  onUserMenuClosed = (): void => this.popupUserMenuClosed.emit();

  onUserMenuOpened = (): void => this.popupUserMenuOpened.emit();

  navigate = (args: { path: string; queryParams: Params }): void => {
    const { path, queryParams } = args;
    // why: `path.includes('http')` là substring test chứ không phải scheme test — chuỗi
    // `javascript:fetch(...)//http` lọt qua rồi chạy như script trong chính origin của app.
    // `sdIsExternalHttpUrl` parse URL thật, `sdOpenExternal` từ chối scheme lạ và luôn gắn
    // `noopener,noreferrer` (chặn reverse tabnabbing qua `window.opener`).
    if (sdIsExternalHttpUrl(path)) {
      sdOpenExternal(path);
      return;
    }
    this.#router.navigate([path.split('?')[0]], {
      queryParams,
      state: { switchTab: true },
    });

    if (this.isMobile()) {
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

    // Case 1: Menu không có children
    if (!('children' in menuGroupNode && menuGroupNode.children?.length)) {
      if ('path' in menuGroupNode) {
        this.navigate({ path: menuGroupNode.path, queryParams: menuGroupNode?.queryParams ?? {} });
        return;
      }
    }

    // Case 2: Menu có children
    if ('children' in menuGroupNode && menuGroupNode.children?.length) {
      this.#setMenusByGroup(menuGroupNode.children);
      this.searchText.set('');
      this.onFilterSearchText('');
      this.expandSideBar.emit();
    }

    this.idMenuGroupActive.set(menuGroupNode?.id);
    this.#layoutStorageService.lastActiveMenuGroupId.set(menuGroupNode?.id || '');
    if (!this.currentPath()) {
      this.currentPath.set(this.#window?.location.pathname ?? this.#router.url.split(/[?#]/, 1)[0] ?? '');
    }
  };

  // ==========================================
  // CỤM HOVER MENU GROUP & NODE
  // ==========================================
  onMouseOverMenuGroupNode = (event: MouseEvent, menuNode: SdLayoutMenu): void => {
    if (this.idMenuGroupActive() !== menuNode?.id) {
      const menuGroup = event.currentTarget as HTMLElement;
      const menuGroupIcon = menuGroup.querySelector('.c-menu-group-icon') as HTMLElement;
      const brandLightColorOpacity = this.#convertColor(this.sidebar()?.brandLightColor, 0.6);

      if (menuGroupIcon) {
        menuGroupIcon.style.transition = 'all 0.15s';
        menuGroupIcon.style.backgroundColor =
          brandLightColorOpacity || 'color-mix(in srgb, var(--sd-primary-light, #d7e3ff) 60%, transparent)';
        if (!(menuGroupIcon instanceof HTMLImageElement)) {
          menuGroupIcon.style.color = this.sidebar()?.brandColor || 'var(--sd-primary, #005cbb)';
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
          menuGroupIcon.style.color = 'var(--sd-text-secondary, #44474f)';
        }
      }
    }
  };

  onMouseOverMenuNode = (event: MouseEvent, menuItem: SdLayoutMenu): void => {
    const menuNode = event.currentTarget as HTMLElement;
    const brandColor = this.sidebar()?.brandColor || 'var(--sd-primary, #005cbb)';

    // Nếu có bật config pin menu
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

    if (!this.#menuFocusPipe.transform(this.currentPath(), menuItem, this.activeMenuPath())) {
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

    // Nếu có bật config pin menu
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

    if (!this.#menuFocusPipe.transform(this.currentPath(), menuItem, this.activeMenuPath())) {
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

  #getMenuGroupByCurrentPath = (menus: SdLayoutMenu[]): SdLayoutMenu[] => {
    const activePath = resolveActiveMenuPath(menus, this.currentPath());
    if (!activePath) {
      return [];
    }
    const menuGroup = this.#findMenuGroupByPath(menus, activePath);
    return menuGroup ? [menuGroup] : [];
  };

  #findMenuGroupByPath = (menus: SdLayoutMenu[], activePath: string, menuGroup?: SdLayoutMenu): SdLayoutMenu | null => {
    for (const menu of menus) {
      if ('path' in menu && menu.path === activePath) {
        return menuGroup ?? menu;
      }
      if ('children' in menu && menu.children?.length) {
        const result = this.#findMenuGroupByPath(menu.children, activePath, menuGroup ?? menu);
        if (result) {
          return result;
        }
      }
    }
    return null;
  };

  #bindingMenuGroupByCurrentPath = (menus: SdLayoutMenu[]): void => {
    // Chỉ bindingGroup mới khi người dùng không searchText
    if (!this.#getValidSearchText()) {
      const pinnedChildren = this.pinnedMenuGroup()?.children ?? [];

      // Ưu tiên: Current path khớp với item trong pinMenuGroup thì lần đầu vào trang sẽ hiện pinnedMenuGroup
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
      // Nếu không tìm được path nào khớp với menu
      if (!menuGroupByPath?.length) {
        const lastActiveId = this.#layoutStorageService.lastActiveMenuGroupId.get() || '';
        // Nếu có pinned group thì hiện mậc định là pinnedMenuGroup
        if (this.sidebar()?.pin?.enabled && lastActiveId === this.pinnedMenuGroup()?.id && pinnedChildren?.length) {
          const pinned = this.pinnedMenuGroup();
          this.idMenuGroupActive.set(pinned.id);
          this.titleMenuGroup.set(pinned.title);
          this.#setMenusByGroup(pinnedChildren);
          this.#expandParentNodesByCurrentPath(pinnedChildren);
          return;
        }
        // Nếu không có pinnedMenuGroup thì menuGroup lấy từ thao tác cuối cùng của người dùng
        menuGroupByPath = this.menus()?.filter(menu => menu?.id === lastActiveId) || [];
      }

      // Kiểm tra lại menuGroupPath đã thực sự tìm được chưa?
      if (menuGroupByPath?.length) {
        // Nếu user đang ở pinedGroup và curentPath có chứa trong pinnedMenuGroup thì return luôn, không chuyển sang menuGroup mới
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
    const activePath = resolveActiveMenuPath(menus, this.currentPath());
    return activePath ? this.#expandParentNodesByPath(menus, activePath) : false;
  }

  #expandParentNodesByPath(menus: SdLayoutMenu[], activePath: string): boolean {
    let shouldPropagate = false;
    for (const menu of menus) {
      if ('path' in menu && menu.path === activePath) {
        shouldPropagate = true;
      }
      if ('children' in menu && menu.children?.length) {
        const childHasMatch = this.#expandParentNodesByPath(menu.children, activePath);
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
      // why: hỗ trợ search theo route (path) và search theo ký tự đầu (viết tắt) bên cạnh search theo tiêu đề
      const matchByRoutePath = 'path' in menu && !!menu.path && menu.path.toLowerCase().includes(aliasSearchText);
      const matchByInitials = this.#matchesTitleInitials(aliasTitle, aliasSearchText);

      if (aliasTitle.includes(aliasSearchText) || matchByRoutePath || matchByInitials) {
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

  #matchesTitleInitials = (aliasTitle: string, aliasSearchText: string): boolean => {
    const initials = aliasTitle
      .split(' ')
      .filter(word => word)
      .map(word => word[0])
      .join('');
    return this.#isOrderedSubsequence(aliasSearchText, initials);
  };

  #isOrderedSubsequence = (needle: string, haystack: string): boolean => {
    let matchedCount = 0;
    for (const char of haystack) {
      if (char === needle[matchedCount]) {
        matchedCount++;
      }
    }
    return matchedCount === needle.length;
  };

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
    return menus.reduce((total, menu) => total + this.#countMenuNode(menu), 0);
  };

  #countMenuNode = (menu: SdLayoutMenu): number => {
    if (!('children' in menu) || !menu.children?.length) {
      return 1;
    }

    let count = 1;
    for (const child of menu.children) {
      count += this.#countMenuNode(child);
    }
    return count;
  };
}
