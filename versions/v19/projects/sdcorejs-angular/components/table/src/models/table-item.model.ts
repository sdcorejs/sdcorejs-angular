import { SdBadge } from '@sdcorejs/angular/components/badge';
import { SdUtilities } from '@sdcorejs/angular/utilities';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';
// import hash from 'object-hash';
export interface SdTableMetaSelector {
  selectable?: boolean;
  isSelected?: boolean;
  actions?: string[];
}

export interface SdTableMetaExpand {
  isExpanded?: boolean;
  isExpanding?: boolean;
  data?: any;
}

export interface SdTableDisplay {
  tooltip?: string;
  badge?: {
    type: SdUnwrapSignal<SdBadge['type']>;
    color: SdUnwrapSignal<SdBadge['color']>;
    icon?: SdUnwrapSignal<SdBadge['icon']>;
    title?: SdUnwrapSignal<SdBadge['title']>;
  };
  cellStyle?: Record<string, string>;
  data: string | number | undefined | null;
  isHtml: boolean;
  click?: () => void;
}

export interface SdTableMeta<T> {
  id: string;
  display: Record<string, SdTableDisplay>;
  selector?: SdTableMetaSelector;
  expand?: SdTableMetaExpand;
  group?: {
    htmlTemplate?: string;
    items?: SdTableItem<T>[];
  };
}

export interface SdTableItem<T = any> {
  meta: SdTableMeta<T>;
  data: T;
}

export const MapToSdTableItem = <T = any>(item: T): SdTableItem<T> => ({
  data: item,
  meta: {
    id: SdUtilities.hash({ data: item }),
    display: {},
    expand: {
      isExpanding: false,
      isExpanded: false,
    },
    group: {},
    selector: { actions: [], isSelected: false, selectable: false },
  },
});

