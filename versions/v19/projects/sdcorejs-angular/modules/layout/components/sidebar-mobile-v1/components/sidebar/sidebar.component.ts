import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Params, Router, RouterModule } from '@angular/router';
import { sdIsExternalHttpUrl, sdOpenExternal } from '@sdcorejs/angular/utilities';

import { SdLayoutUserInfo, SidebarConfigurationV1 } from '../../../../configurations';
import { SdLayoutMenu, SdLayoutStorageService } from '../../../../services';
import { LayoutUserComponent } from '../user/user.component';
import { SdIcon } from '@sdcorejs/angular/modules/icon';

@Component({
  selector: 'sd-sidebar-mobile-overlay',
  standalone: true,
  imports: [SdIcon, CommonModule, RouterModule, LayoutUserComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarMobileOverlayComponent {
  #router = inject(Router);
  #destroyRef = inject(DestroyRef);
  #layoutStorageService = inject(SdLayoutStorageService);
  // why: các sidebar anh em đều lấy window qua DOCUMENT.defaultView; đọc global `window` trực tiếp
  // sẽ throw khi render phía server (SSR) vì global đó không tồn tại.
  #window = inject(DOCUMENT).defaultView;

  // ==========================================
  // INPUTS & OUTPUTS
  // ==========================================
  isShowSidebar = input<boolean>(false);
  menus = input.required<SdLayoutMenu[]>();
  userInfo = input.required<SdLayoutUserInfo>();
  sidebar = input.required<SidebarConfigurationV1>();

  // showSideBar(null) = đóng sidebar (tương thích với onToggle của main component)
  showSideBar = output<boolean | null>();
  expandSideBar = output<void>();
  popupUserMenuOpened = output<void>();
  popupUserMenuClosed = output<void>();
  titleMenuGroupChanged = output<string | undefined>();

  // ==========================================
  // STATE SIGNALS
  // ==========================================
  titleMenuGroup = signal<string | undefined>('');
  currentPath = signal<string>(this.#window?.location.pathname ?? this.#router.url.split(/[?#]/, 1)[0] ?? '');

  // Lưu danh sách ID các menu group đang được mở
  expandedMobileGroups = signal<Set<string>>(new Set<string>());

  constructor() {
    // Bind title khi menus thay đổi
    effect(() => {
      const currentMenus = this.menus();
      untracked(() => {
        const lastActiveMenuGroupId = this.#layoutStorageService.lastActiveMenuGroupId.get();
        if (!lastActiveMenuGroupId) {
          this.#layoutStorageService.lastActiveMenuGroupId.set(currentMenus?.[0]?.id ?? '');
        }
        this.#bindingMenuGroupByCurrentPath(currentMenus);
      });
    });

    // Bind title khi điều hướng
    this.#router.events.pipe(takeUntilDestroyed(this.#destroyRef)).subscribe(event => {
      if (event instanceof NavigationEnd) {
        // why: giống sidebar v1 desktop — lấy path từ chính sự kiện router thay vì đọc global
        // `window.location`, để component chạy được cả khi không có global window (SSR).
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
  toggleMobileGroup(groupId: string | undefined): void {
    if (!groupId) return;
    this.expandedMobileGroups.update(groups => {
      const newGroups = new Set(groups);
      if (newGroups.has(groupId)) {
        newGroups.delete(groupId);
      } else {
        newGroups.add(groupId);
      }
      return newGroups;
    });
  }

  isExpanded(groupId: string | undefined): boolean {
    if (!groupId) return false;
    return this.expandedMobileGroups().has(groupId);
  }

  navigate(args: { path?: string; queryParams?: Params }): void {
    const { path, queryParams } = args;
    if (!path) return;

    // why: `path.includes('http')` là substring test chứ không phải scheme test —
    // `javascript:fetch(...)//http` lọt qua rồi chạy như script trong chính origin của app. Ngoài ra
    // `window.open(path)` cũ không truyền `noopener` nên tab mới giữ được `window.opener` và có thể
    // điều hướng ngược tab gốc (reverse tabnabbing). `sdOpenExternal` luôn gắn `noopener,noreferrer`.
    if (sdIsExternalHttpUrl(path)) {
      sdOpenExternal(path);
      return;
    }

    this.#router.navigate([path.split('?')[0]], {
      queryParams: queryParams ?? {},
      state: { switchTab: true },
    });

    // Sau khi điều hướng trên mobile, tự động đóng sidebar
    this.onClose();
  }

  onClose(): void {
    this.showSideBar.emit(null);
  }

  // Kiểm tra menu có children (là SdLayoutChildrenMenu)
  hasChildren(menu: SdLayoutMenu): boolean {
    return 'children' in menu && !!menu.children?.length;
  }

  // Lấy danh sách children an toàn (type-safe)
  getChildren(menu: SdLayoutMenu): SdLayoutMenu[] {
    return 'children' in menu ? (menu.children ?? []) : [];
  }

  // Lấy path an toàn từ leaf menu (SdLayoutRootMenu)
  getPath(menu: SdLayoutMenu): string | undefined {
    return 'path' in menu ? menu.path : undefined;
  }

  // Lấy queryParams an toàn từ leaf menu
  getQueryParams(menu: SdLayoutMenu): Params {
    return ('queryParams' in menu ? menu.queryParams : undefined) ?? {};
  }

  onUserMenuOpened = (): void => this.popupUserMenuOpened.emit();
  onUserMenuClosed = (): void => this.popupUserMenuClosed.emit();

  // ==========================================
  // PRIVATE LOGIC
  // ==========================================
  #bindingMenuGroupByCurrentPath = (menus: SdLayoutMenu[]): void => {
    let menuGroupByPath = this.#getMenuGroupByCurrentPath(menus);

    if (!menuGroupByPath?.length) {
      const lastActiveId = this.#layoutStorageService.lastActiveMenuGroupId.get() || '';
      menuGroupByPath = menus?.filter(menu => menu?.id === lastActiveId) || [];
    }

    if (menuGroupByPath?.length) {
      const matchedGroup = menuGroupByPath[0];
      this.#layoutStorageService.lastActiveMenuGroupId.set(matchedGroup?.id || '');
      const title = matchedGroup?.tooltipTitle || matchedGroup?.title;
      this.titleMenuGroup.set(title);
      this.titleMenuGroupChanged.emit(title);
    } else {
      this.titleMenuGroup.set('');
      this.titleMenuGroupChanged.emit('');
    }
  };

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

  #isMenuPathMatchByCurrentPath = (path: string): boolean => {
    if (!path) return false;
    if (this.currentPath() === path) return true;
    return this.#normalizePath(this.currentPath()).startsWith(this.#normalizePath(path));
  };

  #normalizePath = (p: string): string => (p.endsWith('/') ? p : p + '/');
}
