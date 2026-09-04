import { Params } from '@angular/router';

export type SdLayoutMenu = SdLayoutRootMenu | SdLayoutChildrenMenu;
export type Menus = SdLayoutMenu[];

// export interface MenuNotification {
//   status: 'info' | 'success' | 'warning' | 'error';
//   message: string;
// }

export interface SdLayoutRootMenu {
  id?: string;
  path: string;
  queryParams?: Params;
  icon?: string;
  iconUrl?: string;
  title: string;
  permissionKey?: string;
  permission: string | string[] | boolean | (() => boolean);
  // notify?: () => Observable<MenuNotification>;
  level?: number;
  tooltipTitle?: string;
}

export interface SdLayoutChildrenMenu {
  id?: string;
  icon?: string;
  iconUrl?: string;
  title?: string;
  children?: (SdLayoutRootMenu | SdLayoutChildrenMenu)[];
  // notify?: () => Observable<MenuNotification>;
  level?: number;
  tooltipTitle?: string;
}
