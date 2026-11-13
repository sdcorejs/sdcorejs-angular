import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  TemplateRef,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isSignal,
  model,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SdButton, SdButtonItem } from '@sdcorejs/angular/components/button';
import { SdHighlight } from '@sdcorejs/angular/components/highlight';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdTreeItemDefDirective } from './tree-item-def.directive';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import {
  SdTreeCommand,
  SdTreeDataSource,
  SdTreeComponentOption,
  SdTreeItem,
  SdTreeItemContext,
  SdTreeItemLazy,
  SdTreeLazyOption,
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

export interface SdTreeViewCommand<T = unknown> {
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

export interface SdTreeViewNode<T = unknown> extends SdTreeNode<T> {
  icon?: string;
  selected: boolean;
  /** Nút đang mở (chỉ khi `navigation` bật). */
  active: boolean;
  /** Hàng được tô nền: nút đang mở khi `navigation` bật, ngược lại là hàng đã chọn. */
  highlighted: boolean;
  ariaSelected: boolean | null;
  /** Tên đọc "{label}, {count}" khi có số đếm; `null` để hàng lấy tên từ nội dung. */
  ariaLabel: string | null;
  /** Số đếm đã định dạng theo locale; `null`: không vẽ. */
  count: string | null;
  menuLabel: string;
  /** Kết quả tìm trên server: nút chỉ nằm trên đường tới nút khớp. */
  muted: boolean;
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

/** Cây kết quả của `onSearch`: các đường đi đã gộp theo id. */
interface SdTreeSearchResult<T> {
  text: string;
  roots: SdTreeItemLazy<T>[];
  children: Map<string, SdTreeItemLazy<T>[]>;
  matched: Set<string>;
}

// Cùng thời gian chờ với đường lọc của sd-table (filter 500ms + reload 200ms).
const SEARCH_DEBOUNCE_MS = 700;

export interface SdTreeSelectionActionView<T = unknown> {
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
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    SdButton,
    SdButtonItem,
    SdHighlight,
    SdQuickAction,
    SdTranslatePipe,
  ],
  templateUrl: './tree.component.html',
  styleUrl: './tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-autoid]': 'autoId()',
  },
})
export class SdTree<T = unknown> {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #i18n = inject(I18nService);
  readonly #injector = inject(Injector);
  readonly autoIdInput = input<string | undefined | null>(undefined, { alias: 'autoId' });
  readonly option = input<SdTreeComponentOption<T> | undefined>(undefined);

  /** Migration bridge. New usage should put the data source in `option.items`. */
  readonly items = input<SdTreeDataSource<SdTreeItem<T>> | undefined>(undefined);
  /** Migration bridge. New usage should put static/lazy config in `option.tree`. */
  readonly tree = input<SdTreeOption<T> | undefined>(DEFAULT_STATIC_TREE);
  readonly selectedItemsInput = input<T[] | undefined | null>(undefined, { alias: 'selectedItems' });
  readonly commands = input<SdTreeCommand<T>[] | undefined | null>([]);
  readonly selectable = input(true, { transform: booleanAttribute });
  readonly showLines = input(false, { transform: booleanAttribute });
  readonly selector = input<SdTreeSelectorOption<T> | undefined | null>(undefined);
  readonly itemTemplate = input<TemplateRef<SdTreeItemContext<T>> | undefined | null>(undefined);

  readonly selectedItemsChange = output<T[]>();
  readonly selectChange = output<SdTreeSelectionEvent<T>>();
  readonly expandChange = output<SdTreeToggleEvent<T>>();
  readonly collapseChange = output<SdTreeToggleEvent<T>>();
  readonly loadError = output<SdTreeLoadErrorEvent<T>>();
  /**
   * Id của nút đang mở (chế độ `navigation`). Là model trên component, không nằm trong `[option]`, để gắn hai
   * chiều với URL.
   */
  readonly activeId = model<string | null>(null);
  /** Phát mỗi lần người dùng mở một nút, kể cả nút đang mở. */
  readonly activeChange = output<{ item: T; node: SdTreeNode<T> }>();
  /**
   * Trạng thái mở. Có giá trị: là nguồn của trạng thái mở (hai chiều), `expanded` và `defaultExpanded` không còn
   * áp dụng. `undefined`: cây tự quản lý như cũ. Đổi `items` không reset.
   */
  readonly expandedIds = model<readonly string[] | undefined>();

  readonly itemDef = contentChild(SdTreeItemDefDirective<T>);
  readonly resolvedItemsSource = computed<SdTreeDataSource<SdTreeItem<T>>>(() => {
    return this.option()?.items ?? this.items() ?? (EMPTY_TREE_ITEMS as SdTreeItem<T>[]);
  });
  readonly resolvedTree = computed<SdTreeOption<T>>(() => this.option()?.tree ?? this.tree() ?? (DEFAULT_STATIC_TREE as SdTreeOption<T>));
  readonly resolvedSelector = computed(() => this.option()?.selector ?? this.selector());
  readonly resolvedCommands = computed(() => this.option()?.commands ?? this.commands() ?? []);
  readonly resolvedSelectable = computed(() => this.option()?.selectable ?? this.selectable());
  readonly resolvedShowLines = computed(() => this.option()?.showLines ?? this.showLines());
  readonly navigation = computed(() => this.option()?.navigation === true);
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
  readonly #search = signal<SdTreeSearchResult<T> | null>(null);
  /** Nút người dùng đã đóng trong kết quả tìm. Tách khỏi trạng thái mở thật để xoá chữ là cây về như cũ. */
  readonly #searchCollapsed = signal<ReadonlySet<string>>(new Set());
  /** Đang chờ debounce hoặc chờ `onSearch` trả về. */
  readonly searchPending = signal(false);
  readonly #serverSearch = computed(() => {
    const tree = this.resolvedTree();
    return tree.loadType === 'lazy' && !!tree.onSearch;
  });
  /** Chữ cần tô trong nhãn: chữ đang lọc (static) hoặc chữ của kết quả đang hiện (server). */
  readonly highlightTerm = computed(() => (this.#serverSearch() ? (this.#search()?.text ?? '') : this.#filterText().trim()));
  readonly #expandedIdSet = computed(() => {
    const ids = this.expandedIds();
    return ids === undefined ? undefined : new Set(ids);
  });
  readonly rootLoading = signal(false);
  readonly rootError = signal<unknown | null>(null);
  readonly activeNodeId = signal<string | null>(null);
  private readonly buttons = viewChildren(SdButton);
  /** Hàng đã mở menu ⋯ bằng bàn phím; menu đóng thì focus quay về đây. */
  #keyboardMenuRow: HTMLElement | null = null;

  #rootLoadId = 0;
  #lastSource?: SdTreeDataSource<SdTreeItem<T>>;
  #lastSourceValue?: SdTreeItem<T>[];
  #lastReloadTick = -1;
  #treeGeneration = 0;
  readonly #lazyLoadIds = new Map<string, number>();
  /** Lần tải con đang chạy theo id, để `reveal`, `expand` và `expandedIds` không gọi `onExpandChildren` hai lần. */
  readonly #lazyLoads = new Map<string, Promise<void>>();
  #revealController: AbortController | null = null;
  #searchController: AbortController | null = null;
  #searchTimer?: ReturnType<typeof setTimeout>;
  /** Nút `reveal` đang chờ hàng của nó được render để cuộn tới. */
  #pendingScrollId: string | null = null;
  /** Id do người dùng vừa mở: lần đổi `activeId` này không cần `reveal`. */
  #userActiveId: string | null = null;
  /** Id đã `reveal` xong: tải lại `items` không cuộn lại lần nữa. */
  #revealedId: string | null = null;

  readonly normalizedFilterText = computed(() => normalizeText(this.#filterText()));
  readonly selectionVisible = computed(() => this.resolvedSelectable() && this.resolvedSelector()?.visible === true);
  /**
   * why: `selector.single` giới hạn đúng một node, nên ô chọn phải là radio — checkbox là ký hiệu
   * của "chọn nhiều" và người dùng chỉ phát hiện ra giới hạn sau khi tick node thứ hai và thấy node
   * đầu tự bỏ chọn. `<sd-tree-select>` không multiple sẽ tự rơi vào nhánh này.
   */
  readonly selectionSingle = computed(() => this.resolvedSelector()?.single === true);
  readonly selectedIdSet = computed(() => {
    const selectedItems = this.option()?.selectedItems ?? this.selectedItemsInput();
    return selectedItems ? this.#idsFromSelectedItems(selectedItems) : this.#selectedIds();
  });

  readonly rootNodes = computed<SdTreeNode<T>[]>(() => {
    const search = this.#search();
    return search ? this.#buildSearchNodes(search, search.roots, 0, null) : this.#buildNodes(this.#rootItems(), 0, null);
  });

  readonly visibleNodes = computed<SdTreeNode<T>[]>(() => {
    // Tìm trên server: kết quả đã là cây cần hiện, không lọc lại các nút đã tải.
    const filterText = this.#serverSearch() ? '' : this.normalizedFilterText();
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
  /** Use visible siblings so filtering and collapsed/lazy branches leave no dangling connectors. */
  readonly treeLines = computed(() => {
    const result = new Map<string, { children: boolean; segments: { level: number; branch: boolean; last: boolean }[] }>();
    if (!this.resolvedShowLines()) return result;
    const nodes = this.visibleNodes();
    const lastChild = new Map<string, string>();
    for (const node of nodes) {
      if (node.parent) lastChild.set(node.parent.id, node.id);
    }
    for (const node of nodes) {
      const segments: { level: number; branch: boolean; last: boolean }[] = [];
      for (let current = node; current.parent; current = current.parent) {
        const last = lastChild.get(current.parent.id) === current.id;
        const branch = current === node;
        if (branch || !last) segments.push({ level: current.level - 1, branch, last });
      }
      result.set(node.id, { children: lastChild.has(node.id), segments });
    }
    return result;
  });
  readonly selectedCount = computed(() => this.selectedItems().length);
  readonly selectionMessage = computed(() => {
    const items = this.selectedItems();
    const message = this.resolvedSelector()?.message;
    if (typeof message === 'function') return message(items);
    // why: số lượng phải là tham số nội suy, không nối chuỗi — mỗi ngôn ngữ đặt con số ở vị trí khác
    // nhau ('Đã chọn 3 mục' / '3 item(s) selected' / '已选择 3 项').
    return message || this.#i18n.t('core.component.tree.selected-count', { count: items.length });
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
   * why: chọn node mà selector KHÔNG khai action nào thì thanh quick-action chỉ còn bộ đếm + nút ✕.
   * Nó nổi đè lên cây để nói lại đúng thứ checkbox đã nói. Đó cũng là lý do `<sd-tree-select>` —
   * vốn chỉ chọn rồi bấm "Áp dụng" ở footer modal, không có action nào — không còn thấy thanh này.
   */
  readonly selectionQuickActionOpened = computed(() => this.selectedCount() > 0 && this.selectionActionViews().length > 0);

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
    const navigation = this.navigation();
    const openId = navigation ? this.activeId() : null;
    const selectionVisible = this.selectionVisible();
    const numberFormat = new Intl.NumberFormat(this.#i18n.locale());
    const matched = this.#search()?.matched;
    // why: đếm 1 lượt bottom-up cho CẢ cây rồi tra theo id. Bản cũ gọi `#flattenAll(node.children)`
    // cho TỪNG node hiển thị ngay trong map này → O(n²) kèm một mảng mới mỗi node mỗi lần
    // recompute. Chỉ cascade 'descendants' mới cần số liệu này nên các chế độ khác bỏ qua hẳn.
    const selectedDescendants =
      selector?.cascade === 'descendants' ? this.#countSelectedDescendants(this.rootNodes(), selectedIds) : EMPTY_DESCENDANT_COUNTS;
    return nodes.map(node => {
      const view = this.#toViewNode(node, selectedIds, selectedItems, selector, commands, node.id === activeId, selectedDescendants);
      const count = formatCount(node.treeItem.count, numberFormat);
      view.active = navigation && node.id === openId;
      // Q2: khi điều hướng, checkbox tự thể hiện lựa chọn; nền hàng chỉ dành cho nút đang mở.
      view.highlighted = navigation ? view.active : view.selected;
      // Q3: `aria-selected` là nút đang mở; lựa chọn của checkbox đi qua `aria-checked`.
      view.ariaSelected = navigation ? view.active : selectionVisible ? view.selected : null;
      view.muted = !!matched && !matched.has(node.id);
      view.count = count;
      view.ariaLabel = count === null ? null : `${node.label}, ${count}`;
      return view;
    });
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

    // R2: `activeId` đổi từ ngoài (URL, nút khác trên trang) thì tự mở tới nút đó.
    effect(() => {
      const id = this.activeId();
      const navigation = this.navigation();
      const loading = this.rootLoading();
      this.#rootItems();
      untracked(() => {
        if (id !== this.#revealedId) this.#revealedId = null;
        if (id === this.#userActiveId) return;
        this.#userActiveId = null;
        if (!navigation || id === null || loading || id === this.#revealedId) return;
        void this.reveal(id).then(revealed => {
          if (revealed && this.activeId() === id) this.#revealedId = id;
        });
      });
    });

    inject(DestroyRef).onDestroy(() => {
      this.#cancelSearch();
      this.#revealController?.abort();
    });

    // R7: lazy + `expandedIds` từ ngoài: nút được khai là đang mở thì phải có con để hiện.
    effect(() => {
      const expanded = this.#expandedIdSet();
      if (!expanded || this.resolvedTree().loadType !== 'lazy' || this.#search()) return;
      const loaded = this.#lazyChildren();
      const pending = this.#flattenAll(this.rootNodes()).filter(
        node => expanded.has(node.id) && !loaded[node.id] && node.treeItem.hasChildren !== false
      );
      untracked(() => {
        for (const node of pending) {
          if (!node.loadError) void this.#ensureLazyChildren(node);
        }
      });
    });

    effect(() => {
      const opened = this.buttons().some(button => button.popover.opened());
      untracked(() => {
        const row = this.#keyboardMenuRow;
        if (opened || !row) return;
        this.#keyboardMenuRow = null;
        // Action Popover trả focus về nút ⋯; menu mở từ hàng thì hàng mới là nơi người dùng đang đứng.
        if (row.isConnected && row.contains(document.activeElement)) row.focus();
      });
    });
  }

  reload(): void {
    this.#reloadTick.update(value => value + 1);
  }

  /**
   * Lọc cây theo chữ. Lazy có `tree.onSearch`: tìm trên server (debounce, huỷ lần trước) và hiện kết quả thay cây;
   * còn lại: lọc ngay trên các nút đã tải. Chữ rỗng trả cây về trạng thái trước khi tìm.
   */
  filter(searchText: string | undefined | null): void {
    const text = searchText ?? '';
    this.#filterText.set(text);
    const tree = this.resolvedTree();
    if (tree.loadType !== 'lazy' || !tree.onSearch) return;

    const onSearch = tree.onSearch;
    this.#cancelSearch();
    if (!text.trim()) {
      this.#search.set(null);
      this.#searchCollapsed.set(new Set());
      return;
    }
    this.searchPending.set(true);
    this.#searchTimer = setTimeout(() => void this.#runSearch(text, onSearch), SEARCH_DEBOUNCE_MS);
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

    if (currentNode.isExpanded) this.#collapseNode(currentNode);
    else await this.#expandNode(currentNode);
  }

  /**
   * Mở các nút cha của `id` rồi cuộn tới nút trong vùng cuộn gần nhất của cây; không lấy focus.
   * Static tìm trong `items`; lazy dùng `tree.onResolvePath` khi nút chưa được tải.
   * Trả `false` khi không tìm thấy, bị một lần `reveal` mới hơn huỷ, hoặc lỗi tải.
   */
  async reveal(id: string): Promise<boolean> {
    this.#revealController?.abort();
    const controller = new AbortController();
    this.#revealController = controller;
    const { signal } = controller;

    let path = this.#ancestorIds(id);
    if (!path) {
      const tree = this.resolvedTree();
      if (tree.loadType !== 'lazy' || !tree.onResolvePath) return false;
      try {
        path = [...(await tree.onResolvePath(id, signal))];
      } catch (error) {
        if (!signal.aborted) this.loadError.emit({ error });
        return false;
      }
    }

    for (const ancestorId of path) {
      if (signal.aborted) return false;
      const ancestor = this.#findNode(ancestorId);
      if (!ancestor || !(await this.#expandNode(ancestor))) return false;
    }
    if (signal.aborted || !this.#findNode(id)) return false;

    this.activeNodeId.set(id);
    this.#pendingScrollId = id;
    this.#scrollWhenRendered(id);
    return true;
  }

  /** Mở một nút theo id. Trả `false` khi không tìm thấy, nút là lá, hoặc tải con bị lỗi. */
  async expand(id: string): Promise<boolean> {
    const node = this.#findNode(id);
    return node ? this.#expandNode(node) : false;
  }

  /** Đóng một nút theo id. */
  collapse(id: string): void {
    const node = this.#findNode(id);
    if (node?.isExpanded) this.#collapseNode(node);
  }

  /** Lazy: bỏ cache con của nút, gọi lại `onExpandChildren`, giữ trạng thái mở. Static: không làm gì. */
  async reloadNode(id: string): Promise<void> {
    if (this.resolvedTree().loadType !== 'lazy') return;
    const node = this.#findNode(id);
    if (node) await this.#ensureLazyChildren(node, true);
  }

  /** Đặt roving tabindex và focus vào một nút đang hiển thị. Trả `false` khi nút không hiển thị. */
  focusNode(id: string): boolean {
    const row = this.#rowElement(id);
    if (!row) return false;
    this.activeNodeId.set(id);
    row.focus();
    return true;
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
    if (error instanceof Error) return error.message;
    // why: thông điệp mặc định khi lỗi không mang message — chuỗi này hiện ra cho người dùng cuối
    // nên phải theo ngôn ngữ đang chọn, không cứng tiếng Anh.
    return error ? String(error) : this.#i18n.t('core.component.tree.load-error');
  }

  onRowFocus(node: SdTreeNode<T>): void {
    this.activeNodeId.set(node.id);
  }

  /** Chế độ điều hướng: bấm vào hàng (trừ chevron, checkbox/radio, ⋯) mở nút. */
  onRowClick(node: SdTreeNode<T>, event: Event): void {
    if (!this.navigation()) return;
    const target = event.target as Element | null;
    if (target?.closest?.('.sd-tree__toggle, .sd-tree__checkbox, .sd-tree__radio, .sd-tree__command-trigger')) return;
    this.#activate(node);
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
      case 'F10':
      case 'ContextMenu':
        // R4: Shift+F10 hoặc phím ContextMenu mở menu ⋯ của hàng đang focus.
        if (!this.navigation() || (event.key === 'F10' && !event.shiftKey)) return;
        if (this.#openRowMenu(event.currentTarget as HTMLElement)) event.preventDefault();
        return;
      case 'Enter':
      case ' ':
        if (this.navigation() && event.key === 'Enter') {
          event.preventDefault();
          this.#activate(node);
          return;
        }
        if (!this.selectionVisible()) return;
        event.preventDefault();
        this.toggleSelection(node);
    }
  }

  #activate(node: SdTreeNode<T>): void {
    const current = this.#findNode(node.id) ?? node;
    // Người dùng đã tự chọn nút: bỏ lần `reveal` đang chạy để nó không cuộn cây đi chỗ khác.
    this.#revealController?.abort();
    this.#pendingScrollId = null;
    this.#userActiveId = current.id;
    this.activeNodeId.set(current.id);
    this.activeId.set(current.id);
    const event = { item: current.data, node: current };
    this.option()?.onActivate?.(event);
    this.activeChange.emit(event);
  }

  #openRowMenu(row: HTMLElement): boolean {
    const trigger = row.querySelector<HTMLButtonElement>('.sd-tree__command-trigger button');
    if (!trigger || trigger.disabled) return false;
    this.#keyboardMenuRow = row;
    if (trigger.getAttribute('aria-expanded') !== 'true') trigger.click();
    return true;
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
    this.#lazyLoads.clear();
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
      active: false,
      highlighted: selected,
      ariaSelected: null as boolean | null,
      ariaLabel: null as string | null,
      count: null as string | null,
      menuLabel: this.#i18n.t('core.component.tree.open-menu', { label: node.label }),
      muted: false,
      selectionDisabled,
      selectionIndeterminate: this.#isSelectionIndeterminate(node, selectedIds, selector, selectedDescendants),
      toggleDisabled: !node.hasChildren || node.isLoading,
      // why: nhãn nút gập/mở là tên khả truy cập cho screen reader — trước đây hardcode tiếng Anh
      // trong một component mà template đã dùng key `core.component.tree.retry`, tức lẫn hai ngôn ngữ.
      toggleLabel: this.#i18n.t(
        node.loadError ? 'core.component.tree.retry-item' : node.isExpanded ? 'core.component.tree.collapse' : 'core.component.tree.expand'
      ),
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
          const controlled = tree.#expandedIdSet();
          if (controlled) return controlled.has(item.id);
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

  #cancelSearch(): void {
    clearTimeout(this.#searchTimer);
    this.#searchTimer = undefined;
    this.#searchController?.abort();
    this.#searchController = null;
    this.searchPending.set(false);
  }

  async #runSearch(text: string, onSearch: NonNullable<SdTreeLazyOption<T>['onSearch']>): Promise<void> {
    const controller = new AbortController();
    this.#searchController = controller;
    try {
      const results = await onSearch(text, controller.signal);
      if (controller.signal.aborted) return;
      this.#searchCollapsed.set(new Set());
      this.#search.set(mergeSearchPaths(text, results));
    } catch (error) {
      if (!controller.signal.aborted) this.loadError.emit({ error });
    } finally {
      if (this.#searchController === controller) this.searchPending.set(false);
    }
  }

  /** Cây kết quả tìm: con lấy từ các đường đi đã gộp, mở hết trừ nút người dùng tự đóng, không tải lazy. */
  #buildSearchNodes(
    search: SdTreeSearchResult<T>,
    items: SdTreeItemLazy<T>[],
    level: number,
    parent: SdTreeNode<T> | null
  ): SdTreeNode<T>[] {
    const tree = this;
    return items.map(item => {
      const children = search.children.get(item.id) ?? [];
      const node: SdTreeNode<T> = {
        treeItem: item,
        data: item.data,
        id: item.id,
        label: item.label,
        level,
        parent,
        children: [],
        hasChildren: children.length > 0,
        get isExpanded(): boolean {
          return !tree.#searchCollapsed().has(item.id);
        },
        isLoading: false,
        loadError: undefined,
      };
      node.children = this.#buildSearchNodes(search, children, level + 1, node);
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

  async #expandNode(node: SdTreeNode<T>): Promise<boolean> {
    if (!node.hasChildren) return false;
    await this.#ensureLazyChildren(node);
    const next = this.#findNode(node.id);
    if (!next || !next.hasChildren || next.loadError) return false;
    if (next.isExpanded) return true;

    this.#setExpanded(next.id, true);
    const toggleEvent = { item: next.data, expanded: true, node: { ...next, isExpanded: true } };
    this.option()?.onExpand?.(toggleEvent);
    this.expandChange.emit(toggleEvent);
    return true;
  }

  #collapseNode(node: SdTreeNode<T>): void {
    this.#setExpanded(node.id, false);
    const toggleEvent = { item: node.data, expanded: false, node: { ...node, isExpanded: false } };
    this.option()?.onCollapse?.(toggleEvent);
    this.collapseChange.emit(toggleEvent);
  }

  #setExpanded(id: string, expanded: boolean): void {
    if (this.#search()) {
      this.#searchCollapsed.update(collapsed => {
        const next = new Set(collapsed);
        if (expanded) next.delete(id);
        else next.add(id);
        return next;
      });
      return;
    }
    const controlled = this.expandedIds();
    if (controlled === undefined) {
      this.#expandedState.update(state => ({ ...state, [id]: expanded }));
      return;
    }
    const rest = controlled.filter(value => value !== id);
    this.expandedIds.set(expanded ? [...rest, id] : rest);
  }

  /** Id các nút cha của một nút ĐÃ có trong cây (từ gốc tới cha trực tiếp); `undefined` khi nút chưa có. */
  #ancestorIds(id: string): string[] | undefined {
    const node = this.#findNode(id);
    if (!node) return undefined;
    const path: string[] = [];
    for (let current = node.parent; current; current = current.parent) path.unshift(current.id);
    return path;
  }

  #rowElement(id: string): HTMLElement | undefined {
    const rows = this.#host.nativeElement.querySelectorAll<HTMLElement>('[role="treeitem"]');
    return Array.from(rows).find(row => row.getAttribute('data-tree-node') === id);
  }

  /**
   * Các nút cha vừa mở chưa chắc đã có trong DOM ở lần render đầu (cây con lazy, view chưa refresh), nên thử lại
   * vài lần render rồi thôi.
   */
  #scrollWhenRendered(id: string, attempt = 0): void {
    afterNextRender(
      () => {
        if (this.#pendingScrollId !== id) return;
        const row = this.#rowElement(id);
        if (row) {
          this.#pendingScrollId = null;
          this.#scrollToRow(row);
        } else if (attempt < 5 && this.visibleNodes().some(node => node.id === id)) {
          this.#scrollWhenRendered(id, attempt + 1);
        } else {
          this.#pendingScrollId = null;
        }
      },
      { injector: this.#injector }
    );
  }

  /** Cuộn bằng `scrollTop` của vùng cuộn gần nhất: `scrollIntoView` sẽ cuộn luôn cả trang. */
  #scrollToRow(row: HTMLElement): void {
    const scroller = scrollParent(this.#host.nativeElement);
    if (!scroller) return;
    const box = scroller.getBoundingClientRect();
    const rect = row.getBoundingClientRect();
    if (rect.top < box.top) scroller.scrollTop -= box.top - rect.top;
    else if (rect.bottom > box.bottom) scroller.scrollTop += rect.bottom - box.bottom;
  }

  #ensureLazyChildren(node: SdTreeNode<T>, force = false): Promise<void> {
    if (this.resolvedTree().loadType !== 'lazy') return Promise.resolve();
    if (!force && (node.children.length > 0 || this.#lazyChildren()[node.id])) return Promise.resolve();
    const running = this.#lazyLoads.get(node.id);
    if (running && !force) return running;

    const load = this.#loadLazyChildren(node).finally(() => {
      if (this.#lazyLoads.get(node.id) === load) this.#lazyLoads.delete(node.id);
    });
    this.#lazyLoads.set(node.id, load);
    return load;
  }

  async #loadLazyChildren(node: SdTreeNode<T>): Promise<void> {
    const option = this.resolvedTree();
    if (option.loadType !== 'lazy') return;

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

function formatCount(value: number | null | undefined, format: Intl.NumberFormat): string | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
  return format.format(Math.floor(value));
}

function mergeSearchPaths<T>(text: string, results: readonly { path: readonly SdTreeItemLazy<T>[] }[]): SdTreeSearchResult<T> {
  const search: SdTreeSearchResult<T> = { text, roots: [], children: new Map(), matched: new Set() };
  const seen = new Set<string>();
  for (const { path } of results) {
    path.forEach((item, index) => {
      if (index === path.length - 1) search.matched.add(item.id);
      if (seen.has(item.id)) return;
      seen.add(item.id);
      if (index === 0) {
        search.roots.push(item);
        return;
      }
      const parentId = path[index - 1].id;
      const siblings = search.children.get(parentId);
      if (siblings) siblings.push(item);
      else search.children.set(parentId, [item]);
    });
  }
  return search;
}

function scrollParent(element: HTMLElement): HTMLElement | null {
  for (let current = element.parentElement; current; current = current.parentElement) {
    const overflow = getComputedStyle(current).overflowY;
    if (overflow === 'auto' || overflow === 'scroll') return current;
  }
  return null;
}

function sanitizeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-');
}

function isPromiseLike<T>(value: T[] | Promise<T[]>): value is Promise<T[]> {
  return !!value && typeof (value as Promise<T[]>).then === 'function';
}
