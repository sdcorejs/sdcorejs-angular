import { isDevMode, signal } from '@angular/core';
import type { SdKanbanCard, SdKanbanLoadArgs, SdKanbanLoadError, SdKanbanLoadResult, SdKanbanOption } from './kanban.model';

export type KanbanColumnStatus = 'idle' | 'loading' | 'loading-more' | 'error';

/** One column of a board fed by `option.dataSource` (kanban.md §5.2). */
export interface KanbanColumnState<T> {
  readonly cards: readonly SdKanbanCard<T>[];
  readonly nextCursor: string | null;
  /** The server's `total` of the first page; `null` while unknown. */
  readonly total: number | null;
  readonly summary: string | null;
  readonly status: KanbanColumnStatus;
  /** The cursor of the load that failed, so Retry asks for the same page; `null` is the first page. */
  readonly failedCursor: string | null;
  /** `true` once the first page arrived (also after an error of a later page). */
  readonly loaded: boolean;
  /** Grows on every load from `cursor: null`; a move proposed against an older generation is stale. */
  readonly generation: number;
}

const EMPTY: KanbanColumnState<never> = {
  cards: [],
  nextCursor: null,
  total: null,
  summary: null,
  status: 'idle',
  failedCursor: null,
  loaded: false,
  generation: 0,
};

/**
 * Per-column paging for the board's data source: one `AbortController` per column, late results dropped, invalid
 * and duplicate cards left out with a dev-mode warning. Not part of the public API.
 */
export class KanbanColumnLoader<T> {
  readonly #states = signal<ReadonlyMap<string, KanbanColumnState<T>>>(new Map());
  readonly #controllers = new Map<string, AbortController>();
  readonly states = this.#states.asReadonly();

  constructor(
    private readonly onError: (error: SdKanbanLoadError) => void,
    private readonly onLoaded: () => void = () => undefined
  ) {}

  state(columnId: string): KanbanColumnState<T> {
    return this.#states().get(columnId) ?? EMPTY;
  }

  /** Loads the first page; the cards on screen stay until the result arrives (SC-23). */
  load(columnId: string, option: SdKanbanOption<T>, keyword: string): void {
    const current = this.state(columnId);
    this.#patch(columnId, { status: 'loading', failedCursor: null, generation: current.generation + 1 });
    void this.#fetch(columnId, option, keyword, null);
  }

  /** The next page; ignored while loading or when there is none. */
  loadMore(columnId: string, option: SdKanbanOption<T>, keyword: string): void {
    const current = this.state(columnId);
    if (!current.loaded || current.status === 'loading' || current.status === 'loading-more' || current.nextCursor === null) return;
    this.#patch(columnId, { status: 'loading-more', failedCursor: null });
    void this.#fetch(columnId, option, keyword, current.nextCursor);
  }

  /** Asks again for the page that failed. */
  retry(columnId: string, option: SdKanbanOption<T>, keyword: string): void {
    const current = this.state(columnId);
    if (current.status !== 'error') return;
    if (!current.loaded) {
      this.load(columnId, option, keyword);
      return;
    }
    this.#patch(columnId, { status: 'loading-more', failedCursor: null });
    void this.#fetch(columnId, option, keyword, current.failedCursor);
  }

  abort(columnId?: string): void {
    for (const [id, controller] of this.#controllers) {
      if (columnId !== undefined && id !== columnId) continue;
      controller.abort();
      this.#controllers.delete(id);
      const state = this.#states().get(id);
      if (state && (state.status === 'loading' || state.status === 'loading-more')) this.#patch(id, { status: 'idle' });
    }
  }

  /** Forgets columns that left the board. */
  drop(keep: ReadonlySet<string>): void {
    const states = this.#states();
    if ([...states.keys()].every(id => keep.has(id))) return;
    for (const id of states.keys()) if (!keep.has(id)) this.abort(id);
    this.#states.set(new Map([...states].filter(([id]) => keep.has(id))));
  }

  /**
   * An accepted move (§5.2): the card leaves its column (`total` − 1) and goes to the top of the target column, or
   * before `beforeId` when `reorder` is on (after the last loaded card for `null`); `total` + 1. No load.
   */
  applyMove(card: SdKanbanCard<T>, toColumnId: string, beforeId: string | null, reorder: boolean): void {
    const moved: SdKanbanCard<T> = { ...card, columnId: toColumnId };
    const states = new Map(this.#states());
    const from = states.get(card.columnId) ?? EMPTY;
    const sameColumn = card.columnId === toColumnId;
    const rest = from.cards.filter(candidate => candidate.id !== card.id);
    if (!sameColumn) states.set(card.columnId, { ...from, cards: rest, total: from.total === null ? null : from.total - 1 });
    const to = sameColumn ? { ...from, cards: rest } : (states.get(toColumnId) ?? EMPTY);
    let at = 0;
    if (reorder) {
      const before = beforeId === null ? -1 : to.cards.findIndex(candidate => candidate.id === beforeId);
      at = before < 0 ? to.cards.length : before;
    }
    const cards = [...to.cards.slice(0, at), moved, ...to.cards.slice(at)];
    states.set(toColumnId, { ...to, cards, total: sameColumn || to.total === null ? to.total : to.total + 1 });
    this.#states.set(states);
  }

  async #fetch(columnId: string, option: SdKanbanOption<T>, keyword: string, cursor: string | null): Promise<void> {
    this.#controllers.get(columnId)?.abort();
    const controller = new AbortController();
    this.#controllers.set(columnId, controller);
    const args: SdKanbanLoadArgs = Object.freeze({
      columnId,
      cursor,
      pageSize: option.pageSize ?? 20,
      keyword: keyword.trim(),
      signal: controller.signal,
    });
    let result: SdKanbanLoadResult<T>;
    try {
      result = await option.dataSource!.onLoad(args);
    } catch (error) {
      if (controller.signal.aborted) return;
      this.#controllers.delete(columnId);
      const first = cursor === null;
      this.#patch(columnId, { status: 'error', failedCursor: cursor, ...(first ? { cards: [], loaded: false, total: null } : {}) });
      this.onError({ columnId, error });
      return;
    }
    if (controller.signal.aborted) return;
    this.#controllers.delete(columnId);
    const first = cursor === null;
    const before = first ? [] : this.state(columnId).cards;
    const seen = new Set<string>();
    for (const [id, state] of this.#states()) if (id !== columnId) for (const card of state.cards) seen.add(card.id);
    for (const card of before) seen.add(card.id);
    const accepted: SdKanbanCard<T>[] = [];
    for (const card of result.items ?? []) {
      if (card.columnId !== columnId || typeof card.title !== 'string' || !card.title.trim() || !card.id) {
        this.#warn(`dropped a card of column "${columnId}" with another columnId, no id or an empty title`);
        continue;
      }
      if (seen.has(card.id)) {
        this.#warn(`dropped a second card with id "${card.id}"`);
        continue;
      }
      seen.add(card.id);
      accepted.push(card);
    }
    const current = this.state(columnId);
    this.#patch(columnId, {
      cards: [...before, ...accepted],
      nextCursor: result.nextCursor ?? null,
      status: 'idle',
      failedCursor: null,
      loaded: true,
      ...(first ? { total: typeof result.total === 'number' ? result.total : null, summary: result.summary ?? null } : {}),
      generation: current.generation,
    });
    this.onLoaded();
  }

  #patch(columnId: string, patch: Partial<KanbanColumnState<T>>): void {
    const states = new Map(this.#states());
    states.set(columnId, { ...(states.get(columnId) ?? EMPTY), ...patch });
    this.#states.set(states);
  }

  #warn(message: string): void {
    if (isDevMode()) console.warn(`[sd-kanban] dataSource: ${message}.`);
  }
}
