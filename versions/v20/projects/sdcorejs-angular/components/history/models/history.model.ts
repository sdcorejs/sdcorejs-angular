import { Color } from '@sdcorejs/utils/models';

export interface SdHistoryItemType {
  title: string;
  status?: {
    title?: string;
    color?: Color;
    icon?: string;
  };
  date?: string;
  actor?: string;
  source?: string;
  description?: string;
}
