import type { SdFileExplorerIconName } from './file-explorer-icons.generated';
import type { SdFileExplorerItem, SdFileExplorerTransfer } from './file-explorer.model';
import type { SdFileExplorerFileType } from './file-explorer.utils';

// View models passed from `SdFileExplorer` to its internal presentational children.
// Not exported from the entry point: consumers only see `SdFileExplorerOption` / `SdFileExplorerItem`.

/** One visible row of the folder tree (the tree is rendered flat, depth carried by `level`). */
export interface SdFileExplorerTreeNode {
  /** Unique key: `root` for the root folder, `f:<id>` for folders. */
  readonly key: string;
  /** Folder id; `null` for the root. */
  readonly id: string | null;
  /** Folder item; `null` for the root. */
  readonly item: SdFileExplorerItem | null;
  readonly name: string;
  /** 1-based depth, rendered as `aria-level`. The root is level 1. */
  readonly level: number;
  readonly expandable: boolean;
  readonly expanded: boolean;
  /** Listing state of the folder's children, only meaningful while expanded. */
  readonly status: 'idle' | 'loading' | 'error';
  readonly selected: boolean;
  readonly autoId?: string;
}

/** One item of the list / grid, with every display string already formatted. */
export interface SdFileExplorerItemView {
  readonly item: SdFileExplorerItem;
  readonly type: SdFileExplorerFileType;
  /** Built-in glyph resolved from the extension / MIME type. */
  readonly icon: SdFileExplorerIconName;
  readonly typeLabel: string;
  readonly sizeLabel: string;
  readonly modifiedLabel: string;
  readonly modifiedTitle: string;
  readonly downloadLabel: string;
  readonly shareLabel: string;
  readonly autoId?: string;
}

/** One card of the transfer panel. */
export interface SdFileExplorerTransferView {
  readonly transfer: SdFileExplorerTransfer;
  readonly statusLabel: string;
  /** `determinate` shows `percent`; `indeterminate` animates; `full` fills the bar (finished). */
  readonly progress: 'determinate' | 'indeterminate' | 'full' | 'none';
  readonly percent: number;
  readonly tone: 'active' | 'success' | 'error' | 'muted';
  readonly canCancel: boolean;
  readonly canRetry: boolean;
  readonly canDismiss: boolean;
  readonly cancelLabel: string;
  readonly retryLabel: string;
  readonly dismissLabel: string;
  readonly directionLabel: string;
  /** Failure reason shown under the bar; empty unless `status` is `error`. */
  readonly errorMessage: string;
  readonly autoId?: string;
}

/** What the detail drawer currently renders. */
export type SdFileExplorerPreviewState =
  | { readonly status: 'idle' }
  | { readonly status: 'loading' }
  | { readonly status: 'image'; readonly url: string }
  | { readonly status: 'pdf'; readonly source: string | Blob }
  | { readonly status: 'unavailable' }
  | { readonly status: 'error'; readonly message: string };

/** What the item area shows. */
export type SdFileExplorerContentState = 'loading' | 'error' | 'empty' | 'items';

/** Result of the last copy attempt in the share dialog: copied, or selected for a manual Ctrl+C. */
export type SdFileExplorerShareFeedback = '' | 'copied' | 'manual';

/** State of the share dialog. */
export type SdFileExplorerShareState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly url: string }
  | { readonly status: 'error'; readonly message: string };

/** Metadata row of the detail drawer. */
export interface SdFileExplorerMetaRow {
  readonly label: string;
  readonly value: string;
}
