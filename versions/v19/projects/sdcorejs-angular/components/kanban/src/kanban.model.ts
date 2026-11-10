import { Color } from '@sdcorejs/utils/models';

export type SdKanbanMoveSource = 'drag' | 'menu' | 'keyboard' | 'api';

/** A flag, or a predicate evaluated when rendering and again right before the callback (SC-05, SC-06). */
export type SdKanbanState<C> = boolean | ((context: C) => boolean);

export interface SdKanbanColumn {
  readonly id: string;
  readonly label: string;
  readonly color?: Color;
  readonly prefixIcon?: string;
  readonly disabled?: boolean;
  /** Second line under the label ("18,4 triệu ₫"). With a data source, `SdKanbanLoadResult.summary` wins. */
  readonly summary?: string;
}

export interface SdKanbanCard<T = unknown> {
  /** Unique on the whole board. */
  readonly id: string;
  /** The id of one of the `columns`. */
  readonly columnId: string;
  /** Not empty; the name screen readers read and the label of the card's name button. */
  readonly title: string;
  /** Text matched by the board search when there is no data source. Defaults to `title`. */
  readonly searchText?: string;
  /** The consumer's DTO; the board never reads it and keeps the same reference (SC-02). */
  readonly data?: T;
}

export interface SdKanbanLoadArgs {
  readonly columnId: string;
  /** `null` for the first page and after `reload()`. */
  readonly cursor: string | null;
  readonly pageSize: number;
  /** The trimmed keyword; `''` when not searching. */
  readonly keyword: string;
  readonly signal: AbortSignal;
}

export interface SdKanbanLoadResult<T = unknown> {
  /** Every card's `columnId` must equal `args.columnId`. */
  readonly items: readonly SdKanbanCard<T>[];
  /** `null` when there are no more pages. */
  readonly nextCursor: string | null;
  /** Cards of the column for the keyword and the server's filters. Read from the first page only. */
  readonly total?: number;
  /** Replaces `column.summary`. Read from the first page only. */
  readonly summary?: string;
}

export interface SdKanbanDropContext<T = unknown> {
  readonly card: SdKanbanCard<T>;
  readonly from: SdKanbanColumn;
  readonly to: SdKanbanColumn;
}

export interface SdKanbanMoveRequest<T = unknown> {
  readonly card: SdKanbanCard<T>;
  /** `index` in the loaded cards of the source column. */
  readonly from: { readonly columnId: string; readonly index: number };
  /**
   * `reorder` off: `index` and `beforeId` are `null`. `reorder` on: `index` in the loaded cards of the target column
   * without the moved card; `beforeId` is the card right after the drop point, `null` after the last loaded card (the
   * end of the column; when pages are not loaded yet, the server decides where the card goes).
   */
  readonly to: { readonly columnId: string; readonly index: number | null; readonly beforeId: string | null };
  readonly source: SdKanbanMoveSource;
  /** Aborted when the data, the option or the columns are replaced, the board locks, or it is destroyed. */
  readonly signal: AbortSignal;
}

export interface SdKanbanMoveError<T = unknown> {
  readonly request: SdKanbanMoveRequest<T>;
  readonly reason: 'rejected' | 'error';
  readonly error?: unknown;
}

export interface SdKanbanLoadError {
  readonly columnId: string;
  readonly error: unknown;
}

export interface SdKanbanOption<T = unknown> {
  dataSource?: {
    onLoad: (args: SdKanbanLoadArgs) => SdKanbanLoadResult<T> | Promise<SdKanbanLoadResult<T>>;
  };
  /** Cards per page with a data source. Default 20. */
  pageSize?: number;
  /** Default `'button'`. */
  loadMore?: 'button' | 'auto';
  /** Leave out to have no dragging, no move menu and no Alt + arrow moves. */
  move?: {
    /** Default `true`. */
    movable?: SdKanbanState<SdKanbanCard<T>>;
    /** Default `true`. Synchronous; runs when a drag starts, when the menu opens, on Alt + arrow and right before `onMove`. */
    droppable?: SdKanbanState<SdKanbanDropContext<T>>;
    /** Default `false`: cards only change column. */
    reorder?: boolean;
    /**
     * `true` or `void`: accepted. `false`: rejected (failure on the card, `sdMoveError`).
     * `'cancel'`: the user cancelled in the consumer's own flow (closed a reason dialog): back in place, no failure.
     * A throw or a rejected promise: error.
     */
    onMove: (request: SdKanbanMoveRequest<T>) => boolean | 'cancel' | void | Promise<boolean | 'cancel' | void>;
  };
}

export interface SdKanbanCardTemplateContext<T> {
  readonly $implicit: SdKanbanCard<T>;
  readonly card: SdKanbanCard<T>;
  readonly column: SdKanbanColumn;
  readonly index: number;
  readonly pending: boolean;
  readonly selected: boolean;
}

export interface SdKanbanColumnTemplateContext {
  readonly $implicit: SdKanbanColumn;
  readonly column: SdKanbanColumn;
  /** The server's `total`, or the column's cards in `items`. `null` while unknown (first load, error). */
  readonly total: number | null;
  /** Cards on screen (after the keyword in `items` mode). */
  readonly visibleCount: number;
  readonly summary: string | null;
  readonly collapsed: boolean;
}
