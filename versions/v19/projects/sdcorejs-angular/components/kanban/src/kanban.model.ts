import { Color } from '@sdcorejs/utils/models';

/** Stable identity; number `1` and string `'1'` are distinct. Never use a row index. */
export type SdKanbanId = string | number;
export type SdKanbanMoveSource = 'drag' | 'menu' | 'keyboard' | 'api';

export interface SdKanbanColumn {
  readonly id: SdKanbanId;
  readonly label: string;
  readonly color?: Color;
  readonly prefixIcon?: string;
  readonly disabled?: boolean;
}

/** One immutable proposed move. Indexes refer to the complete column, including filtered-out cards. */
export interface SdKanbanMoveRequest<T> {
  readonly item: T;
  readonly itemId: SdKanbanId;
  readonly fromColumnId: SdKanbanId;
  readonly toColumnId: SdKanbanId;
  readonly fromIndex: number;
  /** Insertion index after removing the source card from its column. */
  readonly toIndex: number;
  readonly previousItems: readonly T[];
  readonly nextItems: readonly T[];
  readonly source: SdKanbanMoveSource;
  /** Aborted on replacement data/options/columns, locked state, or destruction. */
  readonly signal: AbortSignal;
}

/** Domain mapping and consumer-owned persistence. Replace arrays and options immutably. */
export interface SdKanbanOption<T> {
  readonly getId: (item: T) => SdKanbanId;
  readonly getColumnId: (item: T) => SdKanbanId;
  readonly getTitle: (item: T) => string;
  /** Return a new item preserving its ID; never mutate the supplied item. */
  readonly withColumn: (item: T, columnId: SdKanbanId) => T;
  readonly getSearchText?: (item: T) => string;
  readonly filter?: (item: T) => boolean;
  readonly canMove?: (request: SdKanbanMoveRequest<T>) => boolean;
  /**
   * Omit for local mode. In async mode, resolve `true`/`undefined` to accept or `false` to reject.
   * Rejection/throw keeps the board unchanged and emits `sdMoveError`. No `modelChange`, `sdChange`,
   * or `sdMove` is emitted before acceptance. New input data always wins over a late response.
   * Persist using the stable IDs and full-column indexes, and forward `signal` when supported.
   */
  readonly move?: (request: SdKanbanMoveRequest<T>) => Promise<boolean | void>;
  readonly searchable?: boolean;
  readonly collapsible?: boolean;
}

export interface SdKanbanMoveError<T> {
  readonly request: SdKanbanMoveRequest<T>;
  readonly reason: 'rejected' | 'error';
  readonly error?: unknown;
}

export interface SdKanbanCardTemplateContext<T> {
  readonly $implicit: T;
  readonly item: T;
  readonly column: SdKanbanColumn;
  readonly index: number;
  readonly pending: boolean;
}

export interface SdKanbanColumnTemplateContext {
  readonly $implicit: SdKanbanColumn;
  readonly column: SdKanbanColumn;
  readonly count: number;
  readonly visibleCount: number;
  readonly collapsed: boolean;
}
