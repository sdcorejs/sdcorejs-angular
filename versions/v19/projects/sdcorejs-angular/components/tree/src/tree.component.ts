import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isSignal,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { TranslatePipe } from '@sdcorejs/angular/i18n';
import { SdTreeItemDefDirective } from './tree-item-def.directive';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import {
  SdTreeCommand,
  SdTreeDataSource,
  SdTreeComponentOption,
  SdTreeItem,
  SdTreeItemContext,
  SdTreeItemLazy,
  SdTreeLoadErrorEvent,
  SdTreeNode,
  SdTreeOption,
  SdTreeSelectionAction,
  SdTreeSelectionEvent,
  SdTreeSelectorOption,
  SdTreeToggleEvent,
} from './tree.model';

export type SdTreeAutoIdPart = 'row' | 'toggle' | 'checkbox' | 'icon' | 'label' | 'command';

export interface SdTreeNodeAutoIds {
  row?: string;
  toggle?: string;
  checkbox?: string;
  icon?: string;
  label?: string;
  command?: string;
}

export interface SdTreeViewCommand<T = any> {
  key: string;
  command: SdTreeCommand<T>;
  title: string;
  icon: string;
  color: SdTreeCommand<T>['color'];
  fontSet: SdTreeCommand<T>['fontSet'];
  disabled: boolean;
  autoId?: string;
  defaultColor: boolean;
}

export interface SdTreeViewNode<T = any> extends SdTreeNode<T> {
  icon?: string;
  selected: boolean;
  selectionDisabled: boolean;
  selectionIndeterminate: boolean;
  toggleDisabled: boolean;
  toggleLabel: string;
  ariaExpanded: boolean | null;
  autoIds: SdTreeNodeAutoIds;
  commands: SdTreeViewCommand<T>[];
  context: SdTreeItemContext<T>;
  tabIndex: 0 | -1;
}

export interface SdTreeSelectionActionView<T = any> {
  action: SdTreeSelectionAction<T>;
  autoId: string | null;
}

const DEFAULT_STATIC_TREE: SdTreeOption<any> = { loadType: 'static' };
const EMPTY_TREE_ITEMS: SdTreeItem<any>[] = [];
/** Shared empty lookup — chế độ không cascade khỏi phải dựng Map mới mỗi lần recompute. */
const EMPTY_DESCENDANT_COUNTS: ReadonlyMap<string, number> = new Map<string, number>();

@Component({
  selector: 'sd-tree',
  standalone: true,
  imports: [
    SdIcon,
    CommonModule,
    MatButtonModule,
    MatCheckboxModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    SdButton,
    SdQuickAction,
    TranslatePipe,
  ],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-autoid]': 'autoId()',
  },
})
export class SdTree<T = any> {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly option = input<SdTreeComponentOption<T> | undefined>(undefined);

  /** Migration bridge. New usage should put the data source in `option.items`. */
  readonly items = input<SdTreeDataSource<SdTreeItem<T>> | undefined>(undefined);
  /** Migration bridge. New usage should put static/lazy config in `option.tree`. */
  readonly tree = input<SdTreeOption<T> | undefined>(DEFAULT_STATIC_TREE);
  readonly selectedItemsInput = input<T[] | undefined | null>(undefined, { alias: 'selectedItems' });
  readonly commands = input<SdTreeCommand<T>[] | undefined | null>([]);
  readonly selectable = input(true, { transform: booleanAttribute });
  readonly selector = input<SdTreeSelectorOption<T> | undefined | null>(undefined);
  readonly itemTemplate = input<TemplateRef<SdTreeItemContext<T>> | undefined | null>(undefined);

  readonly selectedItemsChange = output<T[]>();
  readonly selectChange = output<SdTreeSelectionEvent<T>>();
  readonly expandChange = output<SdTreeToggleEvent<T>>();
  readonly collapseChange = output<SdTreeToggleEvent<T>>();
  readonly loadError = output<SdTreeLoadErrorEvent<T>>();

  readonly itemDef = contentChild(SdTreeItemDefDirective<T>);
  readonly resolvedItemsSource = computed<SdTreeDataSource<SdTreeItem<T>>>(() => {
    return this.option()?.items ?? this.items() ?? (EMPTY_TREE_ITEMS as SdTreeItem<T>[]);
  });
  readonly resolvedTree = computed<SdTreeOption<T>>(() => this.option()?.tree ?? this.tree() ?? (DEFAULT_STATIC_TREE as SdTreeOption<T>));
  readonly resolvedSelector = computed(() => this.option()?.selector ?? this.selector());
  readonly resolvedCommands = computed(() => this.option()?.commands ?? this.commands() ?? []);
  readonly resolvedSelectable = computed(() => this.option()?.selectable ?? this.selectable());
  readonly autoId = computed(() => {
    const scope = this.option()?.autoId ?? this.autoIdInput();
    return scope ? `components-tree-${scope}` : undefined;
  });
  readonly resolvedItemTemplate = computed<TemplateRef<SdTreeItemContext<T>> | undefined>(() => {
    return this.itemDef()?.templateRef || this.option()?.itemTemplate || this.itemTemplate() || undefined;
  });
  readonly indentSize = computed(() => this.resolvedTree().indentSize ?? 20);

  readonly #rootItems = signal<SdTreeItem<T>[]>([]);
  readonly #expandedState = signal<Record<string, boolean>>({});
  readonly #loadingState = signal<Record<string, boolean>>({});
  readonly #lazyChildren = signal<Record<string, SdTreeItemLazy<T>[]>>({});
  readonly #lazyErrorState = signal<Record<string, unknown>>({});
  readonly #selectedIds = signal<Set<string>>(new Set());
  readonly #filterText = signal('');
  readonly #reloadTick = signal(0);
  readonly rootLoading = signal(false);
  readonly rootError = signal<unknown | null>(null);
  readonly activeNodeId = signal<string | null>(null);

  #rootLoadId = 0;
  #lastSource?: SdTreeDataSource<SdTreeItem<T>>;
  #lastSourceValue?: SdTreeItem<T>[];
  #lastReloadTick = -1;
  #treeGeneration = 0;
  readonly #lazyLoadIds = new Map<string, number>();

  readonly normalizedFilterText = computed(() => normalizeText(this.#filterText()));
  readonly selectionVisible = computed(() => this.resolvedSelectable() && this.resolvedSelector()?.visible === true);
  readonly selectedIdSet = computed(() => {
    const selectedItems = this.option()?.selectedItems ?? this.selectedItemsInput();
    return selectedItems ? this.#idsFromSelectedItems(selectedItems) : this.#selectedIds();
  });

  readonly rootNodes = computed<SdTreeNode<T>[]>(() => this.#buildNodes(this.#rootItems(), 0, null));

  readonly visibleNodes = computed<SdTreeNode<T>[]>(() => {
    const filterText = this.normalizedFilterText();
    const result: SdTreeNode<T>[] = [];

    const walk = (nodes: SdTreeNode<T>[]) => {
      for (const node of nodes) {
        const nodeOrDescendantMatches = this.#subtreeMatches(node, filterText);
        if (!filterText || nodeOrDescendantMatches) {
          result.push(node);
        }

        const shouldShowChildren = filterText ? nodeOrDescendantMatches : node.isExpanded;
        if (shouldShowChildren) {
          walk(node.children);
        }
      }
    };

    walk(this.rootNodes());
    return result;
  });
  readonly selectedItems = computed(() => this.#selectedItemsFromIds(this.selectedIdSet()));
  readonly selectedCount = computed(() => this.selectedItems().length);
  readonly selectionMessage = computed(() => {
    const items = this.selectedItems();
    const message = this.resolvedSelector()?.message;
    if (typeof message === 'function') return message(items);
    return message || `Đã chọn ${items.length} mục`;
  });
  readonly visibleSelectionActions = computed(() => {
    const items = this.selectedItems();
    return (this.resolvedSelector()?.actions || []).filter(action => {
      const hidden = typeof action.hidden === 'function' ? action.hidden(items) : action.hidden;
      return !hidden;
    });
  });
  readonly selectionActionViews = computed<SdTreeSelectionActionView<T>[]>(() => {
    return this.visibleSelectionActions().map((action, index) => ({
      action,
      autoId: this.#selectionActionAutoId(index),
    }));
  });
  readonly clearSelectionAutoId = computed(() => {
    const base = this.autoId();
    return base ? `${base}-clear-selection` : null;
  });

  /**
   * Template-facing row model. Expensive/variable values are resolved once per
   * signal recomputation so the HTML does not call helper methods for every CD pass.
   */
  readonly visibleViewNodes = computed<SdTreeViewNode<T>[]>(() => {
    const selectedIds = this.selectedIdSet();
    const selectedItems = this.selectedItems();
    const selector = this.resolvedSelector();
    const commands = this.resolvedCommands();
    const nodes = this.visibleNodes();
    const requestedActiveId = this.activeNodeId();
    const activeId = nodes.some(node => node.id === requestedActiveId) ? requestedActiveId : nodes[0]?.id;
    // why: đếm 1 lượt bottom-up cho CẢ cây rồi tra theo id. Bản cũ gọi `#flattenAll(node.children)`
    // cho TỪNG node hiển thị ngay trong map này → O(n²) kèm một mảng mới mỗi node mỗi lần
    // recompute. Chỉ cascade 'descendants' mới cần số liệu này nên các chế độ khác bỏ qua hẳn.
    const selectedDescendants =
      selector?.cascade === 'descendants' ? this.#countSelectedDescendants(this.rootNodes(), selectedIds) : EMPTY_DESCENDANT_COUNTS;
    return nodes.map(node =>
      this.#toViewNode(node, selectedIds, selectedItems, selector, commands, node.id === activeId, selectedDescendants)
    );
  });

  readonly trackByNode = (_index: number, node: SdTreeNode<T>): string => node.id;

  constructor() {
    effect(() => {
      const source = this.resolvedItemsSource();
      const reloadTick = this.#reloadTick();

      // Data sources can be arrays, signals, sync loaders, or async loaders.
      // The effect normalizes them into #rootItems; `reload()` only bumps the tick.
      if (isSignal(source)) {
        const items = source();
        untracked(() => this.#applySignalSource(source, items, reloadTick));
        return;
      }

      untracked(() => {
        if (source === this.#lastSource && reloadTick === this.#lastReloadTick) return;

        this.#lastSource = source;
        this.#lastSourceValue = undefined;
        this.#lastReloadTick = reloadTick;
        this.#loadRootItems(source);
      });
    });
  }

  reload(): void {
    this.#reloadTick.update(value => value + 1);
  }

  filter(searchText: string | undefined | null): void {
    this.#filterText.set(searchText ?? '');
  }

  isSelected(node: SdTreeNode<T>): boolean {
    return this.selectedIdSet().has(node.id);
  }

  nodeIcon(node: SdTreeNode<T>): string | undefined {
    return this.#iconOf(node);
  }

  visibleCommands(node: SdTreeNode<T>): SdTreeCommand<T>[] {
    return this.resolvedCommands().filter(command => !this.#resolveBoolean(command.hidden, node.data));
  }

  isSelectionDisabled(node: SdTreeNode<T>): boolean {
    const disabled = this.resolvedSelector()?.disabled;
    return disabled ? disabled(node.data, this.selectedItems()) : false;
  }

  commandTitle(command: SdTreeCommand<T>, item: T): string {
    return typeof command.title === 'function' ? command.title(item) : command.title;
  }

  commandIcon(command: SdTreeCommand<T>, item: T): string {
    const icon = typeof command.icon === 'function' ? command.icon(item) : command.icon;
    return icon || 'more_horiz';
  }

  isCommandDisabled(command: SdTreeCommand<T>, item: T): boolean {
    return this.#resolveBoolean(command.disabled, item);
  }

  async toggle(node: SdTreeNode<T>, event?: Event): Promise<void> {
    event?.stopPropagation();
    const currentNode = this.#findNode(node.id) ?? node;
    if (!currentNode.hasChildren || currentNode.isLoading) return;

    if (currentNode.isExpanded) {
      this.#expandedState.update(state => ({ ...state, [currentNode.id]: false }));
      const toggleEvent = { item: currentNode.data, expanded: false, node: { ...currentNode, isExpanded: false } };
      this.option()?.onCollapse?.(toggleEvent);
      this.collapseChange.emit(toggleEvent);
      return;
    }

    await this.#ensureLazyChildren(currentNode);
    const nextNode = this.#findNode(currentNode.id) ?? currentNode;
    if (!nextNode.hasChildren || nextNode.loadError) return;

    this.#expandedState.update(state => ({ ...state, [currentNode.id]: true }));
    const toggleEvent = { item: currentNode.data, expanded: true, node: { ...nextNode, isExpanded: true } };
    this.option()?.onExpand?.(toggleEvent);
    this.expandChange.emit(toggleEvent);
  }

  toggleSelection(node: SdTreeNode<T>, event?: Event): void {
    event?.stopPropagation();
    if (!this.selectionVisible() || this.isSelectionDisabled(node)) return;

    const selector = this.resolvedSelector();
    const selectedIds = new Set(this.selectedIdSet());
    const shouldSelect = !selectedIds.has(node.id);
    if (selector?.single) {
      selectedIds.clear();
      if (shouldSelect) selectedIds.add(node.id);
    } else if (selector?.cascade === 'descendants') {
      this.#setNodeAndDescendants(node, shouldSelect, selectedIds);
      this.#reconcileAncestors(node.parent, selectedIds);
    } else if (shouldSelect) {
      selectedIds.add(node.id);
    } else {
      selectedIds.delete(node.id);
    }

    this.#selectedIds.set(selectedIds);
    const selectedItems = this.#selectedItemsFromIds(selectedIds);
    this.option()?.onSelectedItemsChange?.(selectedItems);
    this.selectedItemsChange.emit(selectedItems);
    const selectionEvent = { item: node.data, selected: selectedIds.has(node.id), selectedItems };
    this.option()?.onSelect?.(selectionEvent);
    this.selectChange.emit(selectionEvent);
  }

  clearSelection(): void {
    this.#selectedIds.set(new Set());
    this.option()?.onSelectedItemsChange?.([]);
    this.selectedItemsChange.emit([]);
  }

  onSelectionAction(action: SdTreeSelectionAction<T>): void {
    action.click(this.selectedItems());
  }

  retry(): void {
    this.reload();
  }

  retryNode(node: SdTreeNode<T>, event?: Event): void {
    event?.stopPropagation();
    this.#lazyErrorState.update(state => {
      const next = { ...state };
      delete next[node.id];
      return next;
    });
    void this.toggle(node);
  }

  errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error || 'Unable to load tree data');
  }

  onRowFocus(node: SdTreeNode<T>): void {
    this.activeNodeId.set(node.id);
  }

  onRowKeydown(node: SdTreeNode<T>, event: KeyboardEvent): void {
    if (event.target !== event.currentTarget) return;
    const nodes = this.visibleNodes();
    const index = nodes.findIndex(item => item.id === node.id);
    if (index < 0) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.#focusVisibleNode(Math.min(nodes.length - 1, index + 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.#focusVisibleNode(Math.max(0, index - 1));
        return;
      case 'Home':
        event.preventDefault();
        this.#focusVisibleNode(0);
        return;
      case 'End':
        event.preventDefault();
        this.#focusVisibleNode(nodes.length - 1);
        return;
      case 'ArrowRight':
        if (!node.hasChildren) return;
        event.preventDefault();
        if (!node.isExpanded) void this.toggle(node);
        else if (nodes[index + 1]?.parent?.id === node.id) this.#focusVisibleNode(index + 1);
        return;
      case 'ArrowLeft':
        if (!node.isExpanded && !node.parent) return;
        event.preventDefault();
        if (node.isExpanded) void this.toggle(node);
        else this.#focusVisibleNode(nodes.findIndex(item => item.id === node.parent?.id));
        return;
      case 'Enter':
      case ' ':
        if (!this.selectionVisible()) return;
        event.preventDefault();
        this.toggleSelection(node);
    }
  }

  createContext(node: SdTreeNode<T>): SdTreeItemContext<T> {
    return this.#createContext(node, this.isSelected(node));
  }

  nodeAutoId(node: SdTreeNode<T>, part: SdTreeAutoIdPart): string | undefined {
    const base = this.autoId();
    return base ? `${base}-${part}-${sanitizeId(node.id)}` : undefined;
  }

  commandAutoId(node: SdTreeNode<T>, command: SdTreeCommand<T>): string | undefined {
    const base = this.nodeAutoId(node, 'command');
    return base ? `${base}-${sanitizeId(command.key)}` : undefined;
  }

  #applySignalSource(source: SdTreeDataSource<SdTreeItem<T>>, items: SdTreeItem<T>[], reloadTick: number): void {
    if (source === this.#lastSource && items === this.#lastSourceValue && reloadTick === this.#lastReloadTick) return;

    // A signal source takes ownership immediately. Any promise started by the
    // previous source must no longer be allowed to replace its current value.
    this.#rootLoadId += 1;
    this.#lastSource = source;
    this.#lastSourceValue = items;
    this.#lastReloadTick = reloadTick;
    this.rootLoading.set(false);
    this.rootError.set(null);
    this.#setRootItems(items);
  }

  #loadRootItems(source: SdTreeDataSource<SdTreeItem<T>>): void {
    const loadId = ++this.#rootLoadId;
    this.rootLoading.set(true);
    this.rootError.set(null);
    try {
      const result = this.#readItemsSource(source);
      if (isPromiseLike(result)) {
        result
          .then(items => {
            if (loadId === this.#rootLoadId) {
              this.#setRootItems(items);
            }
          })
          .catch(error => {
            if (loadId !== this.#rootLoadId) return;
            this.rootError.set(error);
            this.#setRootItems([]);
            this.loadError.emit({ error });
          })
          .finally(() => {
            if (loadId === this.#rootLoadId) this.rootLoading.set(false);
          });
        return;
      }

      if (loadId === this.#rootLoadId) {
        this.#setRootItems(result);
        this.rootLoading.set(false);
      }
    } catch (error) {
      if (loadId === this.#rootLoadId) {
        this.rootError.set(error);
        this.#setRootItems([]);
        this.rootLoading.set(false);
        this.loadError.emit({ error });
      }
    }
  }

  #readItemsSource(source: SdTreeDataSource<SdTreeItem<T>>): SdTreeItem<T>[] | Promise<SdTreeItem<T>[]> {
    if (isSignal(source)) return source();
    if (typeof source === 'function') return source();
    return source;
  }

  #setRootItems(items: SdTreeItem<T>[] | undefined | null): void {
    this.#treeGeneration += 1;
    this.#lazyLoadIds.clear();
    this.#rootItems.set([...(items ?? [])]);
    this.#lazyChildren.set({});
    this.#loadingState.set({});
    this.#lazyErrorState.set({});
  }

  #toViewNode(
    node: SdTreeNode<T>,
    selectedIds: Set<string>,
    selectedItems: T[],
    selector: SdTreeSelectorOption<T> | undefined | null,
    commands: SdTreeCommand<T>[],
    active: boolean,
    selectedDescendants: ReadonlyMap<string, number>
  ): SdTreeViewNode<T> {
    const selected = selectedIds.has(node.id);
    const selectionDisabled = selector?.disabled ? selector.disabled(node.data, selectedItems) : false;
    const viewNode = {
      ...node,
      icon: this.#iconOf(node),
      selected,
      selectionDisabled,
      selectionIndeterminate: this.#isSelectionIndeterminate(node, selectedIds, selector, selectedDescendants),
      toggleDisabled: !node.hasChildren || node.isLoading,
      toggleLabel: node.loadError ? 'Retry loading tree item' : node.isExpanded ? 'Collapse tree item' : 'Expand tree item',
      ariaExpanded: node.hasChildren ? node.isExpanded : null,
      autoIds: this.#nodeAutoIds(node),
      commands: this.#commandViews(node, commands),
      context: undefined as unknown as SdTreeItemContext<T>,
      tabIndex: active ? (0 as const) : (-1 as const),
    };

    viewNode.context = this.#createContext(viewNode, selected);
    return viewNode;
  }

  #commandViews(node: SdTreeNode<T>, commands: SdTreeCommand<T>[]): SdTreeViewCommand<T>[] {
    return commands
      .filter(command => !this.#resolveBoolean(command.hidden, node.data))
      .map(command => ({
        key: command.key,
        command,
        title: this.commandTitle(command, node.data),
        icon: this.commandIcon(command, node.data),
        color: command.color || 'secondary',
        fontSet: command.fontSet || 'material-icons-outlined',
        disabled: this.isCommandDisabled(command, node.data),
        autoId: this.commandAutoId(node, command),
        defaultColor: !command.color,
      }));
  }

  #createContext(node: SdTreeNode<T>, selected: boolean): SdTreeItemContext<T> {
    return {
      $implicit: node.data,
      item: node.data,
      treeItem: node.treeItem,
      node,
      level: node.level,
      expanded: node.isExpanded,
      selected,
      loading: node.isLoading,
      loadError: node.loadError,
      hasChildren: node.hasChildren,
      isLeaf: !node.hasChildren,
      toggle: () => void this.toggle(node),
      select: () => this.toggleSelection(node),
      retry: () => this.retryNode(node),
    };
  }

  #nodeAutoIds(node: SdTreeNode<T>): SdTreeNodeAutoIds {
    return {
      row: this.nodeAutoId(node, 'row'),
      toggle: this.nodeAutoId(node, 'toggle'),
      checkbox: this.nodeAutoId(node, 'checkbox'),
      icon: this.nodeAutoId(node, 'icon'),
      label: this.nodeAutoId(node, 'label'),
      command: this.nodeAutoId(node, 'command'),
    };
  }

  #selectionActionAutoId(index: number): string | null {
    const base = this.autoId();
    return base ? `${base}-selection-action-${index}` : null;
  }

  #buildNodes(items: SdTreeItem<T>[], level: number, parent: SdTreeNode<T> | null): SdTreeNode<T>[] {
    const option = this.resolvedTree();
    const maxDepth = option.maxDepth;
    if (maxDepth !== undefined && level > maxDepth) return [];
    // why: node NẰM ĐÚNG ở maxDepth không bao giờ có con (đệ quy dừng ở level + 1), nên phải kẹp
    // `hasChildren` về false. Trước đây `hasChildren` vẫn đọc từ children THÔ → chevron bật, bấm
    // vào expand ra rỗng mà vẫn bắn `expandChange` (và lazy vẫn gọi `onExpandChildren`).
    const atMaxDepth = maxDepth !== undefined && level >= maxDepth;
    const tree = this;

    return items.map(item => {
      const rawChildren = this.#childrenOf(item);
      const hasChildren = !atMaxDepth && (rawChildren.length > 0 || this.#hasLazyChildren(item));
      const node: SdTreeNode<T> = {
        treeItem: item,
        data: item.data,
        id: item.id,
        label: item.label,
        level,
        parent,
        children: [],
        hasChildren,
        // why: state UI (expand / loading / lazy error) được đọc THEO ID lúc truy cập chứ không
        // đóng băng lúc build. Nhờ vậy `rootNodes` chỉ phụ thuộc cấu trúc (`#rootItems`,
        // `#lazyChildren`, option) — mở một node không còn cấp phát lại TOÀN BỘ cây rồi kéo theo
        // `visibleNodes` + `visibleViewNodes` map lại từ đầu. Consumer nào đọc các field này bên
        // trong computed/template vẫn nhận đúng dependency signal, nên phản ứng không đổi.
        get isExpanded(): boolean {
          return tree.#expandedState()[item.id] ?? item.expanded ?? tree.#defaultExpanded(level);
        },
        get isLoading(): boolean {
          return tree.#loadingState()[item.id] ?? false;
        },
        get loadError(): unknown {
          return tree.#lazyErrorState()[item.id];
        },
      };
      node.children = this.#buildNodes(rawChildren, level + 1, node);
      return node;
    });
  }

  #childrenOf(item: SdTreeItem<T>): SdTreeItem<T>[] {
    const option = this.resolvedTree();
    // Static items own their `children`; lazy items keep loaded children in component state.
    if (option.loadType === 'lazy') {
      return this.#lazyChildren()[item.id] ?? [];
    }

    return item.children ?? [];
  }

  #hasLazyChildren(item: SdTreeItem<T>): boolean {
    const option = this.resolvedTree();
    if (option.loadType !== 'lazy' || this.#lazyChildren()[item.id]) return false;
    // Lazy mode uses `hasChildren` as the branch hint before children are loaded.
    return item.hasChildren ?? true;
  }

  #defaultExpanded(level: number): boolean {
    const option = this.resolvedTree();
    if (option.loadType !== 'static') return false;

    const value = option.defaultExpanded ?? false;
    if (value === true) return true;
    if (value === false) return false;
    return level < value;
  }

  #iconOf(node: SdTreeNode<T>): string | undefined {
    // One optional `treeItem.icon` handles both branch and leaf overrides.
    // Without it, branches get folder icons while leaves intentionally render no icon.
    if (node.treeItem.icon) return node.treeItem.icon;
    if (!node.hasChildren) return undefined;
    return node.isExpanded ? 'folder_open' : 'folder';
  }

  async #ensureLazyChildren(node: SdTreeNode<T>): Promise<void> {
    const option = this.resolvedTree();
    if (option.loadType !== 'lazy' || node.children.length > 0 || this.#lazyChildren()[node.id]) return;

    const generation = this.#treeGeneration;
    const loadId = (this.#lazyLoadIds.get(node.id) ?? 0) + 1;
    this.#lazyLoadIds.set(node.id, loadId);
    this.#loadingState.update(state => ({ ...state, [node.id]: true }));
    this.#lazyErrorState.update(state => {
      const next = { ...state };
      delete next[node.id];
      return next;
    });
    try {
      const lazyItem = node.treeItem as SdTreeItemLazy<T>;
      const children = await Promise.resolve(option.onExpandChildren(lazyItem));
      if (generation !== this.#treeGeneration || this.#lazyLoadIds.get(node.id) !== loadId) return;
      this.#lazyChildren.update(state => ({ ...state, [node.id]: children }));
      // Do not write `children` onto lazy items; that field belongs to static items only.
      lazyItem.hasChildren = children.length > 0;
    } catch (error) {
      if (generation !== this.#treeGeneration || this.#lazyLoadIds.get(node.id) !== loadId) return;
      this.#lazyErrorState.update(state => ({ ...state, [node.id]: error }));
      this.loadError.emit({ item: node.data, error });
    } finally {
      if (generation === this.#treeGeneration && this.#lazyLoadIds.get(node.id) === loadId) {
        this.#loadingState.update(state => ({ ...state, [node.id]: false }));
      }
    }
  }

  #setNodeAndDescendants(node: SdTreeNode<T>, selected: boolean, selectedIds: Set<string>): void {
    if (!this.isSelectionDisabled(node)) {
      if (selected) selectedIds.add(node.id);
      else selectedIds.delete(node.id);
    }
    node.children.forEach(child => this.#setNodeAndDescendants(child, selected, selectedIds));
  }

  #reconcileAncestors(node: SdTreeNode<T> | null, selectedIds: Set<string>): void {
    let current = node;
    while (current) {
      const selectableChildren = current.children.filter(child => !this.isSelectionDisabled(child));
      if (selectableChildren.length > 0 && selectableChildren.every(child => selectedIds.has(child.id))) selectedIds.add(current.id);
      else selectedIds.delete(current.id);
      current = current.parent;
    }
  }

  /**
   * `node.id` → số node ĐƯỢC CHỌN nằm trong subtree của nó (không tính chính nó).
   * Một lượt duyệt bottom-up cho cả cây, thay cho việc flatten lại subtree của từng node.
   */
  #countSelectedDescendants(nodes: SdTreeNode<T>[], selectedIds: Set<string>): ReadonlyMap<string, number> {
    const counts = new Map<string, number>();
    const walk = (node: SdTreeNode<T>): number => {
      let total = 0;
      for (const child of node.children) {
        total += walk(child) + (selectedIds.has(child.id) ? 1 : 0);
      }
      counts.set(node.id, total);
      return total;
    };
    for (const node of nodes) walk(node);
    return counts;
  }

  #isSelectionIndeterminate(
    node: SdTreeNode<T>,
    selectedIds: Set<string>,
    selector: SdTreeSelectorOption<T> | undefined | null,
    selectedDescendants: ReadonlyMap<string, number>
  ): boolean {
    if (selector?.cascade !== 'descendants' || selectedIds.has(node.id)) return false;
    return (selectedDescendants.get(node.id) ?? 0) > 0;
  }

  #focusVisibleNode(index: number): void {
    if (index < 0) return;
    const node = this.visibleNodes()[index];
    const row = this.#host.nativeElement.querySelectorAll<HTMLElement>('[role="treeitem"]')[index];
    if (!node || !row) return;
    this.activeNodeId.set(node.id);
    row.focus();
  }

  #findNode(id: string): SdTreeNode<T> | undefined {
    return this.#flattenAll(this.rootNodes()).find(node => node.id === id);
  }

  #flattenAll(nodes: SdTreeNode<T>[]): SdTreeNode<T>[] {
    const result: SdTreeNode<T>[] = [];
    const walk = (current: SdTreeNode<T>[]) => {
      for (const node of current) {
        result.push(node);
        walk(node.children);
      }
    };
    walk(nodes);
    return result;
  }

  #selectedItemsFromIds(selectedIds: Set<string>): T[] {
    return this.#flattenAll(this.rootNodes())
      .filter(node => selectedIds.has(node.id))
      .map(node => node.data);
  }

  #idsFromSelectedItems(selectedItems: T[]): Set<string> {
    const selectedRefs = new Set(selectedItems);
    const selectedDataIds = new Set(selectedItems.map(item => this.#dataId(item)).filter((id): id is string => !!id));
    const result = new Set<string>();

    for (const node of this.#flattenAll(this.rootNodes())) {
      const dataId = this.#dataId(node.data);
      if (selectedRefs.has(node.data) || (dataId && selectedDataIds.has(dataId))) {
        result.add(node.id);
      }
    }

    return result;
  }

  #dataId(item: T): string | undefined {
    const record = item as Record<string, unknown>;
    const value = record?.['id'] ?? record?.['code'] ?? record?.['value'];
    return value != null && value !== '' ? String(value) : undefined;
  }

  #nodeMatches(node: SdTreeNode<T>, filterText: string): boolean {
    return normalizeText(node.label).includes(filterText);
  }

  #subtreeMatches(node: SdTreeNode<T>, filterText: string): boolean {
    if (this.#nodeMatches(node, filterText)) return true;
    return node.children.some(child => this.#subtreeMatches(child, filterText));
  }

  #resolveBoolean(resolver: boolean | ((item: T) => boolean) | undefined, item: T): boolean {
    return typeof resolver === 'function' ? resolver(item) : !!resolver;
  }
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u0111\u0110]/g, match => (match === '\u0110' ? 'D' : 'd'))
    .toLowerCase()
    .trim();
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function isPromiseLike<T>(value: T[] | Promise<T[]>): value is Promise<T[]> {
  return !!value && typeof (value as Promise<T[]>).then === 'function';
}
