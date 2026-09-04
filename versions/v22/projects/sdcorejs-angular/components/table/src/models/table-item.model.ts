import { isDevMode } from '@angular/core';
import { SdBadge } from '@sdcorejs/angular/components/badge';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';
import type { SdTableGroupDefContext } from '../directives/sd-table-group-def.directive';
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
  /**
   * Raw data của children (`items.map(i => i.data)`).
   * why: precompute 1 lần lúc SdGroupPipe dựng header — trước đây `groupContext()`
   * map lại mảng này ở MỖI change-detection pass cho MỖI group row.
   */
  data?: T[];
  /** true = row này là synthetic group header (sinh bởi SdGroupPipe). */
  isGroupHeader?: boolean;
  /** Hash key của group (= Utilities.hash(values)). */
  key?: string;
  /** Resolved group-field values (vd `{ customerId: 1, customerName: 'A' }`). */
  values?: Record<string, any>;
  /** Trạng thái expand. Chỉ ý nghĩa khi `option.group.collapsible = true`. */
  isExpanded?: boolean;
  /**
   * true nếu MỌI selectable child trong group đã được chọn.
   * why: cache thay cho `isGroupAllSelected(item)` gọi trong template — hàm đó duyệt
   * toàn bộ children mỗi CD pass. Cập nhật ở selection sync path (`#updateSelectedItems`).
   */
  isSelected?: boolean;
  /** true nếu chỉ MỘT PHẦN children được chọn (partial). Cache — xem `isSelected`. */
  indeterminate?: boolean;
  /**
   * Context ổn định truyền cho template `sdTableGroupDef`.
   * why: giữ NGUYÊN reference qua các CD pass để `ngTemplateOutlet` không phải
   * dựng lại embedded view; giá trị bên trong được mutate tại chỗ khi selection đổi.
   */
  context?: SdTableGroupDefContext<T>;
}

export interface SdTableMeta<T> {
  id: string;
  display: Record<string, SdTableDisplay>;
  selector?: SdTableMetaSelector;
  expand?: SdTableMetaExpand;
  group?: SdTableMetaGroup<T>;
  tree?: SdTableMetaTree<T>;
  /**
   * Style inline của cả row, resolve từ `option.style.rowCss` MỘT LẦN mỗi lần render.
   * why: template bind `[ngStyle]` trực tiếp vào đây; gọi `rowCss(...)` trong binding
   * trả object MỚI mỗi CD pass → KeyValueDiffer phải diff lại toàn bộ row mỗi pass.
   */
  rowStyle?: Record<string, string> | null;
}

export interface SdTableItem<T = any> {
  meta: SdTableMeta<T>;
  data: T;
}

// why: id của row TUYỆT ĐỐI không được suy ra từ NỘI DUNG. Hash content khiến 2 row
// trùng dữ liệu dùng chung 1 id → mat-table `trackBy` tái dùng nhầm view, và các Map
// keyed theo id (`#treeExpandState`, preserved-selection) đụng key. Thay bằng:
//   1. `option.rowKey` — field định danh do caller khai báo (ổn định, đọc được, sống
//      qua re-fetch của server);
//   2. fallback: id sinh theo bộ đếm và ghim vào CHÍNH object data qua WeakMap, nên
//      wrap lại cùng một object (re-format children của tree, filter local) vẫn ra
//      đúng id cũ — ổn định theo IDENTITY chứ không theo nội dung.
const rowIdByData = new WeakMap<object, string>();
let rowIdSequence = 0;

const nextRowId = (): string => `sd-row-${++rowIdSequence}`;

/** Resolve id cho một row data. Xem chú thích ở `rowIdByData` để biết thứ tự ưu tiên. */
export const resolveTableItemId = <T = any>(item: T, rowKey?: string): string => {
  if (rowKey) {
    const raw = Utilities.getNestedValue(item as Record<string, unknown>, rowKey);
    // why: CHỈ nhận giá trị nguyên thuỷ. `rowKey` trỏ vào object/array thì `String(raw)` cho ra
    // `'[object Object]'` với MỌI row — trùng key `trackBy` (CDK tái dùng view sai) và `visited`
    // Set trong `flattenTree` gộp cả cây thành một row. Rơi về id sinh tự động và cảnh báo ở dev.
    if (raw !== undefined && raw !== null && raw !== '') {
      const kind = typeof raw;
      if (kind === 'string' || kind === 'number' || kind === 'bigint' || kind === 'boolean') return String(raw);
      if (isDevMode()) {
        console.error(
          `[sd-table] option.rowKey "${rowKey}" trả về giá trị kiểu ${kind}, không phải nguyên thuỷ. ` +
            `Bỏ qua và dùng id sinh tự động. Trỏ rowKey vào một field định danh (string/number).`
        );
      }
    }
  }
  if (item !== null && typeof item === 'object') {
    const cached = rowIdByData.get(item as object);
    if (cached) return cached;
    const generated = nextRowId();
    rowIdByData.set(item as object, generated);
    return generated;
  }
  // why: row data nguyên thuỷ (mảng string/number) KHÔNG vào được WeakMap. Sinh id mới mỗi lần
  // `format()` sẽ làm `trackBy`, `#treeExpandState` và preserved-selection churn sau mỗi lần
  // reload. Với một giá trị nguyên thuỷ thì NỘI DUNG chính là identity, nên khoá theo
  // `typeof + value` là đúng ngữ nghĩa (khác hẳn hash nội dung của một object).
  return `sd-row-lit-${typeof item}-${String(item)}`;
};

export const MapToSdTableItem = <T = any>(item: T, rowKey?: string): SdTableItem<T> => ({
  data: item,
  meta: {
    id: resolveTableItemId(item, rowKey),
    display: {},
    expand: {
      isExpanding: false,
      isExpanded: false,
    },
    group: {},
    selector: { actions: [], isSelected: false, selectable: false },
    tree: { level: 0, hasChildren: false, isExpanded: false, isExpanding: false },
    rowStyle: null,
  },
});
