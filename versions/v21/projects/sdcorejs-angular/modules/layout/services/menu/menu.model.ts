import { Params } from '@angular/router';

export type SdLayoutMenu = SdLayoutRootMenu | SdLayoutChildrenMenu;
export type Menus = SdLayoutMenu[];

/**
 * Amount of work the user must handle from this menu, such as 3 pending approvals.
 * `neutral` (default) renders a plain count; `warning` and `error` render an attention pill.
 */
export interface SdLayoutMenuBadge {
  value: number | string;
  tone?: 'neutral' | 'warning' | 'error';
}

/**
 * Informational system or connection state, such as "1 running" or "Connected"; it asks for no action.
 * `live` adds a ring around the status dot.
 */
export interface SdLayoutMenuStatus {
  label: string;
  tone: 'success' | 'warning' | 'error';
  live?: boolean;
}

export interface SdLayoutRootMenu {
  id?: string;
  path: string;
  queryParams?: Params;
  icon?: string;
  iconUrl?: string;
  title: string;
  permissionKey?: string;
  permission: string | string[] | boolean | (() => boolean);
  level?: number;
  tooltipTitle?: string;
  /** Section heading this top-level menu is grouped under. Rendered by sidebar V4 only. */
  section?: string;
  /** Rendered by sidebar V4 only. */
  badge?: SdLayoutMenuBadge;
  /** Rendered by sidebar V4 only. */
  status?: SdLayoutMenuStatus;
  /** Sidebar V4 shows the item as aria-disabled, never navigates and leaves it out of search. */
  comingSoon?: boolean;
}

export interface SdLayoutChildrenMenu {
  id?: string;
  icon?: string;
  iconUrl?: string;
  title?: string;
  children?: (SdLayoutRootMenu | SdLayoutChildrenMenu)[];
  level?: number;
  tooltipTitle?: string;
  /** Section heading this top-level menu is grouped under. Rendered by sidebar V4 only. */
  section?: string;
  /** Rendered by sidebar V4 only. */
  badge?: SdLayoutMenuBadge;
  /** Rendered by sidebar V4 only. */
  status?: SdLayoutMenuStatus;
  /** Sidebar V4 shows the item as aria-disabled, never navigates and leaves it and its children out of search. */
  comingSoon?: boolean;
}
