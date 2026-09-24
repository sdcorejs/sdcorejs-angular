/**
 * Kind of an explorer entry. Folders can be opened and listed; files can be previewed and downloaded.
 */
export type SdFileExplorerItemKind = 'folder' | 'file';

/**
 * One file or folder shown by `<sd-file-explorer>`.
 *
 * The explorer never talks to a storage API itself: every item comes from `SdFileExplorerOption.list`
 * (or `search`), so map your own DTO into this shape inside the callback.
 *
 * @example
 * ```ts
 * const item: SdFileExplorerItem = {
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
export interface SdFileExplorerItem {
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

/** Arguments of `SdFileExplorerOption.list`. */
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

/** Arguments of `SdFileExplorerOption.search`. */
export interface SdFileExplorerSearchArgs {
  /** Folder the user is currently viewing; `null` is the root folder. */
  parentId: string | null;
  /** Trimmed, non-empty keyword typed by the user. */
  keyword: string;
  /** Aborted when a newer keyword supersedes this one, the search is cleared or the user navigates away. */
  signal: AbortSignal;
}

/** Arguments of `SdFileExplorerOption.preview`. */
export interface SdFileExplorerPreviewArgs {
  /** File being previewed. */
  item: SdFileExplorerItem;
  /** Aborted when the detail drawer is closed or another file is opened before this one resolves. */
  signal: AbortSignal;
}

/**
 * Content returned by `SdFileExplorerOption.preview`.
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

/** Arguments of `SdFileExplorerOption.upload`. */
export interface SdFileExplorerUploadArgs extends SdFileExplorerTransferArgs {
  /** File picked through the upload button or dropped onto the explorer. */
  file: File;
  /** Destination folder (the folder being viewed when the upload started); `null` is the root folder. */
  parentId: string | null;
}

/** Arguments of `SdFileExplorerOption.download`. */
export interface SdFileExplorerDownloadArgs extends SdFileExplorerTransferArgs {
  /** File to download. */
  item: SdFileExplorerItem;
}

/** Arguments of `SdFileExplorerOption.share`. */
export interface SdFileExplorerShareArgs {
  /** File to share. */
  item: SdFileExplorerItem;
  /** Aborted when the user closes the share dialog before the link is ready, or the explorer is destroyed. */
  signal: AbortSignal;
}

/** Arguments of `SdFileExplorerOption.createFolder`. */
export interface SdFileExplorerCreateFolderArgs {
  /** Folder that receives the new folder (the folder being viewed); `null` is the root folder. */
  parentId: string | null;
  /** Trimmed, non-empty name typed by the user. */
  name: string;
}

/** Layout of the item area. */
export type SdFileExplorerView = 'list' | 'grid';

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
 * readonly option: SdFileExplorerOption = {
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
export interface SdFileExplorerOption {
  /**
   * Returns the direct children (files and folders) of a folder. Required.
   *
   * Called lazily: once per folder when it is first opened or expanded in the tree, then cached until
   * `reload()` or a successful upload / folder creation in that folder. `parentId` is `null` for the root.
   */
  list: (args: SdFileExplorerListArgs) => SdFileExplorerItem[] | Promise<SdFileExplorerItem[]>;
  /**
   * Server-side search inside the current folder. Called 300 ms after the user stops typing, and only for a
   * non-empty keyword; stale requests are aborted and their results ignored.
   *
   * When omitted, the search box filters the already loaded children of the current folder by name
   * (case- and Vietnamese-accent-insensitive) without calling any callback.
   */
  search?: (args: SdFileExplorerSearchArgs) => SdFileExplorerItem[] | Promise<SdFileExplorerItem[]>;
  /**
   * Resolves the content shown in the detail drawer when a file is opened.
   *
   * Images render as `<img>`; PDFs render with `<sd-preview-pdf>` (loaded on demand, so consumers that never
   * preview a PDF do not download PDF.js). Return `null`/`undefined` — or omit the callback — to show the
   * "no preview" fallback. Other formats always show the fallback with a download button.
   */
  preview?: (
    args: SdFileExplorerPreviewArgs
  ) => SdFileExplorerPreviewSource | null | undefined | Promise<SdFileExplorerPreviewSource | null | undefined>;
  /**
   * Downloads a file. Enables the download buttons in list, grid and preview.
   *
   * - Return a `Blob`: the explorer saves it under `item.name`. Call `progress` while fetching to show a percentage.
   * - Return nothing: you handed the download to the browser yourself (for example `window.open(url)` or an
   *   anchor with `download`). The transfer is then marked "handed to the browser" without a fake percentage.
   */
  download?: (args: SdFileExplorerDownloadArgs) => Blob | void | Promise<Blob | void>;
  /**
   * Creates a shareable link for a file and returns its URL. Enables the "Share" buttons (list rows and
   * detail drawer).
   *
   * The explorer opens a dialog that shows the link with a "Copy link" button — copying happens on that
   * explicit click, so it works even when the callback takes a while. Throw (or reject) to show the error
   * `message` with a retry button. Expiry, permissions or audience stay in your API.
   */
  share?: (args: SdFileExplorerShareArgs) => string | Promise<string>;
  /**
   * Uploads one file into `parentId`. Enables the upload button and drag-and-drop.
   *
   * Called once per file, at most 3 files at a time; extra files wait in the queue. After success the
   * destination folder is listed again. Throw (or reject) to mark the transfer as failed — the error `message`
   * is shown as the failure reason and the user can retry.
   */
  upload?: (args: SdFileExplorerUploadArgs) => SdFileExplorerItem | void | Promise<SdFileExplorerItem | void>;
  /**
   * Creates a folder inside the current folder. Enables the "New folder" button.
   * After success the current folder is listed again. Throw (or reject) to keep the dialog open with the error.
   */
  createFolder?: (args: SdFileExplorerCreateFolderArgs) => SdFileExplorerItem | void | Promise<SdFileExplorerItem | void>;
  /** Heading shown in the explorer header. When omitted the header shows only search and upload. */
  title?: string;
  /** Secondary line under `title`. Ignored when `title` is omitted. */
  description?: string;
  /** Label of the root folder in the tree and breadcrumb. Defaults to the translated "All files". */
  rootLabel?: string;
  /** Initial layout of the item area. The user can switch afterwards. @defaultValue `'list'` */
  defaultView?: SdFileExplorerView;
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
export interface SdFileExplorerOpenEvent {
  /** The file that was opened. */
  item: SdFileExplorerItem;
  /** Folders from the root (excluded) down to the folder being viewed when the file was opened. */
  path: readonly SdFileExplorerItem[];
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
