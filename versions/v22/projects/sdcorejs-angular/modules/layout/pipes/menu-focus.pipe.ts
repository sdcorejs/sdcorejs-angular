import { Injectable, Pipe, PipeTransform } from '@angular/core';

// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SdLayoutMenu } from '../services';
import { containsMenuPath, isMenuPathMatch } from '../utils';
// End
@Pipe({
  name: 'menuFocus',
})
@Injectable({ providedIn: 'root' })
export class MenuFocusPipe implements PipeTransform {
  /**
   * @param activeMenuPath Path khớp sát nhất với route hiện tại (xem `resolveActiveMenuPath`).
   * Truyền vào thì chỉ menu chứa đúng path đó mới focus, nên '/appointment' không sáng khi đang ở
   * '/appointment/cs'. Bỏ trống thì giữ cách khớp phần đầu cũ.
   */
  transform(routePath: string, menuItem: SdLayoutMenu, activeMenuPath?: string | null): boolean {
    if (!routePath) {
      return false;
    }
    if (activeMenuPath !== undefined) {
      return activeMenuPath ? containsMenuPath(menuItem, activeMenuPath) : false;
    }
    if ('children' in menuItem && menuItem.children) {
      return menuItem.children.some(child => {
        return 'path' in child && child.path ? isMenuPathMatch(routePath, child.path) : false;
      });
    }
    return 'path' in menuItem && isMenuPathMatch(routePath, menuItem.path);
  }
}
