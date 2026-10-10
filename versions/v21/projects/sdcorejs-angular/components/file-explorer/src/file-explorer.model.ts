import type { SdButtonColor, SdButtonType } from '@sdcorejs/angular/components/button';
import type { SdIconSet } from '@sdcorejs/angular/modules/icon';

/**
 * Kind of an explorer entry. Folders can be opened and listed; files can be previewed and downloaded.
 */
export type SdFileExplorerItemKind = 'folder' | 'file';

/**
 * One file or folder shown by `<sd-file-explorer>`.
 *
 * The explorer never talks to a storage API itself: every item comes from `SdFileExplorerOption<T>.list`
 * (or `search`), so map your own DTO into this shape inside the callback.
 *
 * @example
 * ```ts
 * const item: SdFileExplorerItem<T> = {
 *   id: 'f-42',
 *   parentId: 'folder-7', // null = item sits in the root folder
 *   name: 'Contract.pdf',
 *   kind: 'file',
 *   mimeType: 'application/pdf',
 *   size: 2_516_582,
 *   modifiedAt: '2026-09-21T08:30:00Z',
 * };
 * ```
 */
export interface SdFileExplorerItem<T = unknown> {
  /** Caller-owned DTO, preserved by identity and never serialized by the explorer. */
  data?: T;
  /** Stable id, unique across the whole tree. Used for tracking, navigation and `autoId` suffixes. */
  id: string;
  /** Id of the containing folder, or `null` when the item sits in the root folder. */
  parentId: string | null;
  /** Display name, including the extension for files. */
  name: string;
  /** `'folder'` or `'file'`. */
  kind: SdFileExplorerItemKind;
  /**
   * MIME type such as `application/pdf` or `image/png`. Drives the type label and the preview renderer, falling
   * back to the file extension in `name` when omitted. The file-type icon prefers the extension and uses the MIME
   * type only when the extension is unknown.
   */
  mimeType?: string;
  /** Size in bytes. Shown for files only; the column shows a dash when omitted. */
  size?: number;
  /** Last modification time (a `Date`, an ISO string or epoch milliseconds). The column shows a dash when omitted. */
  modifiedAt?: Date | string | number;
  /**
   * Folders only. Set `false` for a folder known to contain no sub-folders so the tree hides its expander.
   * Leave `undefined` when unknown; the tree then shows the expander until the folder has been listed.
   */
  hasChildren?: boolean;
  /** Image URL shown on the grid card instead of the file-type icon. Caller-owned: the explorer never revokes it. */
  thumbnailUrl?: string;
}

/** Arguments of `SdFileExplorerOption<T>.list`. */
export interface SdFileExplorerListArgs {
  /** Folder whose direct children are requested; `null` is the root folder. */
  parentId: string | null;
  /**
   * Aborted when the result is no longer needed: the same folder is listed again (`reload()`, a finished upload),
   * the `list` callback is replaced, or the explorer is destroyed. Navigating away does not abort — the result
   * is cached for the next visit.
   */
  signal: AbortSignal;
}

/** Arguments of `SdFileExplorerOption<T>.search`. */
export interface SdFileExplorerSearchArgs {
  /** Folder the user is currently viewing; `null` is the root folder. */
  parentId: string | null;
  /** Trimmed, non-empty keyword typed by the user. */
  keyword: string;
  /** Aborted when a newer keyword supersedes this one, the search is cleared or the user navigates away. */
  signal: AbortSignal;
}

/** Arguments of `SdFileExplorerOption<T>.preview`. */
export interface SdFileExplorerPreviewArgs<T = unknown> {
  /** File being previewed. */
  item: SdFileExplorerItem<T>;
  /** Aborted when the detail drawer is closed or another file is opened before this one resolves. */
  signal: AbortSignal;
}

/**
 * Content returned by `SdFileExplorerOption<T>.preview`.
 *
 * - `string`: a URL. Caller-owned — the explorer uses it as-is and never revokes it.
 * - `Blob` / `File`: the explorer creates an object URL when needed and revokes it when the preview closes,
 *   another file is opened, or the explorer is destroyed.
 */
export type SdFileExplorerPreviewSource = string | Blob;

/**
 * Progress reporter handed to `upload` and `download`.
 *
 * Call it with the bytes transferred so far and, when known, the total size. The first call moves the
 * transfer from `preparing` to `transferring`. A percentage is displayed only when `total` is a positive
 * number; without it the progress bar stays indeterminate — the explorer never invents a percentage.
 */
export type SdFileExplorerProgressReporter = (loaded: number, total?: number) => void;

/** Arguments shared by `upload` and `download`. */
export interface SdFileExplorerTransferArgs {
  /** Report transfer progress. Optional to call; calls after the transfer ended are ignored. */
  progress: SdFileExplorerProgressReporter;
  /**
   * Aborted when the user cancels the transfer or the explorer is destroyed. Pass it to `fetch`/`HttpClient`
   * (or abort your XHR) so cancelling really stops the network request.
   */
  signal: AbortSignal;
}

/** Arguments of `SdFileExplorerOption<T>.upload`. */
export interface SdFileExplorerUploadArgs extends SdFileExplorerTransferArgs {
  /** File picked through the upload button or dropped onto the explorer. */
  file: File;
  /** Destination folder (the folder being viewed when the upload started); `null` is the root folder. */
  parentId: string | null;
}

/** Arguments of `SdFileExplorerOption<T>.download`. */
export interface SdFileExplorerDownloadArgs<T = unknown> extends SdFileExplorerTransferArgs {
  /** File to download. */
  item: SdFileExplorerItem<T>;
}

/** Arguments of `SdFileExplorerOption<T>.share`. */
export interface SdFileExplorerShareArgs<T = unknown> {
  /** File to share. */
  item: SdFileExplorerItem<T>;
  /** Aborted when the user closes the share dialog before the link is ready, or the explorer is destroyed. */
  signal: AbortSignal;
}

/** Arguments of `SdFileExplorerOption<T>.createFolder`. */
export interface SdFileExplorerCreateFolderArgs {
  /** Folder that receives the new folder (the folder being viewed); `null` is the root folder. */
  parentId: string | null;
  /** Trimmed, non-empty name typed by the user. */
  name: string;
}

/** Layout of the item area. */
export type SdFileExplorerView = 'list' | 'grid';

/**
 * Static or per-context state of an explorer action (`hidden`, `disabled`, `loading`).
 *
 * A function receives the same context as the action's `click`: the selected files for `selector.actions`, the item
 * of the row, card or tree node for `fileCommands` / `folderCommands`. It is evaluated while rendering and again
 * right before `click` runs; read Angular signals inside it so the explorer re-renders when the state changes.
 */
export type SdFileExplorerState<T> = boolean | ((context: T) => boolean);

/** Appearance and state shared by every explorer action, flat button or group. */
export interface SdFileExplorerActionAppearance<T> {
  /**
   * Visible label. Without it the button is icon-only and `tooltip` is its accessible name. A menu item shows its
   * `title`, or its `tooltip` when it has no title. Every definition needs a `title` or a `tooltip`.
   */
  title?: string;
  /** Tooltip, and the accessible name of an icon-only button. */
  tooltip?: string;
  /** Icon before the label. A group without one shows `more_vert`. */
  prefixIcon?: string;
  /** Icon after the label. */
  suffixIcon?: string;
  /** Icon set of `prefixIcon` / `suffixIcon`. Defaults to the app icon provider. */
  fontSet?: SdIconSet;
  /**
   * Semantic color, as on `sd-button` (`primary`, `secondary`, `info`, `success`, `warning`, `error`, `black`). Use
   * `'error'` for destructive actions. Unset: `primary` in `selector.actions`, `secondary` in commands; menu items stay
   * neutral. In the compact command drawer it colors the icons only, like on menu items, and unset stays neutral.
   */
  color?: SdButtonColor;
  /**
   * `sd-button` variant: `fill`, `light`, `outline` or `text`. Desktop buttons only: ignored for menu items and in the
   * compact command drawer. Unset: `light` for a flat selector action, `text` for a selector group trigger and for
   * every file / folder command.
   */
  type?: SdButtonType;
  /** Removes the action. A group whose children are all hidden is removed too. */
  hidden?: SdFileExplorerState<T>;
  /** Keeps the action visible but blocks it. */
  disabled?: SdFileExplorerState<T>;
  /** Shows a spinner and blocks the action while your own work runs. A loading menu item is also disabled. */
  loading?: SdFileExplorerState<T>;
}

/** Action that runs a callback: a button next to its siblings, or an item in a group menu. */
export type SdFileExplorerActionLeaf<T> = SdFileExplorerActionAppearance<T> & { children?: never } & (
    | { onClick: (context: T) => void; click?: never }
    | { click: (context: T) => void; onClick?: never }
  );

/** Button that only opens a menu of leaves. Groups are one level deep. */
export interface SdFileExplorerActionGroup<T> extends SdFileExplorerActionAppearance<T> {
  /** Menu items in display order. Leaves only: a group cannot contain another group. */
  children: readonly SdFileExplorerActionLeaf<T>[];
  click?: never;
  onClick?: never;
}

/**
 * One entry of `selector.actions`, `fileCommands` or `folderCommands`: a leaf with `click`, or a group with
 * `children`. Siblings render in the declared order; the explorer never moves them into an overflow menu.
 */
export type SdFileExplorerAction<T> = SdFileExplorerActionLeaf<T> | SdFileExplorerActionGroup<T>;

/** Action on the selected files. `click` receives a frozen snapshot of the selection. */
export type SdFileExplorerSelectionAction<T = unknown> = SdFileExplorerAction<readonly SdFileExplorerItem<T>[]>;

/** Action on one file or folder. `click` receives the item exactly as returned by `list` or `search`. */
export type SdFileExplorerCommand<T = unknown> = SdFileExplorerAction<SdFileExplorerItem<T>>;

/**
 * Multi-file selection of `<sd-file-explorer>`.
 *
 * Only the files visible in the current folder or search results can be selected — never folders, never items of
 * other folders. The selection survives switching between list and grid and opening a file, and is cleared when the
 * folder, the search keyword or `list` changes, or on `reload()`. A file that a refresh drops or that `disabled`
 * starts locking leaves the selection without a callback and is not selected again when it comes back.
 */
export interface SdFileExplorerSelector<T = unknown> {
  /** Allows selection when useful actions or an explicit picker contract exist. @defaultValue `true` */
  visible?: boolean;
  /**
   * `actions` requires at least one visible selection action; `picker` deliberately allows selection without actions.
   * When omitted, existing `onSelect` / `onSelectAll` callbacks retain picker behavior; other selectors use `actions`.
   */
  mode?: 'actions' | 'picker';
  /**
   * Actions on the selected files, shown in the selection band while at least one file is selected. Without `type`,
   * a flat action is `light` and a group trigger `text`; without `color`, both are `primary`.
   * Omitted in action mode: configured move/share/download callbacks provide the default actions. An explicit `[]`
   * suppresses those defaults. Hidden/empty groups do not enable selection; disabled/loading actions still do.
   */
  actions?: readonly SdFileExplorerSelectionAction<T>[];
  /** Files for which it returns `true` show a disabled checkbox and are left out of "select all". */
  disabled?: (item: SdFileExplorerItem<T>) => boolean;
  /** Called after a file checkbox is toggled, with the file and the new selection. */
  onSelect?: (item: SdFileExplorerItem<T>, selectedItems: readonly SdFileExplorerItem<T>[]) => void;
  /** Called once after the select-all checkbox selects every eligible file or deselects them all (`[]`). */
  onSelectAll?: (selectedItems: readonly SdFileExplorerItem<T>[]) => void;
  /** Called once when a non-empty selection is cleared: the band's clear button, or a folder / search / `list` change or `reload()`. */
  onClear?: () => void;
}

/**
 * Configuration of `<sd-file-explorer>`.
 *
 * Only `list` is required. Every other callback is optional and switches its UI on: without `upload` there is
 * no upload button and no drop zone, without `createFolder` there is no "New folder" button, without `download`
 * or `share` there are no download or share buttons. Callbacks may return a value or a `Promise`; a thrown error or a rejected
 * promise is shown as an error state (listing, preview) or a failed transfer (upload, download).
 *
 * The explorer is storage-agnostic: it does not know about HTTP endpoints, presigned URLs or providers.
 * Keep that knowledge inside the callbacks.
 *
 * @example
 * ```ts
 * readonly option: SdFileExplorerOption<T> = {
 *   title: 'My files',
 *   list: ({ parentId, signal }) => firstValueFrom(this.api.children(parentId, { signal })),
 *   search: ({ parentId, keyword }) => firstValueFrom(this.api.search(parentId, keyword)),
 *   preview: ({ item }) => this.api.previewUrl(item.id), // string URL or Blob
 *   download: ({ item, progress, signal }) => this.api.downloadBlob(item.id, progress, signal), // Blob
 *   share: ({ item }) => firstValueFrom(this.api.createShareLink(item.id)), // URL string
 *   upload: ({ file, parentId, progress, signal }) => this.api.upload(file, parentId, progress, signal),
 *   createFolder: ({ parentId, name }) => firstValueFrom(this.api.createFolder(parentId, name)),
 * };
 * ```
 */
export interface SdFileExplorerOption<T = unknown> {
  /** Canonical grouped callbacks; an explicit group wins over its legacy root callback. */
  capabilities?: SdFileExplorerCapabilities<T>;
  /** Opt-in file move; caller performs the storage mutation. */
  move?: {
    movable?: SdFileExplorerState<SdFileExplorerMoveRequest<T>>;
    onMove: (request: SdFileExplorerMoveRequest<T>) => boolean | void | Promise<boolean | void>;
  };
  dataSource?: never;
  /**
   * Returns the direct children (files and folders) of a folder. Required.
   *
   * Called lazily: once per folder when it is first opened or expanded in the tree, then cached until
   * `reload()` or a successful upload / folder creation in that folder. `parentId` is `null` for the root.
   */
  list: (args: SdFileExplorerListArgs) => SdFileExplorerItem<T>[] | Promise<SdFileExplorerItem<T>[]>;
  /**
   * Server-side search inside the current folder. Called 300 ms after the user stops typing, and only for a
   * non-empty keyword; stale requests are aborted and their results ignored.
   *
   * When omitted, the search box filters the already loaded children of the current folder by name
   * (case- and Vietnamese-accent-insensitive) without calling any callback.
   */
  search?: (args: SdFileExplorerSearchArgs) => SdFileExplorerItem<T>[] | Promise<SdFileExplorerItem<T>[]>;
  /**
   * Resolves the content shown in the detail drawer when a file is opened.
   *
   * Images render as `<img>`; PDFs render with `<sd-preview-pdf>` (loaded on demand, so consumers that never
   * preview a PDF do not download PDF.js). Return `null`/`undefined` — or omit the callback — to show the
   * "no preview" fallback. Other formats always show the fallback with a download button.
   */
  preview?: (
    args: SdFileExplorerPreviewArgs<T>
  ) => SdFileExplorerPreviewSource | null | undefined | Promise<SdFileExplorerPreviewSource | null | undefined>;
  /**
   * Downloads a file. Enables the download buttons in list, grid and preview.
   *
   * - Return a `Blob`: the explorer saves it under `item.name`. Call `progress` while fetching to show a percentage.
   * - Return nothing: you handed the download to the browser yourself (for example `window.open(url)` or an
   *   anchor with `download`). The transfer is then marked "handed to the browser" without a fake percentage.
   */
  download?: (args: SdFileExplorerDownloadArgs<T>) => Blob | void | Promise<Blob | void>;
  /**
   * Creates a shareable link for a file and returns its URL. Enables the "Share" buttons (list rows and
   * detail drawer).
   *
   * The explorer opens a dialog that shows the link with a "Copy link" button — copying happens on that
   * explicit click, so it works even when the callback takes a while. Throw (or reject) to show the error
   * `message` with a retry button. Expiry, permissions or audience stay in your API.
   */
  share?: (args: SdFileExplorerShareArgs<T>) => string | Promise<string>;
  /**
   * Uploads one file into `parentId`. Enables the upload button and drag-and-drop.
   *
   * Called once per file, at most 3 files at a time; extra files wait in the queue. After success the
   * destination folder is listed again. Throw (or reject) to mark the transfer as failed — the error `message`
   * is shown as the failure reason and the user can retry.
   */
  upload?: (args: SdFileExplorerUploadArgs) => SdFileExplorerItem<T> | void | Promise<SdFileExplorerItem<T> | void>;
  /**
   * Creates a folder inside the current folder. Enables the "New folder" button.
   * After success the current folder is listed again. Throw (or reject) to keep the dialog open with the error.
   */
  createFolder?: (args: SdFileExplorerCreateFolderArgs) => SdFileExplorerItem<T> | void | Promise<SdFileExplorerItem<T> | void>;
  /** Heading shown in the explorer header. When omitted the header shows only search and upload. */
  title?: string;
  /** Secondary line under `title`. Ignored when `title` is omitted. */
  description?: string;
  /** Label of the root folder in the tree and breadcrumb. Defaults to the translated "All files". */
  rootLabel?: string;
  /** Initial layout of the item area. The user can switch afterwards. @defaultValue `'list'` */
  defaultView?: SdFileExplorerView;
  /**
   * Multi-file selection: checkboxes on files, a select-all checkbox in the list header (above the grid) and a
   * selection band with `selector.actions`. See `SdFileExplorerSelector<T>`.
   */
  selector?: SdFileExplorerSelector<T>;
  /**
   * Actions on one file, in list rows and grid cards — in the compact layout, in the command drawer each row or card
   * opens. Declaring it — even as `[]` — replaces the row download and share shortcuts, in that drawer too; the detail
   * drawer keeps its own Download and Share buttons.
   */
  fileCommands?: readonly SdFileExplorerCommand<T>[];
  /**
   * Actions on one folder, in list rows, grid cards and the folder tree (never on the root) — in the compact layout,
   * in the command drawer each row, card or tree node opens.
   */
  folderCommands?: readonly SdFileExplorerCommand<T>[];
  /** E2E scope. Produces `data-autoid="components-file-explorer-{autoId}"` and derived child ids. */
  autoId?: string;
}

/**
 * Payload of the `(open)` output.
 *
 * Emitted exactly once each time the user opens a file (click, `Enter` or `Space` on a file in the list,
 * grid or search results). Not emitted for folders, which navigate instead, nor when the detail drawer
 * re-renders or reloads.
 */
export interface SdFileExplorerOpenEvent<T = unknown> {
  /** The file that was opened. */
  item: SdFileExplorerItem<T>;
  /** Folders from the root (excluded) down to the folder being viewed when the file was opened. */
  path: readonly SdFileExplorerItem<T>[];
}

/** Direction of a transfer shown in the transfer panel. */
export type SdFileExplorerTransferDirection = 'upload' | 'download';

/**
 * Lifecycle of a transfer.
 *
 * - `queued`: waiting for a free upload slot (at most 3 uploads run at the same time).
 * - `preparing`: the callback is running but has not reported progress yet (for example requesting a signed URL).
 * - `transferring`: the callback reported progress at least once.
 * - `done`: the callback resolved.
 * - `error`: the callback threw or rejected; `error` holds the reason. The user can retry.
 * - `cancelled`: the user cancelled; the `signal` passed to the callback was aborted. The user can retry.
 */
export type SdFileExplorerTransferStatus = 'queued' | 'preparing' | 'transferring' | 'done' | 'error' | 'cancelled';

/** Read-only snapshot of one upload or download, exposed through `SdFileExplorer.transfers`. */
export interface SdFileExplorerTransfer {
  /** Internal id, unique within the explorer instance. */
  readonly id: string;
  /** `'upload'` or `'download'`. */
  readonly direction: SdFileExplorerTransferDirection;
  /** File name shown in the transfer panel. */
  readonly name: string;
  /** Current lifecycle state. */
  readonly status: SdFileExplorerTransferStatus;
  /** Bytes reported by the last `progress` call. */
  readonly loaded?: number;
  /** Total reported by the last `progress` call, when known. */
  readonly total?: number;
  /** 0–100, present only when the callback reported a positive `total`. Absent means indeterminate. */
  readonly percent?: number;
  /** Download finished by handing the file to the browser (the callback returned no `Blob`). */
  readonly handedOff?: boolean;
  /** Reason of the failure when `status` is `'error'`. */
  readonly error?: unknown;
}

/** File-only, consumer-controlled move. Abort is cooperative, not rollback. */
export interface SdFileExplorerMoveRequest<T = unknown> {
  readonly items: readonly SdFileExplorerItem<T>[];
  readonly targetFolder: SdFileExplorerItem<T> | null;
  readonly source: 'drag' | 'menu' | 'keyboard' | 'api';
  readonly signal: AbortSignal;
}
export interface SdFileExplorerCapabilities<T = unknown> {
  share?: { shareable?: SdFileExplorerState<SdFileExplorerItem<T>>; onShare: NonNullable<SdFileExplorerOption<T>['share']> };
  download?: { downloadable?: SdFileExplorerState<SdFileExplorerItem<T>>; onDownload: NonNullable<SdFileExplorerOption<T>['download']> };
  preview?: { previewable?: SdFileExplorerState<SdFileExplorerItem<T>>; onPreview: NonNullable<SdFileExplorerOption<T>['preview']> };
  upload?: { uploadable?: SdFileExplorerState<{ parentId: string | null }>; onUpload: NonNullable<SdFileExplorerOption<T>['upload']> };
  createFolder?: {
    creatable?: SdFileExplorerState<{ parentId: string | null }>;
    onCreateFolder: NonNullable<SdFileExplorerOption<T>['createFolder']>;
  };
}
/** New source-only surface. Legacy source callbacks remain callable on SdFileExplorerOption. */
export interface SdFileExplorerDataSourceOption<T = unknown> extends Omit<SdFileExplorerOption<T>, 'list' | 'search' | 'dataSource'> {
  dataSource: { onList: SdFileExplorerOption<T>['list']; onSearch?: SdFileExplorerOption<T>['search'] };
  list?: never;
  search?: never;
}
export type SdFileExplorerConfig<T = unknown> = SdFileExplorerOption<T> | SdFileExplorerDataSourceOption<T>;
