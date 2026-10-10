import { sdFileExplorerNormalizeConfig, sdFileExplorerEligible } from './file-explorer-normalize';
import { DOCUMENT } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { SD_FILE_EXPLORER_MOVE_MIME, SdFileExplorerDragSession, sdFileExplorerValidateMove } from './file-explorer-move';
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
  contentChildren,
  isDevMode,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { SdBreadcrumb, SdBreadcrumbItem } from '@sdcorejs/angular/components/breadcrumb';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdInform, SdInformActionDirective } from '@sdcorejs/angular/components/inform';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdFileExplorerActions } from './components/actions.component';
import { SdFileExplorerColumnDef } from './file-explorer-column.directive';
import { SdFileExplorerCommandSheet, type SdFileExplorerSheetActivation } from './components/command-sheet.component';
import { SdFileExplorerFolderTree } from './components/folder-tree.component';
import { SdFileExplorerItemList } from './components/item-list.component';
import { SdFileExplorerPreviewPanel } from './components/preview-panel.component';
import { SdFileExplorerTransferPanel } from './components/transfer-panel.component';
import {
  SD_FILE_EXPLORER_COMMAND_DEFAULTS,
  sdFileExplorerActionBlocked,
  sdFileExplorerResolveActions,
  sdFileExplorerSheetEntries,
} from './file-explorer-actions';
import type {
  SdFileExplorerActionGroup,
  SdFileExplorerActionLeaf,
  SdFileExplorerCommand,
  SdFileExplorerItem,
  SdFileExplorerOpenEvent,
  SdFileExplorerOption,
  SdFileExplorerConfig,
  SdFileExplorerMoveRequest,
  SdFileExplorerProgressReporter,
  SdFileExplorerSelector,
  SdFileExplorerSelectionAction,
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
  sdFileExplorerNormalize,
  sdFileExplorerPreviewKind,
  sdFileExplorerFoldersFirst,
  sdFileExplorerSafeId,
} from './file-explorer.utils';
import type {
  SdFileExplorerCommandSheetView,
  SdFileExplorerContentState,
  SdFileExplorerItemView,
  SdFileExplorerMetaRow,
  SdFileExplorerPreviewState,
  SdFileExplorerSelectionView,
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
/** Primary pointer is a finger: commands stay visible and use 48 px targets. */
const TOUCH_QUERY = '(pointer: coarse)';
/** How long a saved download's object URL stays alive before it is revoked. */
const DOWNLOAD_URL_TTL_MS = 40_000;

const ACTIVE_STATUSES: ReadonlySet<SdFileExplorerTransferStatus> = new Set(['queued', 'preparing', 'transferring']);
const FINISHED_STATUSES: ReadonlySet<SdFileExplorerTransferStatus> = new Set(['done', 'error', 'cancelled']);

interface FolderState<T = unknown> {
  readonly status: 'loading' | 'loaded' | 'error';
  readonly items: readonly SdFileExplorerItem<T>[];
  /** The folder has been listed successfully at least once (a reload keeps showing the old items). */
  readonly loaded: boolean;
  readonly error?: unknown;
}

interface SearchState<T = unknown> {
  readonly keyword: string;
  readonly parentId: string | null;
  readonly status: 'loading' | 'loaded' | 'error';
  readonly items: readonly SdFileExplorerItem<T>[];
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

/** Where a compact command drawer was opened: a list row, a grid card or a tree node. */
type CommandOrigin = SdFileExplorerView | 'tree';

/** Item whose commands the compact drawer shows. Only its id is kept: the item itself is looked up on every use. */
interface CommandTarget {
  readonly id: string;
  readonly origin: CommandOrigin;
  /** Actions trigger that opened the drawer: focus goes back to it while it is still in the page. */
  readonly trigger: HTMLElement;
}

/** Command pressed in the drawer: the item id and the definitions, looked up again right before the command runs. */
interface PendingCommand<T = unknown> {
  readonly id: string;
  readonly origin: CommandOrigin;
  readonly leaf: SdFileExplorerActionLeaf<SdFileExplorerItem<T>>;
  /** Group the leaf was pressed in; `null` for a flat command. */
  readonly group: SdFileExplorerActionGroup<SdFileExplorerItem<T>> | null;
}

let nextExplorerId = 0;

/**
 * Google-Drive-like file browser: folder tree, breadcrumb, list / grid, search, file detail drawer, uploads with
 * drag-and-drop, downloads and a transfer queue — all inside one element.
 *
 * Storage-agnostic: every read and write goes through the callbacks of `SdFileExplorerOption<T>`.
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
    A11yModule,
    MatTooltip,
    SdIcon,
    SdTranslatePipe,
    SdBreadcrumb,
    SdButton,
    SdInform,
    SdInformActionDirective,
    SdDataState,
    SdFileExplorerActions,
    SdFileExplorerCommandSheet,
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
    '[class.sd-file-explorer--touch]': 'touch()',
    '[class.sd-file-explorer--dragging]': 'dragActive()',
    '[attr.data-autoid]': 'autoId()',
    '(dragenter)': 'onDragEnter($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave()',
    '(drop)': 'onDrop($event)',
    '(dragstart)': 'onMoveDragStart($event)',
    '(dragend)': 'onMoveDragEnd()',
    '(keydown.escape)': 'onEscape($event)',
  },
})
export class SdFileExplorer<T = unknown> {
  readonly #moveDrag = new SdFileExplorerDragSession<T>();
  #moveController: AbortController | null = null;
  #moveRefreshFolders: readonly (string | null)[] = [];
  #moveReturnFocus: HTMLElement | null = null;
  #moveDragSelectionRequired = false;
  #movePickerSelectionRequired = false;
  protected readonly movePending = signal(false);
  protected readonly moveStatus = signal('');
  protected readonly moveRefreshError = signal(false);
  protected readonly movePickerItems = signal<readonly SdFileExplorerItem<T>[] | null>(null);
  protected readonly moveTarget = signal<SdFileExplorerItem<T> | null>(null);
  protected readonly moveDropTarget = signal<string | null | undefined>(undefined);
  protected readonly canMove = computed(() => typeof this.#config().move?.onMove === 'function');
  protected readonly movePickerNodes = computed(() =>
    this.treeNodes().map(node => ({ ...node, selected: node.id === (this.moveTarget()?.id ?? null) }))
  );
  protected readonly canSubmitMove = computed(() => {
    const items = this.movePickerItems();
    if (!items || this.movePending()) return false;
    return this.#moveAllowed(items, this.moveTarget(), 'menu', new AbortController().signal, this.#movePickerSelectionRequired);
  });
  protected readonly columnDefs = contentChildren<SdFileExplorerColumnDef<T>>(SdFileExplorerColumnDef);
  readonly #warnedColumns = new WeakSet<object>();
  protected readonly columns = computed(() => {
    const seen = new Set<string>();
    return this.columnDefs().filter(column => {
      const id = column.id().trim();
      if (!id || seen.has(id)) {
        if (isDevMode() && !this.#warnedColumns.has(column)) {
          this.#warnedColumns.add(column);
          console.warn(`[sd-file-explorer] ignored empty or duplicate column id: ${id}`);
        }
        return false;
      }
      seen.add(id);
      return true;
    });
  });
  readonly #i18n = inject(I18nService);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);
  readonly #zone = inject(NgZone);

  /** Data callbacks and display settings. See `SdFileExplorerOption<T>`. */
  readonly option = input.required<SdFileExplorerConfig<T>>();
  readonly #config = computed(() => sdFileExplorerNormalizeConfig(this.option()));
  /**
   * Emitted exactly once each time the user opens a file (click, `Enter` or `Space` on a file in the list,
   * grid or search results), right before the detail drawer starts loading. Never emitted for folders.
   */
  readonly open = output<SdFileExplorerOpenEvent<T>>();

  // ---- State ----
  readonly #folders = signal<ReadonlyMap<string | null, FolderState<T>>>(new Map());
  readonly #currentId = signal<string | null>(null);
  readonly #path = signal<readonly SdFileExplorerItem<T>[]>([]);
  readonly #expanded = signal<ReadonlySet<string>>(new Set());
  readonly #search = signal<SearchState<T> | null>(null);
  readonly #previewItem = signal<SdFileExplorerItem<T> | null>(null);
  readonly #transfers = signal<readonly SdFileExplorerTransfer[]>([]);
  readonly #width = signal(0);
  readonly #touch = signal(false);
  /**
   * Ids the user selected. Only those still visible and eligible count — see `selectedItems` — and the others are
   * forgotten once the view settles, so a file that leaves the view or gets disabled is never selected again by itself.
   */
  readonly #selectedIds = signal<ReadonlySet<string>>(new Set());
  /** Item whose commands the compact drawer shows; `null` while it is closed. */
  readonly #commandTarget = signal<CommandTarget | null>(null);

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
  protected readonly shareItem = signal<SdFileExplorerItem<T> | null>(null);
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
  protected readonly commandDrawer = viewChild(SdFileExplorerCommandSheet);

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
  /** Command pressed in the compact drawer, waiting for the drawer to finish closing; any context change drops it. */
  #pendingCommand: PendingCommand<T> | null = null;
  #dragDepth = 0;
  #listFn: SdFileExplorerOption<T>['list'] | null = null;
  #resizeObserver: ResizeObserver | null = null;
  #destroyed = false;

  protected readonly instanceId = `sd-file-explorer-${nextExplorerId++}`;

  // ---- Derived ----
  protected readonly compact = computed(() => {
    const width = this.#width();
    return width > 0 && width < COMPACT_MAX_WIDTH;
  });

  protected readonly touch = this.#touch.asReadonly();

  readonly autoId = computed(() => {
    const scope = this.#config().autoId;
    return scope ? `components-file-explorer-${scope}` : undefined;
  });

  protected readonly locale = this.#i18n.locale;
  protected readonly rootLabel = computed(() => this.#config().rootLabel || this.#i18n.t('core.component.file-explorer.root'));
  protected readonly canUpload = computed(() => typeof this.#config().upload === 'function');
  protected readonly canDownload = computed(() => typeof this.#config().download === 'function');
  protected readonly canCreateFolder = computed(() => typeof this.#config().createFolder === 'function');
  protected readonly canShare = computed(() => typeof this.#config().share === 'function');
  protected readonly uploadDisabled = computed(
    () => this.movePending() || !sdFileExplorerEligible(this.#config().uploadable, { parentId: this.#currentId() })
  );
  protected readonly createDisabled = computed(
    () => this.movePending() || !sdFileExplorerEligible(this.#config().creatable, { parentId: this.#currentId() })
  );
  readonly #serverSearch = computed(() => typeof this.#config().search === 'function');

  protected readonly currentName = computed(() => {
    const path = this.#path();
    return path.length ? path[path.length - 1].name : this.rootLabel();
  });

  readonly #itemById = computed(() => {
    const map = new Map<string, SdFileExplorerItem<T>>();
    for (const state of this.#folders().values()) {
      for (const item of state.items) map.set(item.id, item);
    }
    for (const folder of this.#path()) if (!map.has(folder.id)) map.set(folder.id, folder);
    return map;
  });

  readonly #currentFolder = computed(() => this.#folders().get(this.#currentId()));
  readonly #trimmedKeyword = computed(() => this.keyword().trim());
  protected readonly searching = computed(() => this.#trimmedKeyword().length > 0);

  readonly #visibleItems = computed<readonly SdFileExplorerItem<T>[]>(() => {
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

  protected readonly itemViews = computed<readonly SdFileExplorerItemView<T>[]>(() => {
    const format = this.#itemFormatter();
    return sdFileExplorerFoldersFirst(this.#visibleItems()).map(format);
  });

  // ---- Selection ----

  /** The row download / share shortcuts stay until the consumer declares `fileCommands` (even `[]`). */
  protected readonly rowShortcuts = computed(() => this.#config().fileCommands == null);

  readonly #configuredSelector = computed<SdFileExplorerSelector<T> | null>(() => {
    const selector = this.#config().selector;
    return selector && selector.visible !== false ? selector : null;
  });

  readonly #pickerSelection = computed(() => {
    const selector = this.#configuredSelector();
    return (
      !!selector &&
      (selector.mode === 'picker' ||
        (selector.mode === undefined && (typeof selector.onSelect === 'function' || typeof selector.onSelectAll === 'function')))
    );
  });

  /** Selection actions remain caller-owned when declared, including an intentional empty array. */
  protected readonly selectionActions = computed<readonly SdFileExplorerSelectionAction<T>[]>(() => {
    const selector = this.#configuredSelector();
    if (!selector) return [];
    if (selector.actions !== undefined) return selector.actions ?? [];
    if (this.#pickerSelection()) return [];
    const config = this.#config();
    const actions: SdFileExplorerSelectionAction<T>[] = [];
    if (typeof config.move?.onMove === 'function')
      actions.push({
        title: this.#i18n.t('core.component.file-explorer.move.to'),
        prefixIcon: 'drive_file_move',
        type: 'outline',
        disabled: () => this.movePending() || this.moveRefreshError(),
        onClick: items => this.openMovePicker(items),
      });
    if (typeof config.share === 'function')
      actions.push({
        title: this.#i18n.t('core.component.file-explorer.share'),
        prefixIcon: 'share',
        disabled: items => items.length !== 1 || !sdFileExplorerEligible(config.shareable, items[0]),
        onClick: items => {
          if (items.length === 1) this.openShare(items[0]);
        },
      });
    if (typeof config.download === 'function')
      actions.push({
        title: this.#i18n.t('core.component.file-explorer.download'),
        prefixIcon: 'file_download',
        disabled: items => !items.length || items.some(item => !sdFileExplorerEligible(config.downloadable, item)),
        onClick: items => {
          for (const item of items) this.downloadItem(item);
        },
      });
    return actions;
  });

  readonly #selector = computed<SdFileExplorerSelector<T> | null>(() => {
    const selector = this.#configuredSelector();
    if (!selector || this.#pickerSelection()) return selector;
    const selected = this.#selectedCandidates();
    // With nothing selected, probe the available files and individual files so a single-selection action can enable
    // its checkboxes. Hidden predicates still use the actual selection as soon as a user selects something.
    const candidates = this.#selectionCandidates();
    const contexts = selected.length ? [selected] : [candidates, ...candidates.map(item => Object.freeze([item]))];
    const defaults = { leafType: 'light', groupType: 'text', color: 'primary' } as const;
    return contexts.some(items => sdFileExplorerResolveActions(this.selectionActions(), items, defaults, 'selector.actions').length)
      ? selector
      : null;
  });

  /** Files of the current folder or search results, in display order. Folders are never selectable. */
  readonly #visibleFiles = computed(() => this.#visibleItems().filter(item => item.kind === 'file'));

  readonly #selectionCandidates = computed<readonly SdFileExplorerItem<T>[]>(() => {
    const selector = this.#configuredSelector();
    if (!selector) return [];
    const disabled = selector.disabled;
    return disabled ? this.#visibleFiles().filter(item => !disabled(item)) : this.#visibleFiles();
  });

  readonly #selectedCandidates = computed(() =>
    Object.freeze(this.#selectionCandidates().filter(item => this.#selectedIds().has(item.id)))
  );
  readonly #eligibleFiles = computed<readonly SdFileExplorerItem<T>[]>(() => (this.#selector() ? this.#selectionCandidates() : []));

  /**
   * Frozen snapshot of the selection handed to callbacks and actions: selected files that are still visible and
   * eligible, in display order. A file that a refresh drops, or that becomes disabled, leaves it.
   */
  protected readonly selectedItems = computed<readonly SdFileExplorerItem<T>[]>(() => {
    const ids = this.#selectedIds();
    return Object.freeze(this.#eligibleFiles().filter(item => ids.has(item.id)));
  });

  /** Selection state of the item list; `null` (no checkbox, no band) without selector or without files in view. */
  protected readonly selectionView = computed<SdFileExplorerSelectionView | null>(() => {
    const files = this.#visibleFiles();
    if (!this.#selector() || !files.length) return null;
    const eligible = this.#eligibleFiles();
    const selected = this.selectedItems();
    const eligibleIds = new Set(eligible.map(item => item.id));
    const autoId = this.autoId();
    return {
      selectedIds: new Set(selected.map(item => item.id)),
      disabledIds: new Set(files.filter(item => !eligibleIds.has(item.id)).map(item => item.id)),
      state: !selected.length ? 'none' : selected.length === eligible.length ? 'all' : 'some',
      eligibleCount: eligible.length,
      allLabel: this.#i18n.t('core.component.file-explorer.selection.select-all', { count: eligible.length }),
      autoId: autoId ? `${autoId}-select-all` : undefined,
    };
  });

  /**
   * Status sentence of the band, split around the number so the template can set it in semibold: "2 tệp đã chọn",
   * "已选择 2 个文件". Nothing selected: `count` is 0 and `before` holds the whole sentence.
   */
  protected readonly selectionSummary = computed(() => {
    const count = this.selectedItems().length;
    if (!count) return { count, before: this.#i18n.t('core.component.file-explorer.selection.none'), after: '' };
    // why: không truyền params thì I18nService giữ nguyên `{count}` — tách câu đã dịch tại đó, đúng vị trí của từng ngôn ngữ.
    const message = this.#i18n.t(`core.component.file-explorer.selection.${count === 1 ? 'selected-one' : 'selected'}`);
    const placeholder = '{count}';
    const at = message.indexOf(placeholder);
    if (at < 0) return { count, before: '', after: ` ${message}` };
    return { count, before: message.slice(0, at), after: message.slice(at + placeholder.length) };
  });

  // ---- Compact command drawer ----

  // why: mỗi lối tắt là một computed riêng — định nghĩa giữ nguyên object khi chỉ lối tắt kia đổi, nên lần kiểm tra ngay
  // trước khi chạy lệnh (definition còn được khai không) không hủy nhầm "Chia sẻ" chỉ vì `download` vừa đổi.
  readonly #shareShortcut = computed<SdFileExplorerCommand<T> | null>(() =>
    this.canShare()
      ? {
          title: this.#i18n.t('core.component.file-explorer.share'),
          prefixIcon: 'share',
          disabled: item => this.movePending() || !sdFileExplorerEligible(this.#config().shareable, item),
          click: item => this.openShare(item),
        }
      : null
  );
  readonly #downloadShortcut = computed<SdFileExplorerCommand<T> | null>(() =>
    this.canDownload()
      ? {
          title: this.#i18n.t('core.component.file-explorer.download'),
          prefixIcon: 'file_download',
          disabled: item => this.movePending() || !sdFileExplorerEligible(this.#config().downloadable, item),
          click: item => this.downloadItem(item),
        }
      : null
  );

  /** Row shortcuts as commands, for the drawer while `fileCommands` is undeclared: share, then download, as on the row. */
  readonly #shortcuts = computed(() => {
    const commands: SdFileExplorerCommand<T>[] = [];
    const keys: string[] = [];
    const share = this.#shareShortcut();
    const download = this.#downloadShortcut();
    if (share) {
      commands.push(share);
      keys.push('share');
    }
    if (download) {
      commands.push(download);
      keys.push('download');
    }
    return { commands, keys };
  });

  /** Current version of the drawer's item — looked up by id in the list it was opened from; `null` once it is gone. */
  readonly #commandItem = computed<SdFileExplorerItem<T> | null>(() => {
    const target = this.#commandTarget();
    return target ? this.#findCommandItem(target.id, target.origin) : null;
  });

  /** Content of the drawer: the item's commands resolved for it now; `null` when nothing is left to show. */
  // why: kiểu tường minh như contentState — d.ts ổn định giữa các máy build.
  protected readonly commandSheet: Signal<SdFileExplorerCommandSheetView<T> | null> = computed<SdFileExplorerCommandSheetView<T> | null>(
    () => {
      const target = this.#commandTarget();
      const item = this.#commandItem();
      if (!target || !item) return null;
      const definitions = this.#commandDefinitions(item, target.origin);
      const source = item.kind === 'folder' ? 'folderCommands' : 'fileCommands';
      const resolved = sdFileExplorerResolveActions(definitions, item, SD_FILE_EXPLORER_COMMAND_DEFAULTS, source);
      if (!resolved.length) return null;
      const shortcuts = this.#shortcuts();
      const view = this.#itemFormatter()(item);
      return {
        title: item.name,
        context: [view.typeLabel, view.sizeLabel].filter(Boolean).join(' · '),
        icon: view.icon,
        entries: sdFileExplorerSheetEntries(resolved, definitions === shortcuts.commands ? shortcuts.keys : undefined),
      };
    }
  );

  protected readonly itemsMenuOpenId: Signal<string | null> = computed(() => {
    const target = this.#commandTarget();
    return target && target.origin !== 'tree' ? target.id : null;
  });

  protected readonly treeMenuOpenId: Signal<string | null> = computed(() => {
    const target = this.#commandTarget();
    return target?.origin === 'tree' ? target.id : null;
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
    const targets = new Map<SdBreadcrumbItem, SdFileExplorerItem<T> | null>();
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

  protected readonly treeNodes = computed<readonly SdFileExplorerTreeNode<T>[]>(() => {
    const folders = this.#folders();
    const expanded = this.#expanded();
    const current = this.#currentId();
    const autoId = this.autoId();
    const rootState = folders.get(null);
    const nodes: SdFileExplorerTreeNode<T>[] = [
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
        let status: SdFileExplorerTreeNode<T>['status'] = 'idle';
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

  protected readonly previewView = computed<SdFileExplorerItemView<T> | null>(() => {
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
    return (item: SdFileExplorerItem<T>): SdFileExplorerItemView<T> => {
      const type = sdFileExplorerFileType(item);
      return {
        item,
        downloadDisabled: this.movePending() || !sdFileExplorerEligible(this.#config().downloadable, item),
        shareDisabled: this.movePending() || !sdFileExplorerEligible(this.#config().shareable, item),
        unavailableReason: t('action-unavailable'),
        type,
        icon: sdFileExplorerIconName(item),
        typeLabel: t(`type.${type}`),
        sizeLabel: item.kind === 'file' ? sdFileExplorerFormatSize(item.size, locale) : '',
        modifiedLabel: sdFileExplorerFormatDate(item.modifiedAt, now, locale, labels),
        modifiedTitle: sdFileExplorerFormatDateTime(item.modifiedAt, locale),
        downloadLabel: t('download-item', { name: item.name }),
        shareLabel: t('share-item', { name: item.name }),
        selectLabel: t('selection.select-item', { name: item.name }),
        actionsLabel: t('item-actions', { name: item.name }),
        autoId: autoId ? `${autoId}-item-${sdFileExplorerSafeId(item.id)}` : undefined,
      };
    };
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    let previewProvider: SdFileExplorerOption<T>['preview'];
    let shareProvider: SdFileExplorerOption<T>['share'];
    let moveProvider: SdFileExplorerConfig<T>['move'];
    let searchProvider: SdFileExplorerOption<T>['search'];
    effect(() => {
      const config = this.#config();
      const previewChanged = previewProvider !== config.preview;
      const shareChanged = shareProvider !== config.share;
      const moveChanged = moveProvider?.onMove !== config.move?.onMove;
      const searchChanged = searchProvider !== config.search;
      previewProvider = config.preview;
      shareProvider = config.share;
      moveProvider = config.move;
      searchProvider = config.search;
      untracked(() => {
        const item = this.#previewItem();
        if (previewChanged && item) void this.#loadPreview(item);
        const shareItem = this.shareItem();
        if (shareChanged && shareItem) {
          this.#shareController?.abort();
          if (config.share && sdFileExplorerEligible(config.shareable, shareItem)) void this.#loadShareLink(shareItem);
          else this.closeShare();
        }
        if (moveChanged && this.#moveController) this.cancelMove();
        if (searchChanged && this.#listFn === config.list) this.#scheduleSearch(true);
      });
    });
    // why: trên màn hình cảm ứng không có hover — lệnh của hàng/thẻ/cây luôn hiện và dùng vùng chạm 48px.
    // Đọc ngay trong constructor (không đợi render) để lần vẽ đầu đã đúng cỡ, rồi theo dõi khi thiết bị đổi con trỏ.
    const touchQuery = this.#document.defaultView?.matchMedia?.(TOUCH_QUERY);
    if (touchQuery) {
      this.#touch.set(touchQuery.matches);
      const onTouchChange = (event: MediaQueryListEvent) => this.#touch.set(event.matches);
      touchQuery.addEventListener?.('change', onTouchChange);
      destroyRef.onDestroy(() => touchQuery.removeEventListener?.('change', onTouchChange));
    }

    // why: chỉ reset khi hàm `list` đổi (đổi nguồn lưu trữ). Consumer tạo lại object option với cùng callback
    // (ví dụ đổi title) không được xoá cache/điều hướng của người dùng.
    effect(() => {
      const option = this.#config();
      const selecting = !!this.#selector();
      untracked(() => {
        if (!selecting) this.#clearSelection();
        if (this.#listFn === option.list) return;
        const firstRun = this.#listFn === null;
        this.#listFn = option.list;
        if (this.#moveController) this.cancelMove();
        this.moveRefreshError.set(false);
        this.#moveRefreshFolders = [];
        this.#moveDrag.clear();
        if (firstRun) this.view.set(option.defaultView ?? 'list');
        this.#resetNavigation();
        this.#ensureLoaded(null);
      });
    });

    // why: tệp bị lần tải lại bỏ khỏi danh sách hoặc bị consumer khóa (selector.disabled) rời lựa chọn hẳn — không
    // được tự chọn lại khi xuất hiện/mở khóa lần sau. Chỉ dọn khi nội dung đã ổn định (không dọn lúc đang tải) và không
    // gọi callback: đây không phải thao tác của người dùng hay một lần đổi phạm vi. Tạo SAU effect option để khi
    // selector bị ẩn, #clearSelection (có onClear) chạy trước lần dọn im lặng này.
    effect(() => {
      const eligible = this.#eligibleFiles();
      if (this.contentState() === 'loading') return;
      untracked(() => this.#keepEligibleSelection(eligible));
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

    // why: rời khỏi layout compact thì drawer không còn ý nghĩa — đóng để lần thu nhỏ sau không bật lại scrim. Drawer
    // lệnh cũng đóng: hàng/thẻ/cây lại hiện lệnh của chúng (xoay ngang máy, kéo rộng cửa sổ).
    effect(() => {
      if (this.compact()) return;
      untracked(() => {
        this.sidebarOpen.set(false);
        this.#closeCommands();
      });
    });

    // why: mục của drawer lệnh rời danh sách (lần tải lại bỏ nó, kết quả tìm kiếm đổi) hoặc không còn lệnh nào hiện —
    // đóng drawer thay vì giữ một ảnh chụp cũ có thể chạy lệnh trên mục đã mất.
    effect(() => {
      if (this.#commandTarget() && !this.commandSheet()) untracked(() => this.#closeCommands());
    });

    // why: nút Back của trình duyệt / Android khi drawer lệnh đang mở — đóng drawer theo điều hướng của trang. Drawer không
    // giữ mục lịch sử nào (không pushState, không history.back): Back vẫn điều hướng như bình thường.
    const view = this.#document.defaultView;
    if (view) {
      const onPopState = () => this.#closeCommands();
      view.addEventListener('popstate', onPopState);
      destroyRef.onDestroy(() => view.removeEventListener('popstate', onPopState));
    }

    destroyRef.onDestroy(() => this.#teardown());
  }

  // ---- Public API ----

  /** Moves visible files through the caller's storage callback. False includes cancellation, rejection or refresh failure. */
  async moveFiles(
    items: readonly SdFileExplorerItem<T>[],
    targetFolder: SdFileExplorerItem<T> | null,
    source: SdFileExplorerMoveRequest<T>['source'] = 'api'
  ): Promise<boolean> {
    return this.#performMove(items, targetFolder, source, false);
  }

  async #performMove(
    items: readonly SdFileExplorerItem<T>[],
    targetFolder: SdFileExplorerItem<T> | null,
    source: SdFileExplorerMoveRequest<T>['source'],
    selectionRequired: boolean
  ): Promise<boolean> {
    const move = this.#config().move;
    if (
      !move ||
      this.movePending() ||
      this.moveRefreshError() ||
      this.folderSubmitting() ||
      this.#transfers().some(transfer => transfer.direction === 'upload' && ACTIVE_STATUSES.has(transfer.status)) ||
      this.#destroyed
    )
      return false;
    const controller = new AbortController();
    if (!this.#moveAllowed(items, targetFolder, source, controller.signal, selectionRequired)) return false;
    const request: SdFileExplorerMoveRequest<T> = Object.freeze({
      items: Object.freeze([...items]),
      targetFolder,
      source,
      signal: controller.signal,
    });
    const sourceParents = items.map(item => item.parentId);
    const movedIds = new Set(items.map(item => item.id));
    const cachedSources = [...this.#folders()].filter(([, folder]) => folder.items.some(item => movedIds.has(item.id))).map(([id]) => id);
    this.#moveController = controller;
    this.movePending.set(true);
    this.moveStatus.set(this.#i18n.t('core.component.file-explorer.move.pending'));
    try {
      const accepted = await move.onMove(request);
      if (controller.signal.aborted || this.#destroyed || this.#config().move?.onMove !== move.onMove) return false;
      if (accepted === false) {
        this.moveStatus.set(this.#i18n.t('core.component.file-explorer.move.cancelled'));
        return false;
      }
      this.#moveRefreshFolders = [...new Set([...sourceParents, ...cachedSources, targetFolder?.id ?? null])].filter(id =>
        this.#folders().has(id)
      );
      this.#clearSelection();
      return await this.#refreshMove(controller);
    } catch (error) {
      if (!controller.signal.aborted && !this.#destroyed)
        this.moveStatus.set(sdFileExplorerErrorMessage(error) || this.#i18n.t('core.component.file-explorer.move.error'));
      return false;
    } finally {
      if (this.#moveController === controller) {
        this.#moveController = null;
        this.movePending.set(false);
      }
    }
  }

  /** Cooperatively aborts the current mutation. A consumer may already have committed its storage change. */
  cancelMove(): void {
    this.#moveController?.abort();
    this.#moveController = null;
    this.movePending.set(false);
    this.moveStatus.set(this.#i18n.t('core.component.file-explorer.move.cancelled'));
    this.#moveDrag.clear();
  }

  /** Repeats failed listing only; never calls onMove again. */
  async retryMoveRefresh(): Promise<boolean> {
    if (!this.moveRefreshError() || this.movePending() || this.#destroyed) return false;
    const controller = new AbortController();
    this.#moveController = controller;
    this.movePending.set(true);
    try {
      return await this.#refreshMove(controller);
    } finally {
      if (this.#moveController === controller) {
        this.#moveController = null;
        this.movePending.set(false);
      }
    }
  }

  async #refreshMove(controller: AbortController): Promise<boolean> {
    await Promise.all(this.#moveRefreshFolders.map(id => this.#load(id)));
    if (controller.signal.aborted || this.#destroyed) return false;
    const failed = this.#moveRefreshFolders.some(id => this.#folders().get(id)?.status !== 'loaded');
    this.moveRefreshError.set(failed);
    this.moveStatus.set(
      this.#i18n.t(failed ? 'core.component.file-explorer.move.refresh-error' : 'core.component.file-explorer.move.done')
    );
    if (!failed) {
      this.#moveRefreshFolders = [];
      if (this.searching()) this.#scheduleSearch(true);
    }
    return !failed;
  }

  #moveAllowed(
    items: readonly SdFileExplorerItem<T>[],
    target: SdFileExplorerItem<T> | null,
    source: SdFileExplorerMoveRequest<T>['source'],
    signal: AbortSignal,
    selectionRequired = false
  ): boolean {
    const move = this.#config().move;
    const visible = this.#visibleItems();
    const known = [...this.#folders().values()].flatMap(folder => folder.items.filter(item => item.kind === 'folder'));
    if (!move || !sdFileExplorerValidateMove(items, target, known, visible)) return false;
    if (selectionRequired && items.some(item => !this.#eligibleFiles().includes(item))) return false;
    return sdFileExplorerEligible(move.movable, { items: Object.freeze([...items]), targetFolder: target, source, signal });
  }

  protected openMovePicker(items: readonly SdFileExplorerItem<T>[], event?: Event): void {
    if (!this.canMove() || this.movePending() || !items.length) return;
    const active = this.#document.activeElement;
    this.#moveReturnFocus = active instanceof HTMLElement ? active : null;
    const selected = this.selectedItems();
    this.#movePickerSelectionRequired = items.every(item => selected.includes(item));
    this.moveTarget.set(null);
    this.movePickerItems.set(Object.freeze([...items]));
    event?.stopPropagation();
  }

  protected closeMovePicker(): void {
    if (this.movePending()) this.cancelMove();
    this.movePickerItems.set(null);
    this.#movePickerSelectionRequired = false;
    const focus = this.#moveReturnFocus;
    this.#moveReturnFocus = null;
    if (focus?.isConnected) afterNextRender(() => focus.focus({ preventScroll: true }), { injector: this.#injector });
  }

  protected submitMoveFromEvent(event: Event): void {
    void this.submitMove(event instanceof MouseEvent && event.detail === 0 ? 'keyboard' : 'menu');
  }

  protected async submitMove(source: 'menu' | 'keyboard' = 'menu'): Promise<void> {
    const items = this.movePickerItems();
    if (!items) return;
    if (await this.#performMove(items, this.moveTarget(), source, this.#movePickerSelectionRequired)) this.closeMovePicker();
  }

  protected onMoveDragStart(event: DragEvent): void {
    const element = event.target instanceof Element ? event.target : null;
    if (
      !element?.closest('.name, .card-name') ||
      element.closest('button,input,a,.commands,.card-top,.cell--select') ||
      !event.dataTransfer ||
      !this.canMove() ||
      this.movePending()
    ) {
      event.preventDefault();
      return;
    }
    const id = element.closest<HTMLElement>('[data-item-id]')?.dataset['itemId'];
    const file = this.#visibleItems().find(item => item.id === id && item.kind === 'file');
    if (!file) {
      event.preventDefault();
      return;
    }
    const selected = this.selectedItems();
    this.#moveDragSelectionRequired = selected.includes(file);
    const items = selected.includes(file) ? selected : [file];
    event.dataTransfer.setData(SD_FILE_EXPLORER_MOVE_MIME, this.#moveDrag.start(items));
    event.dataTransfer.effectAllowed = 'move';
  }

  protected onMoveDragEnd(): void {
    this.#moveDrag.clear();
    this.#moveDragSelectionRequired = false;
    this.moveDropTarget.set(undefined);
  }

  #internalDropTarget(event: DragEvent): { folder: SdFileExplorerItem<T> | null } | null {
    const element = event.target instanceof Element ? event.target : null;
    if (element?.closest('sd-file-explorer') !== this.#host.nativeElement) return null;
    const node = element.closest<HTMLElement>('[data-move-target]');
    if (!node) return null;
    const id = node.dataset['moveTarget'];
    if (id === '') return { folder: null };
    const folder = [...this.#itemById().values()].find(item => item.id === id && item.kind === 'folder');
    return folder ? { folder } : null;
  }

  /**
   * Lists the current folder again and drops the cached children of folders that are neither open in the
   * tree nor on the current path. Re-runs the active search, if any. Clears the file selection and closes the command
   * drawer of the compact layout.
   */
  reload(): void {
    this.#clearSelection();
    this.#closeCommands();
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

  protected navigate(folder: SdFileExplorerItem<T> | null): void {
    const id = folder?.id ?? null;
    if (id !== this.#currentId()) this.#clearSelection();
    this.#closeCommands();
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

  protected onTreeSelect(node: SdFileExplorerTreeNode<T>): void {
    this.navigate(node.item);
  }

  protected onTreeToggle(node: SdFileExplorerTreeNode<T>): void {
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

  protected onTreeRetry(node: SdFileExplorerTreeNode<T>): void {
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

  protected onActivate(view: SdFileExplorerItemView<T>): void {
    if (view.item.kind === 'folder') this.navigate(view.item);
    else this.openFile(view.item);
  }

  protected openFile(item: SdFileExplorerItem<T>): void {
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

  protected downloadItem(item: SdFileExplorerItem<T>): void {
    const download = this.#config().download;
    if (!download || !sdFileExplorerEligible(this.#config().downloadable, item)) return;
    this.#enqueue('download', item.name, item.parentId, args => {
      if (!sdFileExplorerEligible(this.#config().downloadable, item))
        throw new Error(this.#i18n.t('core.component.file-explorer.action-unavailable'));
      return download({ item, ...args });
    });
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

  // ---- Selection ----

  protected toggleSelection(item: SdFileExplorerItem<T>): void {
    const selector = this.#selector();
    if (!selector || !this.#eligibleFiles().some(file => file.id === item.id)) return;
    // why: dựng lại từ selectedItems (không từ #selectedIds) để bỏ luôn id của tệp đã rời khỏi danh sách.
    const next = new Set(this.selectedItems().map(file => file.id));
    if (next.has(item.id)) next.delete(item.id);
    else next.add(item.id);
    this.#selectedIds.set(next);
    selector.onSelect?.(item, this.selectedItems());
  }

  protected toggleSelectAll(): void {
    const selector = this.#selector();
    const eligible = this.#eligibleFiles();
    if (!selector || !eligible.length) return;
    const all = this.selectedItems().length === eligible.length;
    this.#selectedIds.set(new Set(all ? [] : eligible.map(item => item.id)));
    selector.onSelectAll?.(this.selectedItems());
  }

  protected clearSelection(): void {
    const active = this.#document.activeElement;
    if (active instanceof HTMLElement && active.classList.contains('selection-clear') && this.#host.nativeElement.contains(active)) {
      // Move owned focus before removing the toolbar. A consumer's onClear callback
      // remains free to move focus elsewhere after the selection is cleared.
      this.#host.nativeElement.querySelector<HTMLElement>('.select-all input')?.focus({ preventScroll: true });
    }
    this.#clearSelection();
  }

  /** Empties the selection, calling `onClear` once when something was selected. */
  #clearSelection(): void {
    if (!this.#selectedIds().size) return;
    this.#selectedIds.set(new Set());
    this.#config().selector?.onClear?.();
  }

  /** Forgets selected ids that are no longer visible and eligible. Silent: no callback. */
  #keepEligibleSelection(eligible: readonly SdFileExplorerItem<T>[]): void {
    const ids = this.#selectedIds();
    if (!ids.size) return;
    const kept = new Set(eligible.filter(item => ids.has(item.id)).map(item => item.id));
    if (kept.size !== ids.size) this.#selectedIds.set(kept);
  }

  // ---- Compact command drawer ----

  protected openCommands(item: SdFileExplorerItem<T>, origin: CommandOrigin, trigger: HTMLElement): void {
    this.#pendingCommand = null;
    // why: bẫy focus của sd-side-drawer trả focus về phần tử đang giữ focus lúc nó mở. Chạm vào nút trên iOS không
    // focus nút, nên focus nút trước khi mở để đóng drawer xong focus về đúng hàng / thẻ / nút cây.
    trigger.focus({ preventScroll: true });
    this.#commandTarget.set({ id: item.id, origin, trigger });
    this.commandDrawer()?.show();
  }

  /** The user closed the drawer (close button, `Escape`, backdrop). */
  protected onCommandsClosed(): void {
    const target = this.#commandTarget();
    if (!target) return;
    this.#commandTarget.set(null);
    afterNextRender(() => this.#restoreCommandFocus(target), { injector: this.#injector });
  }

  /**
   * Runs a command pressed in the drawer. The press is checked against the current item, definitions and states: a
   * stale entry, a state the consumer changed since the last render or a second press runs nothing.
   *
   * The drawer closes first, at once. The command runs after the next render: by then the drawer's focus trap is gone
   * and has handed focus back, so it cannot pull focus away from a dialog or a preview the command opens. Right before
   * it runs, the same check is made again, and `click` receives the item as listed at that moment.
   */
  protected runCommand({ command, group }: SdFileExplorerSheetActivation): void {
    const target = this.#commandTarget();
    if (this.#pendingCommand || !target) return;
    const pending: PendingCommand<T> = { id: target.id, origin: target.origin, leaf: command.definition, group: group?.definition ?? null };
    if (!this.#runnableItem(pending)) {
      // why: trạng thái do consumer giữ ngoài signal đã đổi từ lần render trước — tính lại để drawer hiện đúng trạng thái.
      this.#commandTarget.set({ ...target });
      return;
    }
    this.#pendingCommand = pending;
    this.#commandTarget.set(null);
    this.commandDrawer()?.hide();
    afterNextRender(
      () => {
        if (this.#pendingCommand !== pending) return;
        this.#pendingCommand = null;
        this.#restoreCommandFocus(target);
        // why: giữa lúc bấm và lần render này consumer vẫn có thể đổi trạng thái, rút định nghĩa hay làm mới danh sách
        // (drawer đã đóng nên effect "mục biến mất" không còn canh) — kiểm lại ngay trước khi chạy, với bản hiện tại của mục.
        const item = this.#runnableItem(pending);
        if (item) (pending.leaf.onClick ?? pending.leaf.click)?.(item);
      },
      { injector: this.#injector }
    );
  }

  /** Current version of an item, by id, in the list a drawer was opened from (list / grid items or tree folders). */
  #findCommandItem(id: string, origin: CommandOrigin): SdFileExplorerItem<T> | null {
    if (origin === 'tree') return this.treeNodes().find(node => node.id === id)?.item ?? null;
    return this.#visibleItems().find(item => item.id === id) ?? null;
  }

  /**
   * The current item when `command` may run now — the item is still listed where the drawer was opened, the pressed
   * definition and its group are still declared for it, and neither is hidden, disabled or loading — else `null`.
   */
  #runnableItem(command: PendingCommand<T>): SdFileExplorerItem<T> | null {
    const item = this.#findCommandItem(command.id, command.origin);
    if (!item) return null;
    const { leaf, group } = command;
    const definitions = this.#commandDefinitions(item, command.origin);
    const declared = group ? definitions.includes(group) && group.children.includes(leaf) : definitions.includes(leaf);
    const blocked = (group !== null && sdFileExplorerActionBlocked(group, item)) || sdFileExplorerActionBlocked(leaf, item);
    return declared && !blocked ? item : null;
  }

  /** Commands of one item in the drawer: the declared ones, or the row shortcuts while `fileCommands` is undeclared. */
  #commandDefinitions(item: SdFileExplorerItem<T>, origin: CommandOrigin): readonly SdFileExplorerCommand<T>[] {
    const option = this.#config();
    if (item.kind === 'folder') return option.folderCommands ?? [];
    if (option.fileCommands != null) return option.fileCommands;
    // why: lối tắt tải xuống / chia sẻ chỉ có trên hàng danh sách — thẻ lưới chưa từng có — nên chỉ hàng mang chúng vào drawer.
    return origin === 'list' ? this.#shortcuts().commands : [];
  }

  /** Closes the drawer without running anything and drops a pressed command that has not run yet. */
  #closeCommands(): void {
    this.#pendingCommand = null;
    const target = this.#commandTarget();
    if (!target) return;
    this.#commandTarget.set(null);
    this.commandDrawer()?.hide();
    afterNextRender(() => this.#restoreCommandFocus(target), { injector: this.#injector });
  }

  /**
   * After the drawer closed: when its focus trap could not give focus back — the trigger left the page with its row,
   * or the layout changed — focus the item's row, card or tree tab stop, the first item, or the search box.
   */
  #restoreCommandFocus(target: CommandTarget): void {
    const active = this.#document.activeElement;
    if (this.#destroyed || (active && active !== this.#document.body)) return;
    const host = this.#host.nativeElement;
    const items = Array.from(host.querySelectorAll<HTMLElement>('[data-item-id]'));
    const candidates = [
      target.trigger.isConnected ? target.trigger : null,
      target.origin === 'tree'
        ? host.querySelector<HTMLElement>('[role="treeitem"][tabindex="0"]')
        : (items.find(element => element.dataset['itemId'] === target.id) ?? null),
      items[0] ?? null,
      this.searchInput()?.nativeElement ?? null,
    ];
    for (const candidate of candidates) {
      candidate?.focus({ preventScroll: true });
      if (candidate && this.#document.activeElement === candidate) return;
    }
  }

  // ---- Search ----

  protected onKeywordInput(value: string): void {
    const before = this.#trimmedKeyword();
    this.keyword.set(value);
    if (this.#trimmedKeyword() !== before) {
      this.#clearSelection();
      this.#closeCommands();
    }
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
    if (this.movePending()) return;
    const upload = this.#config().upload;
    if (!upload || files.length === 0 || !sdFileExplorerEligible(this.#config().uploadable, { parentId: this.#currentId() })) return;
    const parentId = this.#currentId();
    for (const file of files) {
      this.#enqueue('upload', file.name, parentId, args => {
        if (!sdFileExplorerEligible(this.#config().uploadable, { parentId }))
          throw new Error(this.#i18n.t('core.component.file-explorer.action-unavailable'));
        return upload({ file, parentId, ...args });
      });
    }
    this.transfersCollapsed.set(false);
  }

  protected onDragEnter(event: DragEvent): void {
    if (event.dataTransfer?.types.includes(SD_FILE_EXPLORER_MOVE_MIME)) {
      this.onDragOver(event);
      return;
    }
    if (!this.#acceptsDrag(event)) return;
    event.preventDefault();
    this.#dragDepth++;
    this.dragActive.set(true);
  }

  protected onDragOver(event: DragEvent): void {
    if (event.dataTransfer?.types.includes(SD_FILE_EXPLORER_MOVE_MIME)) {
      const target = this.#internalDropTarget(event);
      const items = this.#moveDrag.activeItems;
      const allowed =
        !event.dataTransfer.types.includes('Files') &&
        !!items &&
        !!target &&
        !this.movePending() &&
        this.#moveAllowed(items, target.folder, 'drag', new AbortController().signal, this.#moveDragSelectionRequired);
      if (target && items && allowed) event.preventDefault();
      event.dataTransfer.dropEffect = allowed ? 'move' : 'none';
      this.moveDropTarget.set(allowed ? (target!.folder?.id ?? null) : undefined);
      return;
    }
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
    if (event.dataTransfer?.types.includes(SD_FILE_EXPLORER_MOVE_MIME)) {
      event.preventDefault();
      const target = this.#internalDropTarget(event);
      const items = this.#moveDrag.resolve(event.dataTransfer.getData(SD_FILE_EXPLORER_MOVE_MIME));
      const mixed = event.dataTransfer.types.includes('Files') || event.dataTransfer.files.length > 0;
      const selectionRequired = this.#moveDragSelectionRequired;
      this.onMoveDragEnd();
      if (items && target && !mixed) void this.#performMove(items, target.folder, 'drag', selectionRequired);
      return;
    }
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
    if (job?.direction === 'upload' && this.movePending()) return;
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

  protected openShare(item: SdFileExplorerItem<T>): void {
    if (!this.#config().share || !sdFileExplorerEligible(this.#config().shareable, item)) return;
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

  async #loadShareLink(item: SdFileExplorerItem<T>): Promise<void> {
    const share = this.#config().share;
    if (!share || !sdFileExplorerEligible(this.#config().shareable, item)) return;
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
    if (this.movePending()) return;
    const create = this.#config().createFolder;
    const name = this.folderName().trim();
    if (!create || !name || this.folderSubmitting() || !sdFileExplorerEligible(this.#config().creatable, { parentId: this.#currentId() }))
      return;
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
    if (this.movePickerItems()) this.closeMovePicker();
    else if (this.movePending()) this.cancelMove();
    else if (this.folderDialogOpen()) this.closeFolderDialog();
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
    this.#clearSelection();
    this.#closeCommands();
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
      const items = await this.#config().list({ parentId, signal: controller.signal });
      if (controller.signal.aborted || this.#destroyed) return;
      this.#setFolder(parentId, { status: 'loaded', items: Array.isArray(items) ? items : [], loaded: true });
    } catch (error) {
      if (controller.signal.aborted || this.#destroyed) return;
      this.#setFolder(parentId, { status: 'error', items: [], loaded: false, error });
    } finally {
      if (this.#listControllers.get(parentId) === controller) this.#listControllers.delete(parentId);
    }
  }

  #setFolder(parentId: string | null, state: FolderState<T>): void {
    this.#folders.update(folders => new Map(folders).set(parentId, state));
  }

  #buildPath(folder: SdFileExplorerItem<T>): SdFileExplorerItem<T>[] {
    const byId = this.#itemById();
    const chain: SdFileExplorerItem<T>[] = [folder];
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
    const search = this.#config().search;
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
    const search = this.#config().search;
    if (!search) return;
    const controller = new AbortController();
    this.#searchController = controller;
    try {
      const items = await search({ parentId, keyword, signal: controller.signal });
      if (controller.signal.aborted || this.#destroyed || this.#config().search !== search) return;
      this.#search.set({ keyword, parentId, status: 'loaded', items: Array.isArray(items) ? items : [] });
    } catch (error) {
      if (controller.signal.aborted || this.#destroyed || this.#config().search !== search) return;
      this.#search.set({ keyword, parentId, status: 'error', items: [], error });
    } finally {
      if (this.#searchController === controller) this.#searchController = null;
    }
  }

  #clearSearch(): void {
    if (this.#trimmedKeyword()) {
      this.#clearSelection();
      this.#closeCommands();
    }
    this.keyword.set('');
    this.#scheduleSearch(false);
  }

  // ---- Internals: preview ----

  async #loadPreview(item: SdFileExplorerItem<T>): Promise<void> {
    this.#releasePreview();
    const kind = sdFileExplorerPreviewKind(sdFileExplorerFileType(item));
    const fallback = (): SdFileExplorerPreviewState =>
      kind === 'image' && item.thumbnailUrl ? { status: 'image', url: item.thumbnailUrl } : { status: 'unavailable' };
    const preview = this.#config().preview;
    // why: định dạng không có renderer thì KHÔNG gọi callback — tránh tải cả file chỉ để hiện fallback.
    if (kind === 'none' || !preview || !sdFileExplorerEligible(this.#config().previewable, item)) {
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
      } else if (kind === 'video') {
        // why: sd-preview-video owns the object URL of a Blob and refuses unsafe URL schemes itself.
        this.previewState.set({ status: 'video', source });
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
    return (
      this.canUpload() &&
      !this.uploadDisabled() &&
      !!types &&
      !Array.from(types).includes(SD_FILE_EXPLORER_MOVE_MIME) &&
      Array.from(types).includes('Files')
    );
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
    this.#moveController?.abort();
    this.#moveDrag.clear();
    // A command pressed right before the explorer goes away never runs; sd-side-drawer releases its own scroll lock.
    this.#pendingCommand = null;
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
