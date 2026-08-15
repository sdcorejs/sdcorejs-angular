import { Utilities } from '@sdcorejs/utils/fns';
import { Injectable, Pipe, PipeTransform, inject } from '@angular/core';

// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SdLayoutMenu, Menus } from '../services/menu/menu.model';
import { Params } from '@angular/router';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
import { sdIsExternalHttpUrl, sdParseUrl } from '@sdcorejs/angular/utilities';
// End
@Pipe({
  name: 'menu',
})
@Injectable({
  providedIn: 'root',
})
export class MenuPipe implements PipeTransform {
  private permissionService = inject(SdPermissionService);

  /** Inserted by Angular inject() migration for backwards compatibility */
  constructor(...args: unknown[]);

  constructor() {}
  transform(menus: SdLayoutMenu[]): SdLayoutMenu[] {
    const results: Menus = [];
    const check = (menu: SdLayoutMenu): SdLayoutMenu | null => {
      if ('children' in menu) {
        const children: Menus = [];
        menu.children?.forEach(childMenu => {
          childMenu = check(childMenu) as SdLayoutMenu;
          if (childMenu) {
            children.push({ ...childMenu, id: this.#getHashIdMenu(childMenu) });
          }
        });

        if (!children.length) {
          return null;
        }

        return {
          ...menu,
          children,
          id: this.#getHashIdMenu(menu),
        };
      }

      if ('permission' in menu) {
        // why: code cũ là `const path = menu?.path?.includes('http') ? menu.path : menu.path` — hai
        // nhánh giống hệt nhau nên biến `path` không biến đổi gì, tức phần validate URL đã bị mất.
        // `path` chảy thẳng xuống `window.open()` / `routerLink` của sidebar, nên ở đây validate thật
        // và loại menu có scheme nguy hiểm (`javascript:`, `data:`, `vbscript:`…) — fail closed.
        // Không cần biến trung gian nữa: `path` đi kèm nguyên vẹn trong `{ ...menu }`.
        if (!menu.path || !this.#isSafeMenuPath(menu.path)) {
          return null;
        }

        if (
          (typeof menu.permission === 'string' || Array.isArray(menu.permission)) &&
          this.permissionService.hasPermission(menu.permission, menu.permissionKey)
        ) {
          return {
            ...menu,
            id: this.#getHashIdMenu(menu),
          };
        }

        if (typeof menu.permission === 'boolean' && menu.permission) {
          return {
            ...menu,
            id: this.#getHashIdMenu(menu),
          };
        }

        if (typeof menu.permission === 'function' && menu.permission()) {
          return {
            ...menu,
            id: this.#getHashIdMenu(menu),
          };
        }

        return null;
      }

      // why: tới đây menu không có `children` và cũng KHÔNG có key `permission`. Nếu nó vẫn có `path`
      // thì đó là một menu lá điều hướng được, và việc gõ sai key (`permision`, `permissions`) sẽ
      // khiến item hiện với MỌI người — fail open. Chặn ở runtime (fail closed) thay vì siết type
      // `SdLayoutMenu`: menu thường được dựng động từ API/JSON rồi ép `as SdLayoutMenu[]`, nên siết
      // type không bắt được ca đó mà lại thành breaking change cho consumer đang build tĩnh.
      if ('path' in menu) {
        return null;
      }

      return {
        ...menu,
        id: Utilities.generateUuid(),
      };
    };

    menus?.forEach(menu => {
      menu = check(menu) as SdLayoutMenu;
      if (menu) {
        results.push(menu);
      }
    });
    return results;
  }

  /**
   * why: `sdParseUrl` không truyền base nên chỉ parse được URL TUYỆT ĐỐI. Không parse được ⇒ path
   * tương đối ⇒ route nội bộ của app, an toàn. Parse được thì scheme bắt buộc phải là `http(s)`;
   * mọi scheme khác bị loại vì `path` cuối cùng chảy vào `window.open()` của sidebar.
   */
  #isSafeMenuPath = (path: string): boolean => sdParseUrl(path) == null || sdIsExternalHttpUrl(path);

  #getHashIdMenu = (menu: SdLayoutMenu): string => {
    const explicitId = typeof menu.id === 'string' ? menu.id.trim() : '';
    if (explicitId) return explicitId;

    const extendedMenu = menu as SdLayoutMenu & {
      path?: string;
      permission?: string;
      permissionKey?: string;
      queryParams?: Params;
    };
    const hashKeys: (keyof typeof extendedMenu)[] = [
      'title',
      'path',
      'permission',
      'permissionKey',
      'queryParams',
      'icon',
      'level',
      'tooltipTitle',
    ];
    const hashData = hashKeys.reduce(
      (acc, key) => {
        const value = extendedMenu[key];
        if (value !== undefined && value !== null) {
          acc[key as string] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );

    return Object.keys(hashData).length > 0 ? Utilities.hash(hashData) : Utilities.generateUuid();
  };
}
