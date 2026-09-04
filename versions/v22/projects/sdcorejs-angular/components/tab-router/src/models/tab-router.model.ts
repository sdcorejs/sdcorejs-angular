import { InjectionToken, Type } from '@angular/core';
import { Color } from '@sdcorejs/utils/models';
import { Subject } from 'rxjs';

export interface SdTabInfo {
  name: string;
  icon?: string;
  tooltip?: string;
  color?: Color;
}

export interface SdTabRouterTab {
  component: Type<any>;
  injector?: any;
  key: string;
  isActive: boolean;
  url: string;
  params?: Record<string, string | number>;
  queryParams?: Record<string, string | number>;
  data?: Record<string, any>;
  tabInfoChanges: Subject<SdTabInfo>;
  beforeClose?: () => boolean | Promise<boolean>; // Return true thì mới được close
}

export const SD_TAB = new InjectionToken<SdTabRouterTab>('SD_TAB');
