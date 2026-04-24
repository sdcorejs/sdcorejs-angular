/* eslint-disable @typescript-eslint/no-explicit-any */
import { Type } from '@angular/core';
import { SdColor } from '@sdcorejs/angular/utilities/models';
import { Subject } from 'rxjs';

export interface SdTabInfo {
  name: string;
  icon?: string;
  tooltip?: string;
  color?: SdColor;
}

export interface SdTab {
  component: Type<any>;
  injector?: any;
  key: string;
  isActive: boolean;
  url: string;
  params?: Record<string, string | number>;
  queryParams?: Record<string, string | number>;
  data?: Record<string, any>;
  tabInfoChanges: Subject<SdTabInfo>;
  beforeClose?: () => boolean | Promise<boolean>; // Return true thÃ¬ má»›i Ä‘Æ°á»£c close
}

