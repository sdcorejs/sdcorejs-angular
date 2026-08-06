import { DOC_CATEGORIES } from '../docs/core/documentation.models';

export type PrimaryNavigationId = 'docs' | 'changelog' | 'about';

export interface PrimaryNavigationItem {
  readonly id: PrimaryNavigationId;
  readonly label: string;
  readonly commands: string[];
}

export const MOBILE_NAV_BREAKPOINT_PX = 1160;

/** Builds one navigation model for both the desktop header and mobile drawer. */
export function buildPrimaryNavigation(version: string): PrimaryNavigationItem[] {
  return [
    { id: 'docs', label: 'Docs', commands: ['/v', version] },
    { id: 'changelog', label: 'Changelog', commands: ['/v', version, 'changelog'] },
    { id: 'about', label: 'About', commands: ['/about'] },
  ];
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
