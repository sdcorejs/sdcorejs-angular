import { Utilities } from '@sdcorejs/utils/fns';
import { Injectable, Pipe, PipeTransform } from '@angular/core';

// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SdLayoutMenu, Menus } from '../services/menu/menu.model';
import { Params } from '@angular/router';
import { SdPermissionService } from '@sdcorejs/angular/modules/permission';
// End
@Pipe({
  name: 'menu',
})
@Injectable({
  providedIn: 'root',
})
export class MenuPipe implements PipeTransform {
  constructor(private permissionService: SdPermissionService) {}
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
        const path = menu?.path?.includes('http') ? menu.path : menu.path;
        if (!menu.path) {
          return null;
        }

        if (
          (typeof menu.permission === 'string' || Array.isArray(menu.permission)) &&
          this.permissionService.hasPermission(menu.permission, menu.permissionKey)
        ) {
          return {
            ...menu,
            path,
            id: this.#getHashIdMenu(menu),
          };
        }

        if (typeof menu.permission === 'boolean' && menu.permission) {
          return {
            ...menu,
            path,
            id: this.#getHashIdMenu(menu),
          };
        }

        if (typeof menu.permission === 'function' && menu.permission()) {
          return {
            ...menu,
            path,
            id: this.#getHashIdMenu(menu),
          };
        }

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

  #getHashIdMenu = (menu: SdLayoutMenu): string => {
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
