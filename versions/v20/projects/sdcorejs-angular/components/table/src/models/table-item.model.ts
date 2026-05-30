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
  /** Cached formatted child SdTableItem[] â€” populated on first expand/format */
  childItems?: SdTableItem<T>[];
  /**
   * Hierarchical index path tá»« root tá»›i row hiá»‡n táº¡i â€” sibling-index (1-based) per level.
   * Vd root thá»© nháº¥t = [1], child thá»© 2 cá»§a root Ä‘Ã³ = [1, 2], grandchild thá»© 1 = [1, 2, 1].
   * Template STT join('.') â†’ "1", "1.2", "1.2.1". Populate trong `flattenTree`.
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
  /** Children items thuá»™c group nÃ y (chá»‰ set trÃªn group header row). */
  items?: SdTableItem<T>[];
  /** true = row nÃ y lÃ  synthetic group header (sinh bá»Ÿi SdGroupPipe). */
  isGroupHeader?: boolean;
  /** Hash key cá»§a group (= Utilities.hash(values)). */
  key?: string;
  /** Resolved group-field values (vd `{ customerId: 1, customerName: 'A' }`). */
  values?: Record<string, any>;
  /** Tráº¡ng thÃ¡i expand. Chá»‰ Ã½ nghÄ©a khi `option.group.collapsible = true`. */
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

