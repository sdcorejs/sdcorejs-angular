import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  isDevMode,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { ɵSdSearchField, ɵSdSearchFieldInputDirective } from '@sdcorejs/angular/forms/directives';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import {
  SdKanbanCard,
  SdKanbanCardTemplateContext,
  SdKanbanColumn,
  SdKanbanColumnTemplateContext,
  SdKanbanDropContext,
  SdKanbanLoadError,
  SdKanbanMoveError,
  SdKanbanMoveRequest,
  SdKanbanMoveSource,
  SdKanbanOption,
  SdKanbanState,
} from './kanban.model';
import {
  SdKanbanCardActionsTemplateDirective,
  SdKanbanCardTemplateDirective,
  SdKanbanColumnActionsTemplateDirective,
  SdKanbanColumnTemplateDirective,
} from './kanban.templates';
import {
  kanbanApplyMove,
  kanbanDataInvalid,
  kanbanDropTarget,
  kanbanNextColumn,
  kanbanResolveMove,
  kanbanStepTarget,
} from './kanban.utils';

interface CardView<T> {
  readonly card: SdKanbanCard<T>;
  /** Index in the loaded cards of its column (before the keyword). */
  readonly index: number;
  /** `beforeId` of one step up / down in the loaded cards; `undefined` at the edge. */
  readonly up: string | null | undefined;
  readonly down: string | null | undefined;
}
interface ColumnView<T> {
  readonly column: SdKanbanColumn;
  readonly cards: readonly CardView<T>[];
  readonly count: number;
}
interface MoveOperation<T> {
  readonly request: SdKanbanMoveRequest<T>;
  readonly controller: AbortController;
  readonly option: SdKanbanOption<T>;
  readonly columns: readonly SdKanbanColumn[];
  /** The `items` reference the move was proposed against; a new one cancels it. */
  readonly items: readonly SdKanbanCard<T>[] | undefined;
  readonly focus?: MoveFocus;
}
interface MoveFocus {
  readonly origin: Element | null;
  readonly menuTrigger?: HTMLButtonElement;
  readonly stop: () => void;
  abandoned: boolean;
  scheduled: boolean;
}
interface MoveTarget {
  readonly columnId: string;
  readonly beforeId?: string | null;
}

/** A flag of `option.move` (SC-05); left out means allowed. */
function allows<C>(state: SdKanbanState<C> | undefined, context: C): boolean {
  return state === undefined ? true : typeof state === 'function' ? state(context) : state;
}

/** Generic board of cards in columns, with one consumer-confirmed, serial move pipeline. */
@Component({
  selector: 'sd-kanban',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    DragDropModule,
    MatMenuModule,
    SdIcon,
    SdDataState,
    SdTranslatePipe,
    ɵSdSearchField,
    ɵSdSearchFieldInputDirective,
  ],
  templateUrl: './kanban.component.html',
  styleUrl: './kanban.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdKanban<T = unknown> {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #injector = inject(Injector);
  readonly #i18n = inject(I18nService);
  readonly id = `sd-kanban-${Utilities.generateUuid()}`;
  #operation?: MoveOperation<T>;
  readonly #moveFocus = new Set<MoveFocus>();
  #destroyed = false;
  readonly columns = input.required<readonly SdKanbanColumn[]>();
  readonly option = input.required<SdKanbanOption<T>>();
  /** Cards already on the client. Ignored when `option.dataSource` is set. */
  readonly items = input<readonly SdKanbanCard<T>[] | undefined>(undefined);
  readonly keyword = model('');
  /** Shows the board search; `keyword` works without it (the consumer's own search box). */
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly collapsible = input(true, { transform: booleanAttribute });
  readonly collapsedColumns = model<readonly string[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly ariaLabel = input<string | null | undefined>();
  readonly autoId = input<string | null | undefined>();
  /** Id of the selected card; back to `null` when that card is no longer in the data (SC-26, SC-27). */
  readonly selectedId = model<string | null>(null);
  /** Click, tap, Enter or Space on a card; also sets `selectedId`. */
  readonly sdSelect = output<SdKanbanCard<T>>();
  readonly sdMove = output<SdKanbanMoveRequest<T>>();
  /** `option.dataSource.onLoad` threw or rejected, for the first page or a later one; never for an aborted load. */
  readonly sdLoadError = output<SdKanbanLoadError>();
  readonly sdMoveError = output<SdKanbanMoveError<T>>();
  readonly #pending = signal<string | null>(null);
  /** Id of the card whose move waits for `onMove`; read-only. */
  readonly pendingId = this.#pending.asReadonly();
  protected readonly cardTemplate = contentChild(SdKanbanCardTemplateDirective<T>);
  protected readonly cardActionsTemplate = contentChild(SdKanbanCardActionsTemplateDirective<T>);
  protected readonly columnTemplate = contentChild(SdKanbanColumnTemplateDirective);
  protected readonly columnActionsTemplate = contentChild(SdKanbanColumnActionsTemplateDirective);
  protected readonly announcement = signal('');
  /** The card being dragged, from `cdkDragStarted` to `cdkDragEnded`. */
  protected readonly draggingId = signal<string | null>(null);
  /** Height of the dragged card, for the mark of its old place while `reorder` is off. */
  protected readonly originHeight = signal(0);
  /** Height of the card under the last press; the CDK takes the card out of the lane before `cdkDragStarted`. */
  #pressHeight = 0;
  /** A drag just ended: a click the browser may send to the card for its mouseup must not select (kanban.md §7.2). */
  #justDragged = false;
  #warnedTemplate = false;
  /** §7.2: a touch has to hold 400ms before a drag, so a tap selects and a swipe scrolls the board. */
  protected readonly dragStartDelay = { touch: 400, mouse: 0 };
  /** Columns `droppable` refuses for the card being dragged, worked out once when the drag starts (kanban.md §7.2). */
  readonly #blocked = signal<ReadonlySet<string>>(new Set());
  protected readonly reorder = computed(() => !!this.option().move?.reorder);
  protected readonly hasMove = computed(() => !!this.option().move);
  protected readonly moveFailure = signal<string | undefined>(undefined);
  /** Card the current failure belongs to; `null` for failures without a card (invalid configuration). */
  protected readonly failedId = signal<string | null>(null);
  /** The board's copy of `items`, changed by accepted moves; every new `items` reference replaces it (R1-B-01). */
  protected readonly cards = linkedSignal<readonly SdKanbanCard<T>[]>(() => this.items() ?? []);
  protected readonly dataInvalid = computed(() => kanbanDataInvalid(this.cards(), this.columns()));
  protected readonly locked = computed(() => this.disabled() || this.readonly() || this.dataInvalid());
  protected readonly moveBlocked = computed(() => this.locked() || this.pendingId() !== null || !this.option().move);
  protected readonly boardLabel = computed(() => this.ariaLabel() || this.#i18n.t('core.component.kanban.label'));
  protected readonly boardColumns = computed<readonly ColumnView<T>[]>(() => {
    if (this.dataInvalid()) return [];
    const locale = this.#i18n.locale();
    const keyword = this.keyword().trim().toLocaleLowerCase(locale);
    const cards = this.cards();
    return this.columns().map(column => {
      const all = cards.filter(card => card.columnId === column.id);
      const views = all
        .map((card, index) => ({
          card,
          index,
          up: index > 0 ? all[index - 1].id : undefined,
          down: index < all.length - 1 ? (all[index + 2]?.id ?? null) : undefined,
        }))
        .filter(view => !keyword || (view.card.searchText ?? view.card.title).toLocaleLowerCase(locale).includes(keyword));
      return { column, cards: views, count: all.length };
    });
  });
  // Pending/failure feedback is shown on the affected card; board-level text is only a fallback
  // when that card is not rendered (filtered out, collapsed, removed, or no card at all).
  protected readonly pendingAnchored = computed(() => this.#rendered(this.pendingId()));
  protected readonly failureAnchored = computed(() => !!this.moveFailure() && this.#rendered(this.failedId()));
  protected readonly enterPredicate = (_drag: CdkDrag<CardView<T>>, drop: CdkDropList<ColumnView<T>>): boolean =>
    !this.moveBlocked() && !drop.data.column.disabled && !this.collapsed(drop.data.column.id) && !this.#blocked().has(drop.data.column.id);

  constructor() {
    effect(() => {
      const items = this.items();
      const option = this.option();
      const columns = this.columns();
      const locked = this.locked();
      untracked(() => {
        const operation = this.#operation;
        if (operation && (items !== operation.items || option !== operation.option || columns !== operation.columns || locked)) {
          this.#cancel();
        }
      });
    });
    // SC-27: the selected card left the data.
    effect(() => {
      const id = this.selectedId();
      if (id !== null && !this.cards().some(card => card.id === id)) untracked(() => this.selectedId.set(null));
    });
    // §9: the card template renders inside the name button, so it must not hold controls; checked once in dev mode.
    effect(() => {
      this.boardColumns();
      if (!this.cardTemplate() || this.#warnedTemplate || !isDevMode()) return;
      afterNextRender(() => this.#checkCardTemplate(), { injector: this.#injector });
    });
    inject(DestroyRef).onDestroy(() => {
      this.#destroyed = true;
      this.#cancel();
      for (const focus of this.#moveFocus) this.#releaseFocus(focus);
    });
  }

  /** Loads the first page of one column, or of every loaded column, again (data source only). */
  reload(_columnId?: string): void {
    // RED skeleton of checkpoint 4.
  }

  /** Loads the next page of a column (data source only); ignored while it loads or at the end. */
  loadMore(_columnId: string): void {
    // RED skeleton of checkpoint 4.
  }

  /**
   * Runs the move pipeline: `to.beforeId` is the card the moved card goes before (`null` or left out: the end of the
   * column). Resolves `true` only when `option.move.onMove` accepts.
   */
  move(cardId: string, to: MoveTarget, source: SdKanbanMoveSource = 'api'): Promise<boolean> {
    return this.#move(cardId, to, source);
  }

  async #move(cardId: string, to: MoveTarget, source: SdKanbanMoveSource, menuTrigger?: HTMLButtonElement): Promise<boolean> {
    if (this.#destroyed || this.moveBlocked()) return false;
    const option = this.option();
    const move = option.move!;
    const columns = this.columns();
    const cards = this.cards();
    const card = cards.find(candidate => candidate.id === cardId);
    const target = columns.find(column => column.id === to.columnId);
    const origin = card && columns.find(column => column.id === card.columnId);
    if (!card || !target || target.disabled || !origin || origin.disabled) return false;
    // SC-06, SC-08: both flags are evaluated again right before onMove, whatever the render showed.
    // droppable is about changing column; a move inside one column only needs movable (PD, R1).
    if (!allows(move.movable, card)) return false;
    if (target.id !== origin.id && !allows(move.droppable, { card, from: origin, to: target })) return false;
    const reorder = !!move.reorder;
    const placement = kanbanResolveMove(cards, cardId, to, reorder);
    if (!placement) return false;
    const controller = new AbortController();
    const request: SdKanbanMoveRequest<T> = Object.freeze({
      card,
      from: Object.freeze({ columnId: card.columnId, index: placement.fromIndex }),
      to: Object.freeze({ columnId: target.id, index: placement.index, beforeId: placement.beforeId }),
      source,
      signal: controller.signal,
    });
    const operation: MoveOperation<T> = {
      request,
      controller,
      option,
      columns,
      items: this.items(),
      focus: this.#trackFocus(cardId, menuTrigger),
    };
    this.#operation = operation;
    this.#pending.set(cardId);
    this.moveFailure.set(undefined);
    this.failedId.set(null);
    this.announcement.set(this.#i18n.t('core.component.kanban.pending', { title: card.title }));
    try {
      const accepted = await move.onMove(request);
      if (!this.#current(operation)) return false;
      if (accepted === 'cancel') {
        // SC-12: the user cancelled in the consumer's flow; back in place without a failure, focus like a rejection.
        this.#operation = undefined;
        this.#pending.set(null);
        this.announcement.set(this.#i18n.t('core.component.kanban.cancelled', { title: card.title }));
        this.#focusCard(cardId, operation.focus);
        return false;
      }
      if (accepted === false) {
        this.#fail(request, 'rejected');
        this.#focusCard(cardId, operation.focus);
        return false;
      }
      this.#operation = undefined;
      this.#pending.set(null);
      if (this.collapsed(target.id)) this.collapsedColumns.update(ids => ids.filter(id => id !== target.id));
      const next = kanbanApplyMove(cards, cardId, { columnId: target.id, beforeId: placement.beforeId }, reorder);
      this.cards.set(next);
      this.sdMove.emit(request);
      this.announcement.set(
        this.#i18n.t('core.component.kanban.moved', {
          title: card.title,
          column: target.label,
          position: next.filter(candidate => candidate.columnId === target.id).findIndex(candidate => candidate.id === cardId) + 1,
        })
      );
      this.#focusCard(cardId, operation.focus);
      return true;
    } catch (error) {
      if (this.#current(operation)) {
        this.#fail(request, 'error', error);
        this.#focusCard(cardId, operation.focus);
      }
      return false;
    } finally {
      if (this.#operation === operation) {
        this.#operation = undefined;
        this.#pending.set(null);
      }
      if (operation.focus && !operation.focus.scheduled) this.#releaseFocus(operation.focus);
    }
  }

  protected drop(event: CdkDragDrop<ColumnView<T>, ColumnView<T>, CardView<T>>): void {
    if (!event.isPointerOverContainer) {
      this.#announceBlockedDrop(event.dropPoint);
      return;
    }
    if (this.moveBlocked()) return;
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) return;
    const card = event.item.data.card;
    const view = event.container.data;
    const loaded = this.cards().filter(candidate => candidate.columnId === view.column.id);
    const { beforeId } = kanbanDropTarget(
      loaded,
      view.cards.map(candidate => candidate.card),
      card.id,
      event.currentIndex
    );
    void this.#move(card.id, { columnId: view.column.id, beforeId }, 'drag');
  }

  protected dragStarted(view: CardView<T>, column: ColumnView<T>, element: HTMLElement): void {
    const blocked = new Set<string>();
    for (const target of this.columns()) {
      if (target.id !== column.column.id && !this.canDrop(view, column, target)) blocked.add(target.id);
    }
    this.#blocked.set(blocked);
    this.originHeight.set(this.#pressHeight || element.getBoundingClientRect().height);
    this.draggingId.set(view.card.id);
  }

  /** Records the card's height while it is still in its lane (R1-B-03); a new press may select again. */
  protected notePress(element: HTMLElement): void {
    this.#pressHeight = element.getBoundingClientRect().height;
    this.#justDragged = false;
  }

  /** Click, tap, Enter or Space on a card's name (SC-26); a click the browser sends after a drag is ignored. */
  protected select(card: SdKanbanCard<T>, event?: MouseEvent): void {
    if (this.disabled()) return;
    if (event && event.detail > 0 && this.#justDragged) {
      this.#justDragged = false;
      return;
    }
    this.selectedId.set(card.id);
    this.sdSelect.emit(card);
    this.announcement.set(this.#i18n.t('core.component.kanban.selected', { title: card.title }));
  }

  /** Keys on a card's name (§7.4): Enter and Space select, Esc clears the selection, Alt + arrows move. */
  protected cardKeydown(event: KeyboardEvent, view: CardView<T>, column: ColumnView<T>): void {
    const modified = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
    if ((event.key === 'Enter' || event.key === ' ') && !modified) {
      event.preventDefault();
      this.select(view.card);
      return;
    }
    if (event.key === 'Escape' && !modified) {
      if (this.selectedId() === null) return;
      event.preventDefault();
      this.selectedId.set(null);
      return;
    }
    this.keydown(event, view, column);
  }

  protected dragEnded(): void {
    this.#justDragged = true;
    this.#blocked.set(new Set());
    this.draggingId.set(null);
  }

  protected isBlocked(columnId: string): boolean {
    return this.#blocked().has(columnId);
  }

  /** `option.move.movable` at every render (SC-06); `#move` evaluates it again right before `onMove`. */
  protected isMovable(card: SdKanbanCard<T>): boolean {
    const move = this.option().move;
    return !!move && allows(move.movable, card);
  }

  /** `option.move.droppable` for the menu, Alt + arrow and the start of a drag (SC-08). */
  protected canDrop(view: CardView<T>, from: ColumnView<T>, to: SdKanbanColumn): boolean {
    const context: SdKanbanDropContext<T> = { card: view.card, from: from.column, to };
    return allows(this.option().move?.droppable, context);
  }

  protected moveFromMenu(cardId: string, to: MoveTarget, trigger: HTMLButtonElement): void {
    void this.#move(cardId, to, 'menu', trigger);
  }

  protected keydown(event: KeyboardEvent, view: CardView<T>, column: ColumnView<T>): void {
    if (this.moveBlocked() || column.column.disabled || !this.isMovable(view.card) || !event.altKey || event.ctrlKey || event.metaKey)
      return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    // §7.4: Alt + Up / Down only reorders; with reorder off the keys are left to the page.
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !this.reorder()) return;
    event.preventDefault();
    event.stopPropagation();
    const cardId = view.card.id;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const beforeId = kanbanStepTarget(this.cards(), cardId, event.key === 'ArrowUp' ? -1 : 1);
      if (beforeId !== undefined) void this.move(cardId, { columnId: column.column.id, beforeId }, 'keyboard');
      return;
    }
    const rtl = getComputedStyle(this.#host.nativeElement).direction === 'rtl';
    const target = kanbanNextColumn(
      this.columns(),
      column.column.id,
      event.key as 'ArrowLeft' | 'ArrowRight',
      rtl,
      candidate => this.collapsed(candidate.id) || !this.canDrop(view, column, candidate)
    );
    if (target) void this.move(cardId, { columnId: target.id }, 'keyboard');
  }

  protected collapsed(id: string): boolean {
    return this.collapsedColumns().includes(id);
  }
  protected toggleColumn(id: string): void {
    if (this.disabled() || !this.collapsible()) return;
    this.collapsedColumns.update(ids => (ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id]));
  }
  protected columnContext(view: ColumnView<T>): SdKanbanColumnTemplateContext {
    return {
      $implicit: view.column,
      column: view.column,
      total: view.count,
      visibleCount: view.cards.length,
      summary: view.column.summary ?? null,
      collapsed: this.collapsed(view.column.id),
    };
  }
  protected cardContext(view: CardView<T>, column: ColumnView<T>): SdKanbanCardTemplateContext<T> {
    return {
      $implicit: view.card,
      card: view.card,
      column: column.column,
      index: view.index,
      pending: this.pendingId() === view.card.id,
      selected: this.selectedId() === view.card.id,
    };
  }
  protected token(id: string): string {
    return encodeURIComponent(id);
  }
  protected updateKeyword(event: Event): void {
    this.keyword.set((event.target as HTMLInputElement).value);
  }
  /** Dismisses the failure; from a card's own Dismiss button the focus goes back to that card. */
  protected dismissFailure(cardId?: string): void {
    this.moveFailure.set(undefined);
    this.failedId.set(null);
    if (cardId === undefined) return;
    Array.from(this.#host.nativeElement.querySelectorAll<HTMLButtonElement>('[data-kanban-card-main]'))
      .find(button => button.getAttribute('data-kanban-card-main') === this.token(cardId))
      ?.focus();
  }

  /** §11: a drop on a lane `droppable` refuses reads `drop-blocked`. */
  #announceBlockedDrop(point: { readonly x: number; readonly y: number }): void {
    const element = this.#host.nativeElement.ownerDocument.elementFromPoint(point.x, point.y);
    const id = element?.closest<HTMLElement>('[data-column-id]')?.dataset['columnId'];
    const column = id ? this.columns().find(candidate => this.token(candidate.id) === id) : undefined;
    if (column && this.#blocked().has(column.id)) {
      this.announcement.set(this.#i18n.t('core.component.kanban.drop-blocked', { column: column.label }));
    }
  }

  #checkCardTemplate(): void {
    if (this.#warnedTemplate) return;
    const control = this.#host.nativeElement.querySelector(
      '.sd-kanban__card-main :is(button, a[href], input, select, textarea, [tabindex])'
    );
    if (!control) return;
    this.#warnedTemplate = true;
    console.warn(
      '[sd-kanban] sdKanbanCardTemplate renders inside the card name button; put buttons, links and fields in sdKanbanCardActionsTemplate.'
    );
  }

  #rendered(id: string | null): boolean {
    return id !== null && this.boardColumns().some(view => !this.collapsed(view.column.id) && view.cards.some(card => card.card.id === id));
  }
  #current(operation: MoveOperation<T>): boolean {
    const current =
      !this.#destroyed &&
      this.#operation === operation &&
      !operation.controller.signal.aborted &&
      this.items() === operation.items &&
      this.option() === operation.option &&
      this.columns() === operation.columns &&
      !this.locked();
    if (!current && this.#operation === operation) this.#cancel();
    return current;
  }
  #cancel(): void {
    this.#operation?.controller.abort();
    if (this.#operation?.focus) this.#releaseFocus(this.#operation.focus);
    this.#operation = undefined;
    this.#pending.set(null);
    this.announcement.set('');
  }
  #fail(request: SdKanbanMoveRequest<T>, reason: 'error' | 'rejected', error?: unknown): void {
    const message = this.#i18n.t(`core.component.kanban.${reason}`);
    this.failedId.set(request.card.id);
    this.moveFailure.set(message);
    this.announcement.set(message);
    this.sdMoveError.emit({ request, reason, error });
  }
  #trackFocus(id: string, menuTrigger?: HTMLButtonElement): MoveFocus | undefined {
    const host = this.#host.nativeElement;
    const document = host.ownerDocument;
    const origin = document.activeElement;
    const ownsCard = !!origin && host.contains(origin) && origin.closest('[data-card-id]')?.getAttribute('data-card-id') === this.token(id);
    const ownsMenu = !!menuTrigger && host.contains(menuTrigger) && menuTrigger.getAttribute('data-kanban-menu') === this.token(id);
    if (!ownsCard && !ownsMenu) return undefined;
    const listener = (event: FocusEvent) => {
      // Disabling/removing a pending control may leave focus on body. An explicit
      // focus elsewhere relinquishes ownership, even if that control later blurs.
      if (event.target !== document.body) focus.abandoned = event.target !== origin && event.target !== menuTrigger;
    };
    const focus: MoveFocus = {
      origin,
      menuTrigger,
      abandoned: false,
      scheduled: false,
      stop: () => document.removeEventListener('focusin', listener, true),
    };
    document.addEventListener('focusin', listener, true);
    this.#moveFocus.add(focus);
    return focus;
  }
  #releaseFocus(focus: MoveFocus): void {
    focus.stop();
    this.#moveFocus.delete(focus);
  }
  #focusCard(id: string, focus?: MoveFocus): void {
    if (!focus) return;
    focus.scheduled = true;
    afterNextRender(
      () => {
        try {
          const document = this.#host.nativeElement.ownerDocument;
          const active = document.activeElement;
          if (
            this.#destroyed ||
            focus.abandoned ||
            (active && active !== document.body && active !== focus.origin && active !== focus.menuTrigger)
          )
            return;
          Array.from(this.#host.nativeElement.querySelectorAll<HTMLButtonElement>('[data-kanban-card-main]'))
            .find(button => button.getAttribute('data-kanban-card-main') === this.token(id))
            ?.focus();
        } finally {
          this.#releaseFocus(focus);
        }
      },
      { injector: this.#injector }
    );
  }
}
