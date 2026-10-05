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
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { MatMenuModule } from '@angular/material/menu';
import { Utilities } from '@sdcorejs/utils/fns';
import { SdDataState } from '@sdcorejs/angular/components/data-state';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdKanbanColumn, SdKanbanId, SdKanbanMoveError, SdKanbanMoveRequest, SdKanbanMoveSource, SdKanbanOption } from './kanban.model';
import {
  SdKanbanCardActionsTemplateDirective,
  SdKanbanCardTemplateDirective,
  SdKanbanColumnActionsTemplateDirective,
  SdKanbanColumnTemplateDirective,
} from './kanban.templates';
import { kanbanDataInvalid, prepareKanbanMove } from './kanban.utils';

interface CardView<T> {
  readonly item: T;
  readonly id: SdKanbanId;
  readonly title: string;
  readonly index: number;
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
  readonly focus?: MoveFocus;
}
interface MoveFocus {
  readonly origin: Element | null;
  readonly menuTrigger?: HTMLButtonElement;
  readonly stop: () => void;
  abandoned: boolean;
  scheduled: boolean;
}

/** Generic ordered board with one consumer-confirmed, serial move pipeline. */
@Component({
  selector: 'sd-kanban',
  standalone: true,
  imports: [NgTemplateOutlet, DragDropModule, MatMenuModule, SdIcon, SdDataState, SdTranslatePipe],
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
  readonly columns = input<readonly SdKanbanColumn[]>([]);
  readonly option = input.required<SdKanbanOption<T>>();
  readonly model = model<readonly T[]>([]);
  readonly keyword = model('');
  readonly collapsedColumns = model<readonly SdKanbanId[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input<string | null | undefined>();
  readonly ariaLabel = input<string | null | undefined>();
  readonly autoId = input<string | null | undefined>();
  readonly sdChange = output<readonly T[]>();
  readonly sdMove = output<SdKanbanMoveRequest<T>>();
  readonly sdMoveError = output<SdKanbanMoveError<T>>();
  readonly sdRetry = output<void>();
  readonly pendingId = signal<SdKanbanId | null>(null);
  protected readonly cardTemplate = contentChild(SdKanbanCardTemplateDirective<T>);
  protected readonly cardActionsTemplate = contentChild(SdKanbanCardActionsTemplateDirective<T>);
  protected readonly columnTemplate = contentChild(SdKanbanColumnTemplateDirective);
  protected readonly columnActionsTemplate = contentChild(SdKanbanColumnActionsTemplateDirective);
  protected readonly announcement = signal('');
  protected readonly moveFailure = signal<string | undefined>(undefined);
  /** Card the current failure belongs to; `null` for failures without a card (invalid configuration). */
  protected readonly failedId = signal<SdKanbanId | null>(null);
  protected readonly dataInvalid = computed(() => kanbanDataInvalid(this.model(), this.columns(), this.option()));
  protected readonly locked = computed(() => this.disabled() || this.readonly() || this.loading() || !!this.error() || this.dataInvalid());
  protected readonly moveBlocked = computed(() => this.locked() || this.pendingId() !== null);
  protected readonly boardLabel = computed(() => this.ariaLabel() || this.#i18n.t('core.component.kanban.label'));
  protected readonly boardColumns = computed<readonly ColumnView<T>[]>(() => {
    if (this.dataInvalid()) return [];
    const option = this.option();
    const keyword = this.keyword().trim().toLocaleLowerCase(this.#i18n.locale());
    return this.columns().map(column => {
      const all = this.model().filter(item => Object.is(option.getColumnId(item), column.id));
      const cards = all
        .map((item, index) => ({ item, id: option.getId(item), title: option.getTitle(item), index }))
        .filter(
          card =>
            (!option.filter || option.filter(card.item)) &&
            (!keyword || (option.getSearchText?.(card.item) ?? card.title).toLocaleLowerCase(this.#i18n.locale()).includes(keyword))
        );
      return { column, cards, count: all.length };
    });
  });
  // Pending/failure feedback is shown on the affected card; board-level text is only a fallback
  // when that card is not rendered (filtered out, collapsed, removed, or no card at all).
  protected readonly pendingAnchored = computed(() => this.#rendered(this.pendingId()));
  protected readonly failureAnchored = computed(() => !!this.moveFailure() && this.#rendered(this.failedId()));
  protected readonly enterPredicate = (_drag: CdkDrag<CardView<T>>, drop: CdkDropList<ColumnView<T>>): boolean =>
    !this.moveBlocked() && !drop.data.column.disabled && !this.collapsed(drop.data.column.id);

  constructor() {
    effect(() => {
      const items = this.model();
      const option = this.option();
      const columns = this.columns();
      const locked = this.locked();
      untracked(() => {
        const operation = this.#operation;
        if (
          operation &&
          (items !== operation.request.previousItems || option !== operation.option || columns !== operation.columns || locked)
        ) {
          this.#cancel();
        }
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.#destroyed = true;
      this.#cancel();
      for (const focus of this.#moveFocus) this.#releaseFocus(focus);
    });
  }

  /**
   * Propose a full-column insertion, optionally wait for persistence, then commit once.
   * No-op, locked, rejected and stale requests return false without a change event.
   */
  move(itemId: SdKanbanId, columnId: SdKanbanId, index?: number, source: SdKanbanMoveSource = 'api'): Promise<boolean> {
    return this.#move(itemId, columnId, index, source);
  }

  async #move(
    itemId: SdKanbanId,
    columnId: SdKanbanId,
    index: number | undefined,
    source: SdKanbanMoveSource,
    menuTrigger?: HTMLButtonElement
  ): Promise<boolean> {
    if (this.#destroyed || this.moveBlocked()) return false;
    const option = this.option();
    const controller = new AbortController();
    let request: SdKanbanMoveRequest<T> | undefined;
    try {
      const targetCount = this.model().filter(
        item => Object.is(option.getColumnId(item), columnId) && !Object.is(option.getId(item), itemId)
      ).length;
      request = prepareKanbanMove(this.model(), this.columns(), option, itemId, columnId, index ?? targetCount, source, controller.signal);
      if (!request || (option.canMove && !option.canMove(request))) return false;
    } catch (error) {
      if (request) this.#fail(request, 'error', error);
      else {
        this.failedId.set(null);
        this.moveFailure.set(this.#i18n.t('core.component.kanban.invalid-data'));
      }
      return false;
    }
    const operation: MoveOperation<T> = {
      request,
      controller,
      option,
      columns: this.columns(),
      focus: this.#trackFocus(itemId, menuTrigger),
    };
    this.#operation = operation;
    this.pendingId.set(itemId);
    this.moveFailure.set(undefined);
    this.failedId.set(null);
    this.announcement.set(this.#i18n.t('core.component.kanban.pending', { title: option.getTitle(request.item) }));
    try {
      const accepted = option.move ? await option.move(request) : true;
      if (!this.#current(operation)) return false;
      if (accepted === false) {
        this.#fail(request, 'rejected');
        this.#focusCard(itemId, operation.focus);
        return false;
      }
      this.#operation = undefined;
      this.pendingId.set(null);
      if (this.collapsed(columnId)) this.collapsedColumns.update(ids => ids.filter(id => !Object.is(id, columnId)));
      this.model.set(request.nextItems);
      this.sdChange.emit(request.nextItems);
      this.sdMove.emit(request);
      const column = operation.columns.find(candidate => Object.is(candidate.id, columnId))!;
      this.announcement.set(
        this.#i18n.t('core.component.kanban.moved', {
          title: option.getTitle(request.item),
          column: column.label,
          position: request.toIndex + 1,
        })
      );
      this.#focusCard(itemId, operation.focus);
      return true;
    } catch (error) {
      if (this.#current(operation)) {
        this.#fail(request, 'error', error);
        this.#focusCard(itemId, operation.focus);
      }
      return false;
    } finally {
      if (this.#operation === operation) {
        this.#operation = undefined;
        this.pendingId.set(null);
      }
      if (operation.focus && !operation.focus.scheduled) this.#releaseFocus(operation.focus);
    }
  }

  protected drop(event: CdkDragDrop<ColumnView<T>, ColumnView<T>, CardView<T>>): void {
    if (!event.isPointerOverContainer || this.moveBlocked()) return;
    if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) return;
    const card = event.item.data;
    const targetId = event.container.data.column.id;
    const visible = event.container.data.cards.filter(candidate => !Object.is(candidate.id, card.id));
    const anchor = visible[event.currentIndex];
    const complete = this.model().filter(
      item => Object.is(this.option().getColumnId(item), targetId) && !Object.is(this.option().getId(item), card.id)
    );
    const index = anchor ? complete.findIndex(item => Object.is(this.option().getId(item), anchor.id)) : complete.length;
    void this.move(card.id, targetId, index, 'drag');
  }

  protected moveFromMenu(itemId: SdKanbanId, columnId: SdKanbanId, index: number | undefined, trigger: HTMLButtonElement): void {
    void this.#move(itemId, columnId, index, 'menu', trigger);
  }

  protected keydown(event: KeyboardEvent, card: CardView<T>, view: ColumnView<T>): void {
    if (this.moveBlocked() || view.column.disabled || !event.altKey || event.ctrlKey || event.metaKey) return;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      void this.move(card.id, view.column.id, card.index + (event.key === 'ArrowUp' ? -1 : 1), 'keyboard');
      return;
    }
    const enabled = this.columns().filter(column => !column.disabled);
    const rtl = getComputedStyle(this.#host.nativeElement).direction === 'rtl';
    const direction = (event.key === 'ArrowLeft' ? -1 : 1) * (rtl ? -1 : 1);
    const target = enabled[enabled.findIndex(column => Object.is(column.id, view.column.id)) + direction];
    if (target) void this.move(card.id, target.id, undefined, 'keyboard');
  }

  protected collapsed(id: SdKanbanId): boolean {
    return this.collapsedColumns().some(value => Object.is(id, value));
  }
  protected toggleColumn(id: SdKanbanId): void {
    if (this.disabled() || this.option().collapsible === false) return;
    this.collapsedColumns.update(ids => (this.collapsed(id) ? ids.filter(value => !Object.is(value, id)) : [...ids, id]));
  }
  protected columnContext(view: ColumnView<T>) {
    return {
      $implicit: view.column,
      column: view.column,
      count: view.count,
      visibleCount: view.cards.length,
      collapsed: this.collapsed(view.column.id),
    };
  }
  protected cardContext(card: CardView<T>, view: ColumnView<T>) {
    return { $implicit: card.item, item: card.item, column: view.column, index: card.index, pending: this.pendingId() !== null };
  }
  protected token(id: SdKanbanId): string {
    return `${typeof id}-${encodeURIComponent(String(id))}`;
  }
  protected updateKeyword(event: Event): void {
    this.keyword.set((event.target as HTMLInputElement).value);
  }
  protected dismissFailure(): void {
    this.moveFailure.set(undefined);
    this.failedId.set(null);
  }

  #rendered(id: SdKanbanId | null): boolean {
    return (
      id !== null && this.boardColumns().some(view => !this.collapsed(view.column.id) && view.cards.some(card => Object.is(card.id, id)))
    );
  }
  #current(operation: MoveOperation<T>): boolean {
    const current =
      !this.#destroyed &&
      this.#operation === operation &&
      !operation.controller.signal.aborted &&
      this.model() === operation.request.previousItems &&
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
    this.pendingId.set(null);
    this.announcement.set('');
  }
  #fail(request: SdKanbanMoveRequest<T>, reason: 'error' | 'rejected', error?: unknown): void {
    const message = this.#i18n.t(`core.component.kanban.${reason}`);
    this.failedId.set(request.itemId);
    this.moveFailure.set(message);
    this.announcement.set(message);
    this.sdMoveError.emit({ request, reason, error });
  }
  #trackFocus(id: SdKanbanId, menuTrigger?: HTMLButtonElement): MoveFocus | undefined {
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
  #focusCard(id: SdKanbanId, focus?: MoveFocus): void {
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
          Array.from(this.#host.nativeElement.querySelectorAll<HTMLButtonElement>('[data-kanban-handle]'))
            .find(button => button.getAttribute('data-kanban-handle') === this.token(id))
            ?.focus();
        } finally {
          this.#releaseFocus(focus);
        }
      },
      { injector: this.#injector }
    );
  }
}
