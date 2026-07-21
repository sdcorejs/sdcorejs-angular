import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutRootMenu } from './menu.model';
import { StringUtilities } from '@sdcorejs/utils/fns';

export function getMenuStableKey(menu: SdLayoutMenu | null | undefined, ancestors: string[] = []): string {
  if (!menu || typeof menu !== 'object') return '';
  if (typeof menu.id === 'string' && menu.id.trim()) return `id:${menu.id.trim()}`;
  if ('path' in menu && typeof menu.path === 'string' && menu.path.trim()) return `path:${menu.path.trim()}`;

  const title = typeof menu.title === 'string' ? menu.title.trim() : '';
  const segments = [...ancestors, title]
    .map(segment => StringUtilities.changeAliasLowerCase(segment).trim().replace(/\s+/g, '-'))
    .filter(Boolean);
  return segments.length ? `group:${segments.join('/')}` : '';
}

export function searchMenuLeaves(menus: SdLayoutMenu[], query: string): SdLayoutRootMenu[] {
  const leaves = flattenMenuLeaves(menus);
  const normalizedQuery = query?.trim();
  if (!normalizedQuery) return leaves;
  return leaves.filter(menu =>
    [menu.title, menu.tooltipTitle].some(value => value && StringUtilities.aliasIncludes(value, normalizedQuery))
  );
}

export function selectPrimaryMenuGroups(menus: SdLayoutMenu[], requestedIds: string[] | undefined, maximum = 3): SdLayoutMenu[] {
  const limit = Number.isFinite(maximum) && maximum > 0 ? Math.min(3, Math.floor(maximum)) : 3;
  const byId = new Map(menus.filter(menu => typeof menu.id === 'string').map(menu => [menu.id!, menu]));
  const selected: SdLayoutMenu[] = [];
  const selectedKeys = new Set<string>();

  for (const id of requestedIds ?? []) {
    const menu = byId.get(id);
    const key = getMenuStableKey(menu);
    if (!menu || !key || selectedKeys.has(key)) continue;
    selected.push(menu);
    selectedKeys.add(key);
    if (selected.length === limit) return selected;
  }

  for (const menu of menus) {
    const key = getMenuStableKey(menu);
    if (!key || selectedKeys.has(key)) continue;
    selected.push(menu);
    selectedKeys.add(key);
    if (selected.length === limit) break;
  }
  return selected;
}

export function resolveMenuKeys(menus: SdLayoutMenu[], keys: string[]): (SdLayoutRootMenu | SdLayoutChildrenMenu)[] {
  const menuByKey = new Map<string, SdLayoutMenu>();
  visitMenus(menus, [], (menu, ancestors) => {
    const key = getMenuStableKey(menu, ancestors);
    if (key && !menuByKey.has(key)) menuByKey.set(key, menu);
  });
  return [...new Set(keys)].map(key => menuByKey.get(key)).filter((menu): menu is SdLayoutMenu => !!menu);
}

export function flattenMenuLeaves(menus: SdLayoutMenu[]): SdLayoutRootMenu[] {
  const leaves: SdLayoutRootMenu[] = [];
  visitMenus(menus, [], menu => {
    if ('path' in menu && typeof menu.path === 'string' && menu.path) leaves.push(menu);
  });
  return leaves;
}

function visitMenus(
  menus: SdLayoutMenu[] | undefined,
  ancestors: string[],
  visitor: (menu: SdLayoutMenu, ancestors: string[]) => void
): void {
  for (const menu of menus ?? []) {
    if (!menu || typeof menu !== 'object') continue;
    visitor(menu, ancestors);
    if ('children' in menu && Array.isArray(menu.children)) {
      const title = typeof menu.title === 'string' && menu.title.trim() ? menu.title.trim() : getMenuStableKey(menu, ancestors);
      visitMenus(menu.children, title ? [...ancestors, title] : ancestors, visitor);
    }
  }
}
