import { SdLayoutChildrenMenu, SdLayoutMenu, SdLayoutMenuStatus, SdLayoutRootMenu } from './menu.model';
import { StringUtilities } from '@sdcorejs/utils/fns';

/** Top-level menus sharing one `section`; `section: null` holds unsectioned menus rendered without a heading. */
export interface SdLayoutMenuSectionGroup {
  section: string | null;
  menus: SdLayoutMenu[];
}

/** The single trailing element sidebar V4 renders after a menu title. */
export type SdLayoutMenuTrailing =
  | { kind: 'soon' }
  | { kind: 'count'; value: number | string }
  | { kind: 'badge'; value: number | string; tone: 'warning' | 'error' }
  | { kind: 'status'; label: string; tone: SdLayoutMenuStatus['tone']; live: boolean };

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

/** Matches like `searchMenuLeaves` but leaves out `comingSoon` leaves and every leaf under a `comingSoon` group (sidebar V4 search). */
export function searchAvailableMenuLeaves(menus: SdLayoutMenu[], query: string): SdLayoutRootMenu[] {
  const leaves = collectAvailableMenuLeaves(menus, []);
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

/**
 * Groups top-level menus by `section` in order of first appearance (sidebar V4).
 * An unsectioned menu joins only the immediately preceding output group when that group is unsectioned (`section: null`);
 * otherwise it starts a new unsectioned group.
 */
export function groupMenusBySection(menus: SdLayoutMenu[]): SdLayoutMenuSectionGroup[] {
  const groups: SdLayoutMenuSectionGroup[] = [];
  const groupBySection = new Map<string, SdLayoutMenuSectionGroup>();

  for (const menu of menus ?? []) {
    if (!menu || typeof menu !== 'object') continue;
    const section = typeof menu.section === 'string' ? menu.section.trim() : '';
    if (!section) {
      // why: chỉ nối vào nhóm null nếu nó là nhóm cuối, để không gộp vượt qua một nhóm có section
      const last = groups[groups.length - 1];
      if (last?.section === null) last.menus.push(menu);
      else groups.push({ section: null, menus: [menu] });
      continue;
    }

    const group = groupBySection.get(section);
    if (group) {
      group.menus.push(menu);
      continue;
    }
    const created: SdLayoutMenuSectionGroup = { section, menus: [menu] };
    groupBySection.set(section, created);
    groups.push(created);
  }
  return groups;
}

/** The one trailing element sidebar V4 renders, in the order `comingSoon`, `badge`, `status`; empty values are skipped. */
export function resolveMenuTrailing(menu: SdLayoutMenu | null | undefined): SdLayoutMenuTrailing | null {
  if (!menu || typeof menu !== 'object') return null;
  if (menu.comingSoon === true) return { kind: 'soon' };

  const badge = menu.badge;
  if (badge && hasBadgeValue(badge.value)) {
    return badge.tone === 'warning' || badge.tone === 'error'
      ? { kind: 'badge', value: badge.value, tone: badge.tone }
      : { kind: 'count', value: badge.value };
  }

  const status = menu.status;
  if (status && typeof status.label === 'string' && status.label.trim()) {
    return { kind: 'status', label: status.label, tone: status.tone, live: status.live === true };
  }
  return null;
}

function hasBadgeValue(value: unknown): value is number | string {
  return typeof value === 'number' ? Number.isFinite(value) : typeof value === 'string' && !!value.trim();
}

function collectAvailableMenuLeaves(menus: SdLayoutMenu[] | undefined, leaves: SdLayoutRootMenu[]): SdLayoutRootMenu[] {
  for (const menu of menus ?? []) {
    if (!menu || typeof menu !== 'object' || menu.comingSoon === true) continue;
    if ('path' in menu && typeof menu.path === 'string' && menu.path) leaves.push(menu);
    if ('children' in menu && Array.isArray(menu.children)) collectAvailableMenuLeaves(menu.children, leaves);
  }
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
