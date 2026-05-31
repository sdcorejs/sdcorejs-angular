import { SdBadge } from '@sdcorejs/angular/components/badge';
import { Utilities } from '@sdcorejs/utils/fns';
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

export interface SdTableMetaTree<T = any> {
  level: number;
  hasChildren: boolean;
  isExpanded: boolean;
  isExpanding?: boolean;
  parentId?: string;
  /** Cached formatted child SdTableItem[] — populated on first expand/format */
  childItems?: SdTableItem<T>[];
  /**
   * Hierarchical index path từ root tới row hiện tại — sibling-index (1-based) per level.
   * Vd root thứ nhất = [1], child thứ 2 của root đó = [1, 2], grandchild thứ 1 = [1, 2, 1].
   * Template STT join('.') → "1", "1.2", "1.2.1". Populate trong `flattenTree`.
   */
  indexPath?: number[];
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

export interface SdTableMetaGroup<T = any> {
  /** Children items thuộc group này (chỉ set trên group header row). */
  items?: SdTableItem<T>[];
  /** true = row này là synthetic group header (sinh bởi SdGroupPipe). */
  isGroupHeader?: boolean;
  /** Hash key của group (= Utilities.hash(values)). */
  key?: string;
  /** Resolved group-field values (vd `{ customerId: 1, customerName: 'A' }`). */
  values?: Record<string, any>;
  /** Trạng thái expand. Chỉ ý nghĩa khi `option.group.collapsible = true`. */
  isExpanded?: boolean;
}

export interface SdTableMeta<T> {
  id: string;
  display: Record<string, SdTableDisplay>;
  selector?: SdTableMetaSelector;
  expand?: SdTableMetaExpand;
  group?: SdTableMetaGroup<T>;
  tree?: SdTableMetaTree<T>;
}

export interface SdTableItem<T = any> {
  meta: SdTableMeta<T>;
  data: T;
}

export const MapToSdTableItem = <T = any>(item: T): SdTableItem<T> => ({
  data: item,
  meta: {
    id: Utilities.hash({ data: item }),
    display: {},
    expand: {
      isExpanding: false,
      isExpanded: false,
    },
    group: {},
    selector: { actions: [], isSelected: false, selectable: false },
    tree: { level: 0, hasChildren: false, isExpanded: false, isExpanding: false },
  },
});
