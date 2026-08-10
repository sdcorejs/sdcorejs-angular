import { Signal, TemplateRef } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { type SdIconSet } from '@sdcorejs/angular/modules/icon';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';
import { Color } from '@sdcorejs/utils/models';

export type SdTreeDataSource<TItem = any> = TItem[] | Signal<TItem[]> | (() => TItem[] | Promise<TItem[]>);

export type SdTreeLoadType = 'static' | 'lazy';

export type SdTreeOption<T = any> = SdTreeStaticOption<T> | SdTreeLazyOption<T>;

export type SdTreeItem<T = any> = SdTreeItemStatic<T> | SdTreeItemLazy<T>;

export type SdTreeItemByLoadType<T = any, TLoadType extends SdTreeLoadType = SdTreeLoadType> = TLoadType extends 'lazy'
  ? SdTreeItemLazy<T>
  : SdTreeItemStatic<T>;

export interface SdTreeItemBase<T = any> {
  /** Stable node id used for expansion, selection, filtering ancestry, and auto-id generation. */
  id: string;
  /** Text shown by the default tree row. Custom templates can still read `item` / `treeItem`. */
  label: string;
  /**
   * Optional node icon override.
   * - Branch without `icon`: tree renders the default folder icon (`folder` / `folder_open`).
   * - Leaf without `icon`: tree renders no icon.
   * This replaces the old `leafIcon` split. One field is enough because each node decides its own icon.
   */
  icon?: string | null;
  /** Consumer payload. Commands, selection callbacks, and `$implicit` template context receive this value. */
  data: T;
  /** Initial expansion state for this node. Component state wins after the user toggles. */
  expanded?: boolean;
}

export interface SdTreeItemStatic<T = any> extends SdTreeItemBase<T> {
  /** Static-mode children. Lazy mode does not use this field. */
  children?: SdTreeItemStatic<T>[];
  /** `hasChildren` belongs to lazy mode only; static mode derives branches from `children`. */
  hasChildren?: never;
}

export interface SdTreeItemLazy<T = any> extends SdTreeItemBase<T> {
  /** Lazy-mode hint. Set `false` for known leaf nodes that do not need `onExpandChildren`. */
  hasChildren?: boolean;
  /** `children` belongs to static mode only; lazy loaded children are cached inside the component. */
  children?: never;
}

export interface SdTreeBaseOption {
  maxDepth?: number;
  indentSize?: number;
}

export interface SdTreeStaticOption<T = any> extends SdTreeBaseOption {
  loadType: 'static';
  /** Expand all (`true`), none (`false`), or root levels where `level < number`. */
  defaultExpanded?: boolean | number;
}

export interface SdTreeLazyOption<T = any> extends SdTreeBaseOption {
  loadType: 'lazy';
  /**
   * Called once when a lazy node is first expanded. Return wrapped `SdTreeItemLazy<T>` children,
   * not raw data, so each child has a stable id/label/icon contract.
   */
  onExpandChildren: (item: SdTreeItemLazy<T>) => Promise<SdTreeItemLazy<T>[]> | SdTreeItemLazy<T>[];
}

export interface SdTreeCommand<T = any> {
  key: string;
  title: string | ((item: T) => string);
  icon?: string | ((item: T) => string | undefined | null);
  color?: Color;
  fontSet?: SdIconSet;
  disabled?: boolean | ((item: T) => boolean);
  hidden?: boolean | ((item: T) => boolean);
  click: (item: T) => void;
}

export interface SdTreeSelectorOption<T = any> {
  visible?: boolean;
  /** Keep at most one loaded node selected. Takes precedence over cascade. */
  single?: boolean;
  /** Select nodes independently or cascade selection through loaded descendants. */
  cascade?: 'independent' | 'descendants';
  actions?: SdTreeSelectionAction<T>[];
  message?: string | ((selectedItems: T[]) => string);
  disabled?: (item: T, selectedItems: T[]) => boolean;
}

export interface SdTreeSelectionAction<T = any> {
  icon?: string;
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  title?: SdUnwrapSignal<SdButton['title']>;
  color?: SdUnwrapSignal<SdButton['color']>;
  type?: SdUnwrapSignal<SdButton['type']>;
  hidden?: boolean | ((selectedItems: T[]) => boolean);
  click: (selectedItems: T[]) => void;
}

export interface SdTreeComponentOptionBase<T = any, TItem extends SdTreeItem<T> = SdTreeItem<T>> {
  autoId?: string | null;
  /** Root nodes can be an array, a signal, a sync loader, or an async loader. Call `reload()` to rerun loader sources. */
  items: SdTreeDataSource<TItem>;
  selectedItems?: T[] | null;
  selector?: SdTreeSelectorOption<T> | null;
  commands?: SdTreeCommand<T>[] | null;
  itemTemplate?: SdTreeItemTemplate<T> | null;
  selectable?: boolean;
  onSelectedItemsChange?: (items: T[]) => void;
  onSelect?: (event: SdTreeSelectionEvent<T>) => void;
  onExpand?: (event: SdTreeToggleEvent<T>) => void;
  onCollapse?: (event: SdTreeToggleEvent<T>) => void;
}

export interface SdTreeStaticComponentOption<T = any> extends SdTreeComponentOptionBase<T, SdTreeItemStatic<T>> {
  /** Static tree is the default when `tree` is omitted. */
  tree?: SdTreeStaticOption<T>;
}

export interface SdTreeLazyComponentOption<T = any> extends SdTreeComponentOptionBase<T, SdTreeItemLazy<T>> {
  tree: SdTreeLazyOption<T>;
}

export type SdTreeComponentOption<T = any> = SdTreeStaticComponentOption<T> | SdTreeLazyComponentOption<T>;

export interface SdTreeNode<T = any> {
  /** Wrapped tree item containing id/label/icon/data plus mode-specific tree metadata. */
  treeItem: SdTreeItem<T>;
  /** Raw consumer payload. Kept as a shortcut because most callbacks operate on data, not wrapper metadata. */
  data: T;
  id: string;
  label: string;
  level: number;
  parent: SdTreeNode<T> | null;
  children: SdTreeNode<T>[];
  hasChildren: boolean;
  /**
   * why: ba field dưới đây là GETTER chỉ-đọc, đọc thẳng từ signal state của component — nhờ vậy
   * mở/đóng một node không phải dựng lại toàn bộ cây node. Khai `readonly` để `node.isExpanded = true`
   * báo lỗi lúc biên dịch; nếu để mutable thì nó vẫn type-check rồi ném `TypeError` ở runtime.
   * Đổi trạng thái qua API của component (`toggle()` / `expand()` / `collapse()`).
   */
  readonly isExpanded: boolean;
  readonly isLoading: boolean;
  readonly loadError?: unknown;
}

export interface SdTreeItemContext<T = any> {
  $implicit: T;
  item: T;
  treeItem: SdTreeItem<T>;
  node: SdTreeNode<T>;
  level: number;
  expanded: boolean;
  selected: boolean;
  loading: boolean;
  loadError?: unknown;
  hasChildren: boolean;
  isLeaf: boolean;
  toggle: () => void;
  select: () => void;
  retry: () => void;
}

export type SdTreeItemTemplate<T = any> = TemplateRef<SdTreeItemContext<T>>;

export interface SdTreeSelectionEvent<T = any> {
  item: T;
  selected: boolean;
  selectedItems: T[];
}

export interface SdTreeToggleEvent<T = any> {
  item: T;
  expanded: boolean;
  node: SdTreeNode<T>;
}

export interface SdTreeLoadErrorEvent<T = any> {
  item?: T;
  error: unknown;
}
