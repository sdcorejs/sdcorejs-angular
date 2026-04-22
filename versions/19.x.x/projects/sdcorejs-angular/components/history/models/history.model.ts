import { SdColor } from '@sdcorejs/angular/utilities';

export interface SdHistoryItemType {
  title: string;
  status?: {
    title?: string;
    color?: SdColor;
    icon?: string;
  };
  date?: string;
  actor?: string;
  source?: string;
  description?: string;
}

