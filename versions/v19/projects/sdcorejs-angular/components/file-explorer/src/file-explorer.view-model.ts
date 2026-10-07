import type { SdButtonColor } from '@sdcorejs/angular/components/button';
import type { SdIconSet } from '@sdcorejs/angular/modules/icon';
import type { SdFileExplorerIconName } from './file-explorer-icons.generated';
import type {
  SdFileExplorerActionGroup,
  SdFileExplorerActionLeaf,
  SdFileExplorerItem,
  SdFileExplorerTransfer,
} from './file-explorer.model';
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
  /** Accessible name of the selection checkbox of a file. */
  readonly selectLabel: string;
  /** Accessible name of the compact trigger that opens the item's command drawer. */
  readonly actionsLabel: string;
  readonly autoId?: string;
}

/** Compact trigger of one item: shown when its command drawer would list something. */
export interface SdFileExplorerCommandMenu {
  /** An entry, or an item of one of its groups, is loading. */
  readonly busy: boolean;
}

/** Command of the compact command drawer, with its states evaluated for the drawer's item. */
export interface SdFileExplorerSheetCommand {
  readonly kind: 'leaf';
  /** Declared index (`share` / `download` for the row shortcuts): tracks the entry and suffixes its autoId. */
  readonly key: string;
  /** The title, or the tooltip of a definition without title. */
  readonly label: string;
  readonly prefixIcon: string | undefined;
  readonly suffixIcon: string | undefined;
  readonly fontSet: SdIconSet | undefined;
  /** Declared color. It paints the icons only; unset keeps them neutral, like Core menu items. */
  readonly color: SdButtonColor | undefined;
  /** Disabled, loading, or inside a disabled or loading group. */
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly definition: SdFileExplorerActionLeaf<SdFileExplorerItem>;
}

/**
 * Group of the compact command drawer: a section listing its visible children under a text-only heading. The heading is
 * not a control, so it carries no icon or color: the group's `prefixIcon` (often the icon of one of its children) and
 * the desktop `more_vert` face stay on the desktop trigger.
 */
export interface SdFileExplorerSheetGroup {
  readonly kind: 'group';
  readonly key: string;
  readonly label: string;
  readonly disabled: boolean;
  readonly loading: boolean;
  readonly definition: SdFileExplorerActionGroup<SdFileExplorerItem>;
  /** Never empty. */
  readonly children: readonly SdFileExplorerSheetCommand[];
}

export type SdFileExplorerSheetEntry = SdFileExplorerSheetCommand | SdFileExplorerSheetGroup;

/** Content of the compact command drawer for one item. */
export interface SdFileExplorerCommandSheetView {
  /** Full item name: the drawer title, wrapped rather than cut. */
  readonly title: string;
  /** Type and size of the item, under the title. */
  readonly context: string;
  readonly icon: SdFileExplorerIconName;
  /** Never empty. */
  readonly entries: readonly SdFileExplorerSheetEntry[];
}

/** Selection handed to the item list while the selector is on and the current view holds files. */
export interface SdFileExplorerSelectionView {
  readonly selectedIds: ReadonlySet<string>;
  /** Files whose checkbox `selector.disabled` locks. */
  readonly disabledIds: ReadonlySet<string>;
  /** Select-all checkbox: none (unchecked), some (mixed) or all eligible files are selected. */
  readonly state: 'none' | 'some' | 'all';
  /** Visible files that can be selected. */
  readonly eligibleCount: number;
  /** Accessible name and tooltip of the select-all checkbox. */
  readonly allLabel: string;
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
  | { readonly status: 'video'; readonly source: string | Blob }
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
