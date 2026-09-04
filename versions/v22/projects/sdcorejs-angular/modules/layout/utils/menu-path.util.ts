// NOTE: Import nội bộ trong module layout thì dùng path tương đối
import { SdLayoutMenu } from '../services/menu/menu.model';
// End

/** Thêm '/' ở cuối để so khớp theo segment: '/appointment' không khớp nhầm '/appointments'. */
export const normalizeMenuPath = (path: string): string => {
  return path.endsWith('/') ? path : path + '/';
};

/** Route hiện tại có nằm trong nhánh của `path` không (khớp chính xác hoặc khớp phần đầu). */
export const isMenuPathMatch = (routePath: string, path: string): boolean => {
  if (!routePath || !path) {
    return false;
  }
  if (routePath === path) {
    return true;
  }
  return normalizeMenuPath(routePath).startsWith(normalizeMenuPath(path));
};

/** Mọi path trong cây menu khớp với route hiện tại. */
export const collectMatchedMenuPaths = (menus: SdLayoutMenu[] | null | undefined, routePath: string): string[] => {
  const matched: string[] = [];
  const visit = (items: SdLayoutMenu[]): void => {
    for (const item of items) {
      if ('path' in item && isMenuPathMatch(routePath, item.path)) {
        matched.push(item.path);
      }
      if ('children' in item && item.children?.length) {
        visit(item.children);
      }
    }
  };
  visit(menus ?? []);
  return matched;
};

/**
 * Path khớp sát nhất với route hiện tại trong cả cây menu.
 * Khi cả '/appointment' và '/appointment/cs' cùng khớp route '/appointment/cs',
 * chỉ path dài nhất được coi là active — path còn lại không được highlight.
 * Hoà nhau thì lấy path xuất hiện trước theo thứ tự khai báo.
 */
export const resolveActiveMenuPath = (menus: SdLayoutMenu[] | null | undefined, routePath: string): string | null => {
  const matched = collectMatchedMenuPaths(menus, routePath);
  if (!matched.length) {
    return null;
  }
  return matched.reduce((best, path) => (normalizeMenuPath(path).length > normalizeMenuPath(best).length ? path : best));
};

/** Chính menu này, hoặc bất kỳ menu con nào ở mọi cấp, có đúng path đó. */
export const containsMenuPath = (menuItem: SdLayoutMenu, path: string): boolean => {
  if ('path' in menuItem && menuItem.path === path) {
    return true;
  }
  if ('children' in menuItem && menuItem.children?.length) {
    return menuItem.children.some(child => containsMenuPath(child, path));
  }
  return false;
};
