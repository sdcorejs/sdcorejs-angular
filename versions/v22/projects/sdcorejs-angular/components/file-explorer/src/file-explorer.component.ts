import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  NgZone,
  Signal,
  WritableSignal,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { SdBreadcrumb, SdBreadcrumbItem } from '@sdcorejs/angular/components/breadcrumb';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdFileExplorerFolderTree } from './components/folder-tree.component';
import { SdFileExplorerItemList } from './components/item-list.component';
import { SdFileExplorerPreviewPanel } from './components/preview-panel.component';
import { SdFileExplorerTransferPanel } from './components/transfer-panel.component';
import type {
  SdFileExplorerItem,
  SdFileExplorerOpenEvent,
  SdFileExplorerOption,
  SdFileExplorerProgressReporter,
  SdFileExplorerTransfer,
  SdFileExplorerTransferArgs,
  SdFileExplorerTransferDirection,
  SdFileExplorerTransferStatus,
  SdFileExplorerView,
} from './file-explorer.model';
import {
  sdFileExplorerErrorMessage,
  sdFileExplorerFileType,
  sdFileExplorerFormatDate,
  sdFileExplorerFormatDateTime,
  sdFileExplorerFormatSize,
  sdFileExplorerIconName,
  sdFileExplorerLocale,
  sdFileExplorerNormalize,
  sdFileExplorerPreviewKind,
  sdFileExplorerFoldersFirst,
  sdFileExplorerSafeId,
} from './file-explorer.utils';
import type {
  SdFileExplorerContentState,
  SdFileExplorerItemView,
  SdFileExplorerMetaRow,
  SdFileExplorerPreviewState,
  SdFileExplorerShareFeedback,
  SdFileExplorerShareState,
  SdFileExplorerTransferView,
  SdFileExplorerTreeNode,
} from './file-explorer.view-model';

/** Delay between the last keystroke and the `search` callback. */
const SEARCH_DEBOUNCE_MS = 300;
/** Uploads running at the same time; extra files wait as `queued`. */
const MAX_PARALLEL_UPLOADS = 3;
/** Below this host width the explorer switches to the compact (mobile) layout. */
const COMPACT_MAX_WIDTH = 720;
/** How long a saved download's object URL stays alive before it is revoked. */
const DOWNLOAD_URL_TTL_MS = 40_000;

const ACTIVE_STATUSES: ReadonlySet<SdFileExplorerTransferStatus> = new Set(['queued', 'preparing', 'transferring']);
const FINISHED_STATUSES: ReadonlySet<SdFileExplorerTransferStatus> = new Set(['done', 'error', 'cancelled']);

interface FolderState {
  readonly status: 'loading' | 'loaded' | 'error';
  readonly items: readonly SdFileExplorerItem[];
  /** The folder has been listed successfully at least once (a reload keeps showing the old items). */
  readonly loaded: boolean;
  readonly error?: unknown;
}

interface SearchState {
  readonly keyword: string;
  readonly parentId: string | null;
  readonly status: 'loading' | 'loaded' | 'error';
  readonly items: readonly SdFileExplorerItem[];
  readonly error?: unknown;
}

interface TransferAttempt {
  readonly controller: AbortController;
  /** Holds one of the `MAX_PARALLEL_UPLOADS` slots until released. */
  holdsSlot: boolean;
}

interface TransferJob {
  readonly id: string;
  readonly direction: SdFileExplorerTransferDirection;
  readonly name: string;
  readonly parentId: string | null;
  readonly run: (args: SdFileExplorerTransferArgs) => unknown;
  attempt: TransferAttempt | null;
}

let nextExplorerId = 0;

/**
 * Google-Drive-like file browser: folder tree, breadcrumb, list / grid, search, file detail drawer, uploads with
 * drag-and-drop, downloads and a transfer queue — all inside one element.
 *
 * Storage-agnostic: every read and write goes through the callbacks of `SdFileExplorerOption`.
 *
 * @example
 * ```html
 * <sd-file-explorer [option]="option" (open)="onOpen($event)" />
 * ```
 */
@Component({
  selector: 'sd-file-explorer',
  standalone: true,
  imports: [
    SdIcon,
    SdTranslatePipe,
    SdBreadcrumb,
    SdButton,
    SdDataState,
    SdFileExplorerFolderTree,
    SdFileExplorerItemList,
    SdFileExplorerPreviewPanel,
    SdFileExplorerTransferPanel,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer',
    '[class.sd-file-explorer--compact]': 'compact()',
    '[class.sd-file-explorer--dragging]': 'dragActive()',
    '[attr.data-autoid]': 'autoId()',
    '(dragenter)': 'onDragEnter($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave()',
    '(drop)': 'onDrop($event)',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class SdFileExplorer {
  readonly #i18n = inject(I18nService);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  readonly #zone = inject(NgZone);

  /** Data callbacks and display settings. See `SdFileExplorerOption`. */
  readonly option = input.required<SdFileExplorerOption>();
  /**
   * Emitted exactly once each time the user opens a file (click, `Enter` or `Space` on a file in the list,
   * grid or search results), right before the detail drawer starts loading. Never emitted for folders.
   */
  readonly open = output<SdFileExplorerOpenEvent>();

  // ---- State ----
  readonly #folders = signal<ReadonlyMap<string | null, FolderState>>(new Map());
  readonly #currentId = signal<string | null>(null);
  readonly #path = signal<readonly SdFileExplorerItem[]>([]);
  readonly #expanded = signal<ReadonlySet<string>>(new Set());
  readonly #search = signal<SearchState | null>(null);
  readonly #previewItem = signal<SdFileExplorerItem | null>(null);
  readonly #transfers = signal<readonly SdFileExplorerTransfer[]>([]);
  readonly #width = signal(0);

  protected readonly view = signal<SdFileExplorerView>('list');
  protected readonly keyword = signal('');
  protected readonly previewState = signal<SdFileExplorerPreviewState>({ status: 'idle' });
  protected readonly transfersCollapsed = signal(false);
  protected readonly sidebarOpen = signal(false);
  protected readonly dragActive = signal(false);
  protected readonly folderDialogOpen = signal(false);
  protected readonly folderName = signal('');
  protected readonly folderSubmitting = signal(false);
  protected readonly folderError = signal('');
  /** File whose share dialog is open. */
  protected readonly shareItem = signal<SdFileExplorerItem | null>(null);
  protected readonly shareState = signal<SdFileExplorerShareState>({ status: 'loading' });
  /** Result of the last copy attempt: copied to the clipboard, or selected for a manual Ctrl+C. */
  // why: kiểu khai báo tường minh bằng alias — union tự suy ra được in vào d.ts theo thứ tự nội bộ của TypeScript,
  // thứ tự này đổi theo máy build (v22/TS 6 in khác nhau giữa checkout LF và CRLF) làm lệch snapshot release.
  protected readonly shareFeedback: WritableSignal<SdFileExplorerShareFeedback> = signal<SdFileExplorerShareFeedback>('');

  /**
   * Uploads and downloads started in this explorer, oldest first. Read-only; use it for example to warn
   * before leaving the page while `status` is `queued`, `preparing` or `transferring`.
   */
  readonly transfers = this.#transfers.asReadonly();

  protected readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  protected readonly folderInput = viewChild<ElementRef<HTMLInputElement>>('folderInput');
  // why: đọc ElementRef của host <sd-button> — focus phải đặt vào <button> bên trong, không phải host.
  protected readonly newFolderButton = viewChild<ElementRef<HTMLElement>, ElementRef<HTMLElement>>('newFolderButton', { read: ElementRef });
  protected readonly copyButton = viewChild<ElementRef<HTMLElement>, ElementRef<HTMLElement>>('copyButton', { read: ElementRef });
  protected readonly shareInput = viewChild<ElementRef<HTMLInputElement>>('shareInput');
  protected readonly shareDialog = viewChild<ElementRef<HTMLElement>>('shareDialog');
  protected readonly sidebar = viewChild<ElementRef<HTMLElement>>('sidebar');

  // ---- Non-reactive bookkeeping ----
  readonly #listControllers = new Map<string | null, AbortController>();
  readonly #jobs = new Map<string, TransferJob>();
  readonly #uploadQueue: string[] = [];
  readonly #downloadUrls = new Map<string, ReturnType<typeof setTimeout>>();
  #activeUploads = 0;
  #transferSeq = 0;
  #searchTimer: ReturnType<typeof setTimeout> | null = null;
  #searchController: AbortController | null = null;
  #previewController: AbortController | null = null;
  #previewObjectUrl: string | null = null;
  #shareController: AbortController | null = null;
  #shareReturnFocus: HTMLElement | null = null;
  #dragDepth = 0;
  #listFn: SdFileExplorerOption['list'] | null = null;
  #resizeObserver: ResizeObserver | null = null;
  #destroyed = false;

  protected readonly instanceId = `sd-file-explorer-${nextExplorerId++}`;

  // ---- Derived ----
  protected readonly compact = computed(() => {
    const width = this.#width();
    return width > 0 && width < COMPACT_MAX_WIDTH;
  });

  readonly autoId = computed(() => {
    const scope = this.option().autoId;
    return scope ? `components-file-explorer-${scope}` : undefined;
  });

  protected readonly locale = computed(() => sdFileExplorerLocale(this.#i18n.language()));
  protected readonly rootLabel = computed(() => this.option().rootLabel || this.#i18n.t('core.component.file-explorer.root'));
  protected readonly canUpload = computed(() => typeof this.option().upload === 'function');
  protected readonly canDownload = computed(() => typeof this.option().download === 'function');
  protected readonly canCreateFolder = computed(() => typeof this.option().createFolder === 'function');
  protected readonly canShare = computed(() => typeof this.option().share === 'function');
  readonly #serverSearch = computed(() => typeof this.option().search === 'function');

  protected readonly currentName = computed(() => {
    const path = this.#path();
    return path.length ? path[path.length - 1].name : this.rootLabel();
  });

  readonly #itemById = computed(() => {
    const map = new Map<string, SdFileExplorerItem>();
    for (const state of this.#folders().values()) {
      for (const item of state.items) map.set(item.id, item);
    }
    for (const folder of this.#path()) if (!map.has(folder.id)) map.set(folder.id, folder);
    return map;
  });

  readonly #currentFolder = computed(() => this.#folders().get(this.#currentId()));
  readonly #trimmedKeyword = computed(() => this.keyword().trim());
  protected readonly searching = computed(() => this.#trimmedKeyword().length > 0);

  readonly #visibleItems = computed<readonly SdFileExplorerItem[]>(() => {
    const keyword = this.#trimmedKeyword();
    const items = this.#currentFolder()?.items ?? [];
    if (!keyword) return items;
    if (this.#serverSearch()) {
      const search = this.#search();
      return search && search.keyword === keyword && search.status === 'loaded' ? search.items : [];
    }
    const needle = sdFileExplorerNormalize(keyword);
    return items.filter(item => sdFileExplorerNormalize(item.name).includes(needle));
  });

  protected readonly itemViews = computed<readonly SdFileExplorerItemView[]>(() => {
    const format = this.#itemFormatter();
    return sdFileExplorerFoldersFirst(this.#visibleItems()).map(format);
  });

  // why: như shareFeedback — kiểu tường minh để d.ts ổn định giữa các máy build.
  protected readonly contentState: Signal<SdFileExplorerContentState> = computed<SdFileExplorerContentState>(() => {
    const keyword = this.#trimmedKeyword();
    if (keyword && this.#serverSearch()) {
      const search = this.#search();
      if (!search || search.keyword !== keyword || search.status === 'loading') return 'loading';
      if (search.status === 'error') return 'error';
      return search.items.length ? 'items' : 'empty';
    }
    const folder = this.#currentFolder();
    if (!folder || (folder.status === 'loading' && !folder.loaded)) return 'loading';
    if (folder.status === 'error') return 'error';
    return this.#visibleItems().length ? 'items' : 'empty';
  });

  protected readonly refreshing = computed(() => {
    const folder = this.#currentFolder();
    return !!folder && folder.status === 'loading' && folder.loaded && !this.searching();
  });

  protected readonly errorMessage = computed(() => {
    const error = this.searching() && this.#serverSearch() ? this.#search()?.error : this.#currentFolder()?.error;
    return sdFileExplorerErrorMessage(error);
  });

  protected readonly heading = computed(() =>
    this.searching() ? this.#i18n.t('core.component.file-explorer.search-results') : this.currentName()
  );

  protected readonly itemCountLabel = computed(() =>
    this.#i18n.t('core.component.file-explorer.item-count', { count: this.#visibleItems().length })
  );

  protected readonly emptyTitle = computed(() =>
    this.searching()
      ? this.#i18n.t('core.component.file-explorer.search-empty', { keyword: this.#trimmedKeyword() })
      : this.#i18n.t('core.component.file-explorer.empty')
  );

  protected readonly emptyMessage = computed(() =>
    !this.searching() && this.canUpload() ? this.#i18n.t('core.component.file-explorer.empty-upload-hint') : ''
  );

  protected readonly dropTitle = computed(() => this.#i18n.t('core.component.file-explorer.drop-title', { folder: this.currentName() }));
  protected readonly shareTitle = computed(() =>
    this.#i18n.t('core.component.file-explorer.share.title', { name: this.shareItem()?.name ?? '' })
  );

  protected readonly shareFeedbackLabel = computed(() => {
    const feedback = this.shareFeedback();
    if (feedback === 'copied') return this.#i18n.t('core.component.file-explorer.share.copied');
    if (feedback === 'manual') return this.#i18n.t('core.component.file-explorer.share.copy-manual');
    return '';
  });

  protected readonly folderDialogTitle = computed(() =>
    this.#i18n.t('core.component.file-explorer.new-folder-title', { folder: this.currentName() })
  );

  /** Breadcrumb trail plus the folder each entry navigates to. */
  protected readonly breadcrumb = computed(() => {
    const targets = new Map<SdBreadcrumbItem, SdFileExplorerItem | null>();
    const items: SdBreadcrumbItem[] = [];
    const root: SdBreadcrumbItem = { label: this.rootLabel(), clickable: true };
    targets.set(root, null);
    items.push(root);
    for (const folder of this.#path()) {
      const entry: SdBreadcrumbItem = { label: folder.name, clickable: true };
      targets.set(entry, folder);
      items.push(entry);
    }
    return { items, targets };
  });

  protected readonly treeNodes = computed<readonly SdFileExplorerTreeNode[]>(() => {
    const folders = this.#folders();
    const expanded = this.#expanded();
    const current = this.#currentId();
    const autoId = this.autoId();
    const rootState = folders.get(null);
    const nodes: SdFileExplorerTreeNode[] = [
      {
        key: 'root',
        id: null,
        item: null,
        name: this.rootLabel(),
        level: 1,
        expandable: false,
        expanded: true,
        status: rootState?.status === 'error' ? 'error' : rootState?.status === 'loading' && !rootState.loaded ? 'loading' : 'idle',
        selected: current === null,
        autoId: autoId ? `${autoId}-tree-root` : undefined,
      },
    ];
    const visit = (parentId: string | null, level: number, ancestors: ReadonlySet<string>): void => {
      const state = folders.get(parentId);
      if (!state) return;
      const children = state.items.filter(item => item.kind === 'folder');
      for (const folder of children) {
        // why: dữ liệu consumer có thể lỗi (thư mục là con của chính nó) — chặn vòng lặp vô hạn khi dựng cây.
        if (ancestors.has(folder.id)) continue;
        const childState = folders.get(folder.id);
        const isExpanded = expanded.has(folder.id);
        const hasSubfolders = childState?.loaded ? childState.items.some(item => item.kind === 'folder') : folder.hasChildren !== false;
        const open = isExpanded && hasSubfolders;
        let status: SdFileExplorerTreeNode['status'] = 'idle';
        if (isExpanded && childState?.status === 'error') status = 'error';
        else if (isExpanded && childState?.status === 'loading' && !childState.loaded) status = 'loading';
        nodes.push({
          key: `f:${folder.id}`,
          id: folder.id,
          item: folder,
          name: folder.name,
          level,
          expandable: hasSubfolders,
          expanded: open,
          status,
          selected: current === folder.id,
          autoId: autoId ? `${autoId}-tree-${sdFileExplorerSafeId(folder.id)}` : undefined,
        });
        if (open) visit(folder.id, level + 1, new Set([...ancestors, folder.id]));
      }
    };
    visit(null, 2, new Set());
    return nodes;
  });

  protected readonly previewView = computed<SdFileExplorerItemView | null>(() => {
    const item = this.#previewItem();
    return item ? this.#itemFormatter()(item) : null;
  });

  protected readonly previewMeta = computed<readonly SdFileExplorerMetaRow[]>(() => {
    const view = this.previewView();
    if (!view) return [];
    const t = (key: string) => this.#i18n.t(`core.component.file-explorer.meta.${key}`);
    const rows: SdFileExplorerMetaRow[] = [
      { label: t('name'), value: view.item.name },
      { label: t('type'), value: view.typeLabel },
    ];
    if (view.sizeLabel) rows.push({ label: t('size'), value: view.sizeLabel });
    if (view.modifiedLabel) rows.push({ label: t('modified'), value: view.modifiedLabel });
    return rows;
  });

  protected readonly transferViews = computed<readonly SdFileExplorerTransferView[]>(() => {
    const t = (key: string, params?: Record<string, string>) => this.#i18n.t(`core.component.file-explorer.${key}`, params);
    const autoId = this.autoId();
    return this.#transfers().map(transfer => {
      const known = transfer.percent !== undefined;
      let statusLabel: string;
      let progress: SdFileExplorerTransferView['progress'];
      let tone: SdFileExplorerTransferView['tone'];
      switch (transfer.status) {
        case 'queued':
          statusLabel = t('transfers.status.queued');
          progress = 'none';
          tone = 'muted';
          break;
        case 'preparing':
          statusLabel = t('transfers.status.preparing');
          progress = 'indeterminate';
          tone = 'active';
          break;
        case 'transferring':
          statusLabel = known
            ? `${transfer.percent}%`
            : t(transfer.direction === 'upload' ? 'transfers.status.uploading' : 'transfers.status.downloading');
          progress = known ? 'determinate' : 'indeterminate';
          tone = 'active';
          break;
        case 'done':
          statusLabel = t(transfer.handedOff ? 'transfers.status.handed-off' : 'transfers.status.done');
          progress = 'full';
          tone = 'success';
          break;
        case 'error':
          statusLabel = t('transfers.status.error');
          progress = known ? 'determinate' : 'full';
          tone = 'error';
          break;
        default:
          statusLabel = t('transfers.status.cancelled');
          progress = known ? 'determinate' : 'none';
          tone = 'muted';
      }
      const name = transfer.name;
      return {
        transfer,
        statusLabel,
        progress,
        percent: transfer.percent ?? 0,
        tone,
        canCancel: ACTIVE_STATUSES.has(transfer.status),
        canRetry: transfer.status === 'error' || transfer.status === 'cancelled',
        canDismiss: FINISHED_STATUSES.has(transfer.status),
        cancelLabel: t('transfers.cancel', { name }),
        retryLabel: t('transfers.retry', { name }),
        dismissLabel: t('transfers.dismiss', { name }),
        directionLabel: t(`transfers.direction.${transfer.direction}`),
        errorMessage: transfer.status === 'error' ? sdFileExplorerErrorMessage(transfer.error) : '',
        autoId: autoId ? `${autoId}-transfer-${transfer.id}` : undefined,
      };
    });
  });

  protected readonly transfersTitle = computed(() =>
    this.#i18n.t('core.component.file-explorer.transfers.title', { count: this.#transfers().length })
  );
  protected readonly canClearTransfers = computed(() => this.#transfers().some(transfer => FINISHED_STATUSES.has(transfer.status)));

  /** Formats items with the current language; rebuilt when the language changes. */
  readonly #itemFormatter = computed(() => {
    const locale = this.locale();
    const autoId = this.autoId();
    const t = (key: string, params?: Record<string, string>) => this.#i18n.t(`core.component.file-explorer.${key}`, params);
    const labels = { today: t('today'), yesterday: t('yesterday') };
    const now = new Date();
    return (item: SdFileExplorerItem): SdFileExplorerItemView => {
      const type = sdFileExplorerFileType(item);
      return {
        item,
        type,
        icon: sdFileExplorerIconName(item),
        typeLabel: t(`type.${type}`),
        sizeLabel: item.kind === 'file' ? sdFileExplorerFormatSize(item.size, locale) : '',
        modifiedLabel: sdFileExplorerFormatDate(item.modifiedAt, now, locale, labels),
        modifiedTitle: sdFileExplorerFormatDateTime(item.modifiedAt, locale),
        downloadLabel: t('download-item', { name: item.name }),
        shareLabel: t('share-item', { name: item.name }),
        autoId: autoId ? `${autoId}-item-${sdFileExplorerSafeId(item.id)}` : undefined,
      };
    };
  });

  constructor() {
    // why: chỉ reset khi hàm `list` đổi (đổi nguồn lưu trữ). Consumer tạo lại object option với cùng callback
    // (ví dụ đổi title) không được xoá cache/điều hướng của người dùng.
    effect(() => {
      const option = this.option();
      untracked(() => {
        if (this.#listFn === option.list) return;
        const firstRun = this.#listFn === null;
        this.#listFn = option.list;
        if (firstRun) this.view.set(option.defaultView ?? 'list');
        this.#resetNavigation();
        this.#ensureLoaded(null);
      });
    });

    afterNextRender(() => {
      const host = this.#host.nativeElement;
      this.#width.set(host.getBoundingClientRect().width);
      if (typeof ResizeObserver === 'undefined') return;
      this.#resizeObserver = new ResizeObserver(entries => {
        const width = entries[entries.length - 1]?.contentRect.width;
        if (typeof width === 'number') this.#width.set(width);
      });
      this.#resizeObserver.observe(host);
    });

    // why: rời khỏi layout compact thì drawer không còn ý nghĩa — đóng để lần thu nhỏ sau không bật lại scrim.
    effect(() => {
      if (!this.compact()) untracked(() => this.sidebarOpen.set(false));
    });

    inject(DestroyRef).onDestroy(() => this.#teardown());
  }

  // ---- Public API ----

  /**
   * Lists the current folder again and drops the cached children of folders that are neither open in the
   * tree nor on the current path. Re-runs the active search, if any.
   */
  reload(): void {
    const keep = new Set<string | null>([null, this.#currentId(), ...this.#expanded(), ...this.#path().map(folder => folder.id)]);
    const folders = new Map(this.#folders());
    for (const key of [...folders.keys()]) {
      if (!keep.has(key)) {
        this.#listControllers.get(key)?.abort();
        this.#listControllers.delete(key);
        folders.delete(key);
      }
    }
    this.#folders.set(folders);
    for (const key of folders.keys()) this.#load(key);
    this.#ensureLoaded(this.#currentId());
    if (this.searching()) this.#scheduleSearch(true);
  }

  // ---- Navigation ----

  protected navigate(folder: SdFileExplorerItem | null): void {
    const id = folder?.id ?? null;
    const path = folder ? this.#buildPath(folder) : [];
    this.#currentId.set(id);
    this.#path.set(path);
    this.#expanded.update(expanded => {
      const next = new Set(expanded);
      for (const entry of path) next.add(entry.id);
      return next;
    });
    this.#clearSearch();
    this.closePreview();
    if (this.compact()) this.sidebarOpen.set(false);
    this.#ensureLoaded(null);
    for (const entry of path) this.#ensureLoaded(entry.parentId);
    this.#ensureLoaded(id);
  }

  protected onBreadcrumb(entry: SdBreadcrumbItem): void {
    const { targets } = this.breadcrumb();
    if (targets.has(entry)) this.navigate(targets.get(entry) ?? null);
  }

  protected onTreeSelect(node: SdFileExplorerTreeNode): void {
    this.navigate(node.item);
  }

  protected onTreeToggle(node: SdFileExplorerTreeNode): void {
    if (node.id === null) return;
    const id = node.id;
    const expand = !this.#expanded().has(id);
    this.#expanded.update(expanded => {
      const next = new Set(expanded);
      if (expand) next.add(id);
      else next.delete(id);
      return next;
    });
    if (expand) this.#ensureLoaded(id);
  }

  protected onTreeRetry(node: SdFileExplorerTreeNode): void {
    this.#load(node.id);
  }

  protected retryContent(): void {
    if (this.searching() && this.#serverSearch()) this.#scheduleSearch(true);
    else this.#load(this.#currentId());
  }

  protected toggleSidebar(): void {
    const open = !this.sidebarOpen();
    this.sidebarOpen.set(open);
    if (open) {
      afterNextRender(() => this.sidebar()?.nativeElement.querySelector<HTMLElement>('[tabindex="0"]')?.focus(), {
        injector: this.#injector,
      });
    }
  }

  protected setView(view: SdFileExplorerView): void {
    this.view.set(view);
  }

  // ---- Items / preview ----

  protected onActivate(view: SdFileExplorerItemView): void {
    if (view.item.kind === 'folder') this.navigate(view.item);
    else this.openFile(view.item);
  }

  protected openFile(item: SdFileExplorerItem): void {
    this.open.emit({ item, path: this.#path() });
    this.#previewItem.set(item);
    void this.#loadPreview(item);
  }

  /**
   * Closes the detail drawer. Focus goes back to the row / card that opened it: `sd-side-drawer` restores the
   * previously focused element when its focus trap closes.
   */
  protected closePreview(): void {
    if (!this.#previewItem()) return;
    this.#releasePreview();
    this.#previewItem.set(null);
    this.previewState.set({ status: 'idle' });
  }

  protected retryPreview(): void {
    const item = this.#previewItem();
    if (item) void this.#loadPreview(item);
  }

  protected onPreviewImageError(): void {
    this.previewState.set({ status: 'error', message: '' });
  }

  protected downloadItem(item: SdFileExplorerItem): void {
    const download = this.option().download;
    if (!download) return;
    this.#enqueue('download', item.name, item.parentId, args => download({ item, ...args }));
    this.transfersCollapsed.set(false);
  }

  protected downloadPreview(): void {
    const item = this.#previewItem();
    if (item) this.downloadItem(item);
  }

  protected sharePreview(): void {
    const item = this.#previewItem();
    if (item) this.openShare(item);
  }

  // ---- Search ----

  protected onKeywordInput(value: string): void {
    this.keyword.set(value);
    this.#scheduleSearch(false);
  }

  protected clearSearch(): void {
    this.#clearSearch();
    this.searchInput()?.nativeElement.focus();
  }

  // ---- Upload ----

  protected onFilesPicked(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    // why: reset value để chọn lại đúng file đó lần nữa vẫn bắn sự kiện change.
    input.value = '';
    this.uploadFiles(files);
  }

  protected uploadFiles(files: readonly File[]): void {
    const upload = this.option().upload;
    if (!upload || files.length === 0) return;
    const parentId = this.#currentId();
    for (const file of files) {
      this.#enqueue('upload', file.name, parentId, args => upload({ file, parentId, ...args }));
    }
    this.transfersCollapsed.set(false);
  }

  protected onDragEnter(event: DragEvent): void {
    if (!this.#acceptsDrag(event)) return;
    event.preventDefault();
    this.#dragDepth++;
    this.dragActive.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    if (!this.#acceptsDrag(event)) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  protected onDragLeave(): void {
    if (!this.dragActive()) return;
    // why: dragenter/dragleave bắn cho từng phần tử con — đếm độ sâu để overlay không nhấp nháy khi rê qua con.
    this.#dragDepth = Math.max(0, this.#dragDepth - 1);
    if (this.#dragDepth === 0) this.dragActive.set(false);
  }

  protected onDrop(event: DragEvent): void {
    if (!this.#acceptsDrag(event)) return;
    event.preventDefault();
    this.#dragDepth = 0;
    this.dragActive.set(false);
    this.uploadFiles(this.#droppedFiles(event.dataTransfer));
  }

  // ---- Transfers ----

  protected cancelTransfer(id: string): void {
    const job = this.#jobs.get(id);
    const status = this.#statusOf(id);
    if (!job || !status || !ACTIVE_STATUSES.has(status)) return;
    if (status !== 'queued' && job.attempt) {
      job.attempt.controller.abort();
      this.#releaseSlot(job.attempt);
    }
    this.#patch(id, { status: 'cancelled' });
  }

  protected retryTransfer(id: string): void {
    const job = this.#jobs.get(id);
    const status = this.#statusOf(id);
    if (!job || (status !== 'error' && status !== 'cancelled')) return;
    this.#patch(id, { status: 'queued', loaded: undefined, total: undefined, percent: undefined, error: undefined, handedOff: undefined });
    this.#schedule(job);
  }

  protected dismissTransfer(id: string): void {
    const status = this.#statusOf(id);
    if (!status || !FINISHED_STATUSES.has(status)) return;
    this.#jobs.delete(id);
    this.#transfers.update(list => list.filter(transfer => transfer.id !== id));
  }

  protected clearFinishedTransfers(): void {
    const finished = new Set(
      this.#transfers()
        .filter(transfer => FINISHED_STATUSES.has(transfer.status))
        .map(transfer => transfer.id)
    );
    for (const id of finished) this.#jobs.delete(id);
    this.#transfers.update(list => list.filter(transfer => !finished.has(transfer.id)));
  }

  // ---- New folder ----

  protected openFolderDialog(): void {
    this.folderName.set('');
    this.folderError.set('');
    this.folderDialogOpen.set(true);
    afterNextRender(() => this.folderInput()?.nativeElement.focus(), { injector: this.#injector });
  }

  protected closeFolderDialog(): void {
    if (!this.folderDialogOpen()) return;
    this.folderDialogOpen.set(false);
    afterNextRender(() => this.newFolderButton()?.nativeElement.querySelector('button')?.focus(), { injector: this.#injector });
  }

  // ---- Share ----

  protected openShare(item: SdFileExplorerItem): void {
    if (!this.option().share) return;
    const active = this.#document.activeElement;
    this.#shareReturnFocus = active instanceof HTMLElement && this.#host.nativeElement.contains(active) ? active : null;
    this.shareItem.set(item);
    void this.#loadShareLink(item);
    // why: trong lúc tạo link, focus vào chính dialog để trình đọc màn hình đọc tiêu đề; link xong thì chuyển sang nút Sao chép.
    afterNextRender(
      () => {
        if (this.shareState().status !== 'ready') this.shareDialog()?.nativeElement.focus();
      },
      { injector: this.#injector }
    );
  }

  protected retryShare(): void {
    const item = this.shareItem();
    if (item) void this.#loadShareLink(item);
  }

  protected closeShare(): void {
    if (!this.shareItem()) return;
    this.#shareController?.abort();
    this.#shareController = null;
    this.shareItem.set(null);
    this.shareFeedback.set('');
    const target = this.#shareReturnFocus;
    this.#shareReturnFocus = null;
    if (target?.isConnected) afterNextRender(() => target.focus({ preventScroll: true }), { injector: this.#injector });
  }

  protected async copyShareLink(): Promise<void> {
    const state = this.shareState();
    if (state.status !== 'ready') return;
    const clipboard = this.#document.defaultView?.navigator?.clipboard;
    try {
      if (typeof clipboard?.writeText !== 'function') throw new Error('Clipboard API unavailable');
      await clipboard.writeText(state.url);
      this.shareFeedback.set('copied');
    } catch {
      // why: Clipboard API bị chặn (không phải secure context, thiếu quyền, iframe) → chọn sẵn link rồi thử
      // execCommand; nếu vẫn không được thì hướng dẫn người dùng tự bấm Ctrl+C.
      const input = this.shareInput()?.nativeElement;
      input?.focus();
      input?.select();
      this.shareFeedback.set(this.#execCopy() ? 'copied' : 'manual');
    }
  }

  async #loadShareLink(item: SdFileExplorerItem): Promise<void> {
    const share = this.option().share;
    if (!share) return;
    this.#shareController?.abort();
    const controller = new AbortController();
    this.#shareController = controller;
    this.shareFeedback.set('');
    this.shareState.set({ status: 'loading' });
    const fallbackError = () => this.#i18n.t('core.component.file-explorer.share.error');
    try {
      const url = await share({ item, signal: controller.signal });
      if (controller.signal.aborted || this.#destroyed) return;
      if (typeof url !== 'string' || !url.trim()) {
        this.shareState.set({ status: 'error', message: fallbackError() });
        return;
      }
      this.shareState.set({ status: 'ready', url: url.trim() });
      afterNextRender(() => this.copyButton()?.nativeElement.querySelector('button')?.focus(), { injector: this.#injector });
    } catch (error) {
      if (controller.signal.aborted || this.#destroyed) return;
      this.shareState.set({ status: 'error', message: sdFileExplorerErrorMessage(error) || fallbackError() });
    } finally {
      if (this.#shareController === controller) this.#shareController = null;
    }
  }

  #execCopy(): boolean {
    try {
      return this.#document.execCommand('copy');
    } catch {
      return false;
    }
  }

  protected async submitFolder(event: Event): Promise<void> {
    event.preventDefault();
    const create = this.option().createFolder;
    const name = this.folderName().trim();
    if (!create || !name || this.folderSubmitting()) return;
    const parentId = this.#currentId();
    this.folderSubmitting.set(true);
    this.folderError.set('');
    try {
      await create({ parentId, name });
      if (this.#destroyed) return;
      this.closeFolderDialog();
      if (parentId !== null) this.#expanded.update(expanded => new Set([...expanded, parentId]));
      this.#refresh(parentId);
    } catch (error) {
      if (this.#destroyed) return;
      this.folderError.set(sdFileExplorerErrorMessage(error) || this.#i18n.t('core.component.file-explorer.create-folder-error'));
    } finally {
      this.folderSubmitting.set(false);
    }
  }

  // ---- Keyboard ----

  protected onEscape(event: Event): void {
    if (event.defaultPrevented) return;
    if (this.folderDialogOpen()) this.closeFolderDialog();
    else if (this.shareItem()) this.closeShare();
    // why: header vẫn dùng được khi drawer chi tiết mở — Esc trong ô tìm kiếm xoá từ khoá trước, chưa đóng drawer.
    else if (this.keyword() && event.target === this.searchInput()?.nativeElement) this.clearSearch();
    else if (this.#previewItem()) this.closePreview();
    else if (this.sidebarOpen()) this.sidebarOpen.set(false);
    else if (this.keyword()) this.clearSearch();
    else return;
    event.preventDefault();
  }

  // ---- Internals: folders ----

  #resetNavigation(): void {
    for (const controller of this.#listControllers.values()) controller.abort();
    this.#listControllers.clear();
    this.#folders.set(new Map());
    this.#currentId.set(null);
    this.#path.set([]);
    this.#expanded.set(new Set());
    this.#clearSearch();
    this.closePreview();
  }

  #ensureLoaded(parentId: string | null): void {
    const state = this.#folders().get(parentId);
    if (state && state.status !== 'error') return;
    void this.#load(parentId);
  }

  /** Re-lists a folder only if it is cached (someone has seen it); otherwise the next visit lists it anyway. */
  #refresh(parentId: string | null): void {
    if (this.#folders().has(parentId)) void this.#load(parentId);
  }

  async #load(parentId: string | null): Promise<void> {
    this.#listControllers.get(parentId)?.abort();
    const controller = new AbortController();
    this.#listControllers.set(parentId, controller);
    const previous = this.#folders().get(parentId);
    this.#setFolder(parentId, { status: 'loading', items: previous?.loaded ? previous.items : [], loaded: !!previous?.loaded });
    try {
      const items = await this.option().list({ parentId, signal: controller.signal });
      if (controller.signal.aborted || this.#destroyed) return;
      this.#setFolder(parentId, { status: 'loaded', items: Array.isArray(items) ? items : [], loaded: true });
    } catch (error) {
      if (controller.signal.aborted || this.#destroyed) return;
      this.#setFolder(parentId, { status: 'error', items: [], loaded: false, error });
    } finally {
      if (this.#listControllers.get(parentId) === controller) this.#listControllers.delete(parentId);
    }
  }

  #setFolder(parentId: string | null, state: FolderState): void {
    this.#folders.update(folders => new Map(folders).set(parentId, state));
  }

  #buildPath(folder: SdFileExplorerItem): SdFileExplorerItem[] {
    const byId = this.#itemById();
    const chain: SdFileExplorerItem[] = [folder];
    const seen = new Set([folder.id]);
    let parentId = folder.parentId;
    while (parentId !== null) {
      const parent = byId.get(parentId);
      if (!parent || seen.has(parent.id)) {
        // why: chuỗi cha bị đứt (kết quả search nằm sâu, cha chưa từng được list) — nối vào đường dẫn hiện tại
        // để breadcrumb vẫn quay về được thư mục đang xem.
        const current = this.#path().filter(entry => !seen.has(entry.id));
        return [...current, folder];
      }
      chain.push(parent);
      seen.add(parent.id);
      parentId = parent.parentId;
    }
    return chain.reverse();
  }

  // ---- Internals: search ----

  #scheduleSearch(immediate: boolean): void {
    if (this.#searchTimer) clearTimeout(this.#searchTimer);
    this.#searchTimer = null;
    this.#searchController?.abort();
    this.#searchController = null;
    const keyword = this.#trimmedKeyword();
    const search = this.option().search;
    if (!keyword || !search) {
      this.#search.set(null);
      return;
    }
    const parentId = this.#currentId();
    this.#search.set({ keyword, parentId, status: 'loading', items: [] });
    if (immediate) void this.#runSearch(keyword, parentId);
    else this.#searchTimer = setTimeout(() => void this.#runSearch(keyword, parentId), SEARCH_DEBOUNCE_MS);
  }

  async #runSearch(keyword: string, parentId: string | null): Promise<void> {
    this.#searchTimer = null;
    const search = this.option().search;
    if (!search) return;
    const controller = new AbortController();
    this.#searchController = controller;
    try {
      const items = await search({ parentId, keyword, signal: controller.signal });
      if (controller.signal.aborted || this.#destroyed) return;
      this.#search.set({ keyword, parentId, status: 'loaded', items: Array.isArray(items) ? items : [] });
    } catch (error) {
      if (controller.signal.aborted || this.#destroyed) return;
      this.#search.set({ keyword, parentId, status: 'error', items: [], error });
    } finally {
      if (this.#searchController === controller) this.#searchController = null;
    }
  }

  #clearSearch(): void {
    this.keyword.set('');
    this.#scheduleSearch(false);
  }

  // ---- Internals: preview ----

  async #loadPreview(item: SdFileExplorerItem): Promise<void> {
    this.#releasePreview();
    const kind = sdFileExplorerPreviewKind(sdFileExplorerFileType(item));
    const fallback = (): SdFileExplorerPreviewState =>
      kind === 'image' && item.thumbnailUrl ? { status: 'image', url: item.thumbnailUrl } : { status: 'unavailable' };
    const preview = this.option().preview;
    // why: định dạng không có renderer thì KHÔNG gọi callback — tránh tải cả file chỉ để hiện fallback.
    if (kind === 'none' || !preview) {
      this.previewState.set(kind === 'none' ? { status: 'unavailable' } : fallback());
      return;
    }
    const controller = new AbortController();
    this.#previewController = controller;
    this.previewState.set({ status: 'loading' });
    try {
      const source = await preview({ item, signal: controller.signal });
      if (controller.signal.aborted || this.#destroyed) return;
      if (source === null || source === undefined || source === '') {
        this.previewState.set(fallback());
      } else if (kind === 'pdf') {
        this.previewState.set({ status: 'pdf', source });
      } else if (typeof source === 'string') {
        this.previewState.set({ status: 'image', url: source });
      } else {
        const url = this.#createObjectUrl(source);
        this.#previewObjectUrl = url;
        this.previewState.set(url ? { status: 'image', url } : { status: 'unavailable' });
      }
    } catch (error) {
      if (controller.signal.aborted || this.#destroyed) return;
      this.previewState.set({ status: 'error', message: sdFileExplorerErrorMessage(error) });
    } finally {
      if (this.#previewController === controller) this.#previewController = null;
    }
  }

  #releasePreview(): void {
    this.#previewController?.abort();
    this.#previewController = null;
    if (this.#previewObjectUrl) this.#revokeObjectUrl(this.#previewObjectUrl);
    this.#previewObjectUrl = null;
  }

  // ---- Internals: transfers ----

  #enqueue(
    direction: SdFileExplorerTransferDirection,
    name: string,
    parentId: string | null,
    run: (args: SdFileExplorerTransferArgs) => unknown
  ): void {
    const id = `t${++this.#transferSeq}`;
    const job: TransferJob = { id, direction, name, parentId, run, attempt: null };
    this.#jobs.set(id, job);
    this.#transfers.update(list => [...list, { id, direction, name, status: 'queued' }]);
    this.#schedule(job);
  }

  #schedule(job: TransferJob): void {
    if (job.direction === 'upload') {
      this.#uploadQueue.push(job.id);
      this.#pumpUploads();
    } else {
      void this.#start(job, false);
    }
  }

  #pumpUploads(): void {
    while (this.#activeUploads < MAX_PARALLEL_UPLOADS && this.#uploadQueue.length > 0) {
      const job = this.#jobs.get(this.#uploadQueue.shift() as string);
      if (!job || this.#statusOf(job.id) !== 'queued') continue;
      this.#activeUploads++;
      void this.#start(job, true);
    }
  }

  #releaseSlot(attempt: TransferAttempt): void {
    if (!attempt.holdsSlot) return;
    attempt.holdsSlot = false;
    this.#activeUploads = Math.max(0, this.#activeUploads - 1);
    if (!this.#destroyed) this.#pumpUploads();
  }

  async #start(job: TransferJob, holdsSlot: boolean): Promise<void> {
    const attempt: TransferAttempt = { controller: new AbortController(), holdsSlot };
    job.attempt = attempt;
    const { signal } = attempt.controller;
    const current = () => job.attempt === attempt && !signal.aborted && !this.#destroyed;
    this.#patch(job.id, { status: 'preparing' });
    const progress: SdFileExplorerProgressReporter = (loaded, total) => {
      if (!current()) return;
      const safeLoaded = Number.isFinite(loaded) && loaded > 0 ? loaded : 0;
      const safeTotal = typeof total === 'number' && Number.isFinite(total) && total > 0 ? total : undefined;
      const percent = safeTotal ? Math.min(100, Math.round((safeLoaded / safeTotal) * 100)) : undefined;
      this.#patch(job.id, { status: 'transferring', loaded: safeLoaded, total: safeTotal, percent });
    };
    try {
      const result = await job.run({ progress, signal });
      if (!current()) return;
      const known = this.#transfers().find(transfer => transfer.id === job.id)?.total !== undefined;
      if (job.direction === 'download') {
        const blob = this.#isBlob(result) ? result : null;
        if (blob) this.#saveBlob(blob, job.name);
        this.#patch(job.id, { status: 'done', handedOff: !blob, percent: known ? 100 : undefined });
      } else {
        this.#patch(job.id, { status: 'done', percent: known ? 100 : undefined });
        this.#refresh(job.parentId);
      }
    } catch (error) {
      if (!current()) return;
      this.#patch(job.id, { status: 'error', error });
    } finally {
      this.#releaseSlot(attempt);
    }
  }

  #statusOf(id: string): SdFileExplorerTransferStatus | undefined {
    return this.#transfers().find(transfer => transfer.id === id)?.status;
  }

  #patch(id: string, changes: Partial<Omit<SdFileExplorerTransfer, 'id' | 'direction' | 'name'>>): void {
    this.#transfers.update(list => list.map(transfer => (transfer.id === id ? { ...transfer, ...changes } : transfer)));
  }

  #saveBlob(blob: Blob, name: string): void {
    const url = this.#createObjectUrl(blob);
    const body = this.#document.body;
    if (!url || !body) return;
    const anchor = this.#document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    anchor.rel = 'noopener';
    anchor.hidden = true;
    body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // why: thu hồi URL ngay sau click có thể cắt ngang việc trình duyệt đọc blob (Firefox/Safari) — giữ một lúc rồi mới revoke.
    // Timer chạy ngoài zone để 40 giây chờ không giữ ứng dụng ở trạng thái "chưa ổn định" (whenStable, SSR, e2e).
    const timer = this.#zone.runOutsideAngular(() =>
      setTimeout(() => {
        this.#downloadUrls.delete(url);
        this.#revokeObjectUrl(url);
      }, DOWNLOAD_URL_TTL_MS)
    );
    this.#downloadUrls.set(url, timer);
  }

  // ---- Internals: DOM helpers ----

  #acceptsDrag(event: DragEvent): boolean {
    const types = event.dataTransfer?.types;
    return this.canUpload() && !!types && Array.from(types).includes('Files');
  }

  #droppedFiles(transfer: DataTransfer | null): File[] {
    if (!transfer) return [];
    const items = transfer.items ? Array.from(transfer.items) : [];
    if (items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
      // why: thả một thư mục cho ra File rỗng không đọc được — bỏ qua thư mục thay vì tạo transfer chắc chắn lỗi.
      return items
        .filter(item => item.kind === 'file' && !item.webkitGetAsEntry()?.isDirectory)
        .map(item => item.getAsFile())
        .filter((file): file is File => !!file);
    }
    return Array.from(transfer.files ?? []);
  }

  #isBlob(value: unknown): value is Blob {
    return typeof Blob !== 'undefined' && value instanceof Blob;
  }

  #createObjectUrl(blob: Blob): string | null {
    const urlApi = this.#document.defaultView?.URL;
    return typeof urlApi?.createObjectURL === 'function' ? urlApi.createObjectURL(blob) : null;
  }

  #revokeObjectUrl(url: string): void {
    this.#document.defaultView?.URL?.revokeObjectURL?.(url);
  }

  #teardown(): void {
    this.#destroyed = true;
    this.#resizeObserver?.disconnect();
    for (const controller of this.#listControllers.values()) controller.abort();
    this.#listControllers.clear();
    if (this.#searchTimer) clearTimeout(this.#searchTimer);
    this.#searchController?.abort();
    this.#releasePreview();
    for (const job of this.#jobs.values()) job.attempt?.controller.abort();
    for (const [url, timer] of this.#downloadUrls) {
      clearTimeout(timer);
      this.#revokeObjectUrl(url);
    }
    this.#downloadUrls.clear();
    this.#shareController?.abort();
  }
}
