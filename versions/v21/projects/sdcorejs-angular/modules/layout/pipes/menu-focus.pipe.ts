import { Injectable, Pipe, PipeTransform } from '@angular/core';

// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SdLayoutMenu } from '../services';
// End
@Pipe({
  name: 'menuFocus',
})
@Injectable({ providedIn: 'root' })
export class MenuFocusPipe implements PipeTransform {
  transform(routePath: string, menuItem: SdLayoutMenu): boolean {
    if (!routePath) {
      return false;
    }
    if ('children' in menuItem && menuItem.children) {
      return menuItem.children.some(child => {
        return 'path' in child && child.path ? this.#match(routePath, child.path) : false;
      });
    }
    return 'path' in menuItem && this.#match(routePath, menuItem.path);
  }

  #match = (routePath: string, path: string): boolean => {
    if (!path) {
      return false;
    }
    if (routePath === path) {
      return true;
    }
    return this.#normalizePath(routePath).startsWith(this.#normalizePath(path));
  };

  #normalizePath = (p: string): string => {
    return p.endsWith('/') ? p : p + '/';
  };
}
