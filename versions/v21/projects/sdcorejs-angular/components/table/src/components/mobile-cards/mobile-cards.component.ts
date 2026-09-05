import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { DOCUMENT, NgStyle, NgTemplateOutlet } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { Utilities } from '@sdcorejs/utils/fns';
import type { SdTable } from '../../table.component';
import type { SdTableItem } from '../../models/table-item.model';
import type { SdTableRowMobileDefContext } from '../../directives/sd-table-row-mobile-def.directive';
import { Action, sdResolveTableActions } from '../selector-action/action-filter.pipe';
import { Command, sdResolveTableCommands } from '../command/pipes/filter.pipe';
import { CommandPipe } from '../command/pipes/command.pipe';
import { SdTableMobileAction } from './mobile-action.model';
import { SdTableMobileActionsComponent } from './mobile-actions.component';
import { collectFormattedTreeRows } from '../../services/tree/tree.util';

interface Card<T> {
  row: SdTableItem<T>;
  context: SdTableRowMobileDefContext<T>;
  label: string;
  selectLabel: string;
  commandLabel: string;
  expandLabel: string;
  treeLabel: string;
  reorderDisabled: boolean;
  expandDisabled: boolean;
}

const INTERACTIVE =
  'a[href],button,input,select,textarea,summary,label,[contenteditable]:not([contenteditable="false"]),[role="button"],[role="link"],[role="checkbox"],[role="radio"],[role="switch"],[role="textbox"],[tabindex]:not([tabindex="-1"]),sd-button,sd-table,[cdkDragHandle]';

@Component({
  selector: 'sd-table-mobile-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    NgStyle,
    DragDropModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule,
    SdIcon,
    SdTranslatePipe,
    SdTableMobileActionsComponent,
  ],
  templateUrl: './mobile-cards.component.html',
  styleUrl: './mobile-cards.component.scss',
})
export class SdTableMobileCardsComponent<T = unknown> implements OnDestroy {
  readonly table = input.required<SdTable<T>>();
  readonly rows = input.required<SdTableItem<T>[]>();
  readonly groupTemplate = input.required<TemplateRef<{ item: SdTableItem<T> }>>();
  readonly #i18n = inject(I18nService);
  readonly #document = inject(DOCUMENT);
  readonly #element = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #modal = inject(SdModal, { optional: true });
  readonly #drawer = inject(SdSideDrawer, { optional: true });
  readonly containerOpen = computed(() => (this.#modal?.isOpened() ?? true) && (this.#drawer?.isOpened() ?? true));
  readonly #commandMeta = new CommandPipe();
  readonly option = computed(() => this.table().tableOption()!);
  readonly selected = computed(() => this.table().selectedTableItems());
  readonly selectionMode = computed(() => !!this.option().selector?.visible && this.selected().length > 0);
  readonly active = signal<Card<T> | undefined>(undefined);
  readonly resolvedCommands = signal(new Map<SdTableItem<T>, Command<T>[]>());
  #commandRevision = 0;
  #focusOrigin?: HTMLElement;
  #pointer?: { x: number; y: number; moved: boolean };
  #dragged = false;

  readonly cards = computed<Card<T>[]>(() => {
    const table = this.table();
    table.selectedTableItems();
    table.treeRevision();
    table.expandRevision();
    const option = this.option();
    let index = 0;
    return this.rows().map(row => {
      const dataIndex = row.meta.group?.isGroupHeader ? -1 : index++;
      if (row.meta.group?.isGroupHeader)
        return {
          row,
          label: '',
          selectLabel: '',
          commandLabel: '',
          expandLabel: '',
          treeLabel: '',
          reorderDisabled: true,
          expandDisabled: true,
          context: { item: row.data, index: -1, selected: false, selectionDisabled: true, autoId: undefined },
        };
      const rawKey = option.rowKey ? Utilities.getNestedValue(row.data as Record<string, unknown>, option.rowKey) : undefined;
      const keyLabel = rawKey != null && ['string', 'number', 'bigint', 'boolean'].includes(typeof rawKey) ? String(rawKey) : '';
      const label =
        option.mobile?.rowLabel?.(row.data)?.trim() ||
        keyLabel ||
        this.#i18n.t('core.component.table.mobile.row', { index: table.pageOffset() + dataIndex + 1 });
      return {
        row,
        label,
        context: {
          item: row.data,
          index: dataIndex,
          selected: !!row.meta.selector?.isSelected,
          selectionDisabled: !!row.meta.selector?.disabled || !row.meta.selector?.visible,
          autoId: table.autoId() ? `${table.autoId()}-mobile-row-${row.meta.id}` : undefined,
        },
        selectLabel: this.#i18n.t('core.component.table.mobile.select-row', { row: label }),
        commandLabel: this.#i18n.t('core.component.table.mobile.commands-for', { row: label }),
        expandLabel: this.#i18n.t('core.component.table.mobile.expand-row', { row: label }),
        treeLabel: this.#i18n.t('core.component.table.mobile.level', { level: (row.meta.tree?.level ?? 0) + 1 }),
        reorderDisabled: table.isReorderDisabled(row) || (row.meta.tree?.level ?? 0) > 0,
        expandDisabled: !!option.expand?.disabled?.(row.data),
      };
    });
  });

  readonly selectionSummary = computed(() => {
    const total = this.selected().length;
    this.table().treeRevision();
    // why: thu gọn nhánh không biến child đã tải thành selection ngoài trang.
    const onPage = collectFormattedTreeRows(this.table().items());
    const ids = new Set(onPage.map(row => row.meta.id));
    const here = this.selected().filter(row => ids.has(row.meta.id)).length;
    return this.#i18n.t(here < total ? 'core.component.table.mobile.selected-across-pages' : 'core.component.table.mobile.selected', {
      count: total,
      here,
    });
  });

  // Keep B's action array stable when only A's async hidden predicate resolves.
  readonly activeCommands = computed(() => {
    const active = this.active();
    return active ? this.resolvedCommands().get(active.row) : undefined;
  });

  readonly actions = computed<SdTableMobileAction[]>(() => {
    if (!this.containerOpen()) return [];
    if (this.selectionMode()) {
      const selected = this.selected();
      return sdResolveTableActions(selected, this.option().selector?.actions).map((action, index) =>
        this.#bulkAction(
          action,
          index,
          selected.map(row => row.data)
        )
      );
    }
    const active = this.active();
    if (!active) return [];
    return (this.activeCommands() ?? []).map((command, index) => this.#rowAction(command, active.row, index));
  });
  readonly actionTitle = computed(() => (this.selectionMode() ? this.selectionSummary() : (this.active()?.label ?? '')));
  readonly selectionMessage = computed(() => {
    const message = this.option().selector?.message;
    return typeof message === 'function' ? message(this.selected().map(row => row.data)) : message;
  });

  constructor() {
    effect(onCleanup => {
      const rows = this.rows();
      this.table().dataRevision();
      const commands = this.table().rowCommands();
      const revision = ++this.#commandRevision;
      untracked(() => {
        this.closeCommand(false);
        this.resolvedCommands.set(new Map());
      });
      for (const row of rows) {
        if (row.meta.group?.isGroupHeader) continue;
        sdResolveTableCommands(row, commands)
          .then(resolved => {
            if (revision !== this.#commandRevision) return;
            this.resolvedCommands.update(current => new Map(current).set(row, resolved));
          })
          .catch(error => {
            if (revision === this.#commandRevision) console.error(error);
          });
      }
      onCleanup(() => {
        this.#commandRevision++;
      });
    });
    effect(() => {
      if (this.selectionMode() || this.table().loading() || !this.containerOpen()) untracked(() => this.closeCommand(false));
    });
  }

  #actionTitle(title: string | null | undefined, index: number): string {
    return title || this.#i18n.t('core.component.table.mobile.action', { index: index + 1 });
  }

  #rowAction(command: Command<T>, row: SdTableItem<T>, index: number, parentDisabled = false): SdTableMobileAction {
    const meta = this.#commandMeta.transform(row, command);
    const disabled = parentDisabled || meta.disabled;
    return {
      key: `${index}-${command.key}`,
      title: this.#actionTitle(meta.title, index),
      icon: meta.icon,
      fontSet: command.fontSet,
      color: 'color' in command ? command.color : undefined,
      disabled,
      htmlTemplate: meta.htmlTemplate,
      ...('children' in command
        ? { children: command.children.map((child, childIndex) => this.#rowAction(child, row, childIndex, disabled)) }
        : { run: () => command.click(row.data) }),
    };
  }

  #bulkAction(action: Action<T>, index: number, rows: T[]): SdTableMobileAction {
    return {
      key: String(index),
      title: this.#actionTitle(action.title, index),
      icon: action.icon,
      fontSet: action.fontSet ?? undefined,
      color: action.color ?? undefined,
      type: action.type,
      ...('children' in action
        ? { children: action.children.map((child, childIndex) => this.#bulkAction(child, childIndex, rows)) }
        : { run: () => action.click(rows) }),
    };
  }

  select(card: Card<T>): void {
    if (!this.option().selector?.visible || !card.row.meta.selector?.visible || card.row.meta.selector.disabled) return;
    const meta = card.row.meta.selector;
    if (this.option().selector?.single && meta.isSelected) return;
    this.closeCommand(false);
    meta.isSelected = this.option().selector?.single ? true : !meta.isSelected;
    this.table().onSelect(card.row);
  }

  openCommand(card: Card<T>, event: Event): void {
    if (this.selectionMode() || !this.resolvedCommands().get(card.row)?.length) return;
    this.#focusOrigin = event.currentTarget as HTMLElement;
    this.active.set(card);
  }

  closeCommand(restoreFocus = true): void {
    const wasActive = this.active();
    this.active.set(undefined);
    if (restoreFocus && wasActive) {
      const fallback = this.#element.nativeElement.closest<HTMLElement>('sd-table');
      (this.#focusOrigin?.isConnected ? this.#focusOrigin : fallback)?.focus();
    }
    this.#focusOrigin = undefined;
  }

  endActions(): void {
    if (this.selectionMode()) this.table().onClearSelection();
    else this.closeCommand();
  }

  onCardClick(card: Card<T>, event: MouseEvent): void {
    if (this.#dragged || this.#pointer?.moved || this.#isChildControl(event)) return;
    const selectedText = this.#document.getSelection();
    if (selectedText?.toString() && (event.currentTarget as HTMLElement).contains(selectedText.anchorNode)) return;
    if (this.selectionMode() || !this.table().rowCommands().length) this.select(card);
    else this.openCommand(card, event);
  }

  onCardKey(card: Card<T>, event: KeyboardEvent): void {
    if (event.defaultPrevented) return;
    if (event.key === 'Escape') {
      if (this.active()) {
        event.preventDefault();
        event.stopPropagation();
        this.closeCommand();
      }
      return;
    }
    if ((event.key !== 'Enter' && event.key !== ' ') || this.#isChildControl(event)) return;
    event.preventDefault();
    if (this.selectionMode() || !this.table().rowCommands().length) this.select(card);
    else this.openCommand(card, event);
  }

  #isChildControl(event: Event): boolean {
    for (const target of event.composedPath()) {
      if (target === event.currentTarget) break;
      if (target instanceof Element && target.matches(INTERACTIVE)) return true;
    }
    return false;
  }

  pointerStart(event: PointerEvent): void {
    this.#pointer = { x: event.clientX, y: event.clientY, moved: false };
    this.#dragged = false;
  }
  pointerMove(event: PointerEvent): void {
    if (this.#pointer && Math.hypot(event.clientX - this.#pointer.x, event.clientY - this.#pointer.y) > 8) this.#pointer.moved = true;
  }
  cancelPointer(): void {
    if (this.#pointer) this.#pointer.moved = true;
  }
  dragStart(): void {
    this.#dragged = true;
    this.closeCommand(false);
  }

  ngOnDestroy(): void {
    this.#commandRevision++;
  }
}
