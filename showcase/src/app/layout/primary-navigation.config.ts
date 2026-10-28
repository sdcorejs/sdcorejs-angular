import { DOC_CATEGORIES, DocCategory, isDocCategory } from '../docs/core/documentation.models';

export type PrimaryNavigationId = 'docs' | 'changelog' | 'about';

export interface PrimaryNavigationItem {
  readonly id: PrimaryNavigationId;
  readonly label: string;
  readonly commands: string[];
}

/** Widest viewport that shows the catalog as a drawer; the design switches at < 980px. */
export const MOBILE_NAV_BREAKPOINT_PX = 979;

/** Builds one navigation model for both the desktop header and mobile drawer. */
export function buildPrimaryNavigation(version: string): PrimaryNavigationItem[] {
  return [
    { id: 'docs', label: 'Docs', commands: ['/v', version] },
    { id: 'changelog', label: 'Changelog', commands: ['/v', version, 'changelog'] },
    { id: 'about', label: 'About', commands: ['/about'] },
  ];
}

function pathSegments(url: string): string[] {
  return (url.split(/[?#]/, 1)[0] ?? '/').split('/').filter(Boolean);
}

/** Category of a versioned docs route (/v/:version/:category/…); Getting started belongs to Guides. */
export function routeCategory(url: string): DocCategory | null {
  const segments = pathSegments(url);
  if (segments[0] !== 'v') return null;
  if (segments[2] === 'getting-started') return 'guides';
  return isDocCategory(segments[2]) ? segments[2] : null;
}

/** True when only the tab of a docs page changed (/v/:version/:category/:slug/:tab). */
export function isTabSwitch(previousUrl: string, nextUrl: string): boolean {
  const previous = pathSegments(previousUrl);
  const next = pathSegments(nextUrl);
  return (
    previous.length === 5 &&
    next.length === 5 &&
    previous[0] === 'v' &&
    previous.slice(0, 4).join('/') === next.slice(0, 4).join('/') &&
    previous[4] !== next[4]
  );
}

/** Guide, component, service and category pages show the catalog sidebar; home, changelog, search and 404 do not. */
export function routeHasSidebar(url: string): boolean {
  return routeCategory(url) !== null;
}

/** Resolves the active destination without treating Changelog as a generic Docs detail page. */
export function resolvePrimaryNavigationId(url: string): PrimaryNavigationId | null {
  const path = url.split(/[?#]/, 1)[0] ?? '/';
  const segments = path.split('/').filter(Boolean);
  if (!segments.length) return 'docs';
  if (segments[0] === 'about') return 'about';
  if (segments[0] === 'v') return segments[2] === 'changelog' ? 'changelog' : 'docs';
  if ((DOC_CATEGORIES as readonly string[]).includes(segments[0] ?? '')) return 'docs';
  return null;
}
