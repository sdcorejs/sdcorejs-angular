import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { SdFileExplorerColumnDef } from '../file-explorer-column.directive';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTooltip } from '@angular/material/tooltip';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SD_FILE_EXPLORER_COMMAND_DEFAULTS, sdFileExplorerActionsBusy, sdFileExplorerResolveActions } from '../file-explorer-actions';
import type { SdFileExplorerCommand, SdFileExplorerItem, SdFileExplorerView } from '../file-explorer.model';
import type { SdFileExplorerCommandMenu, SdFileExplorerItemView, SdFileExplorerSelectionView } from '../file-explorer.view-model';
import { SdFileExplorerActions } from './actions.component';
import { SdFileExplorerFileIcon } from './file-icon.component';
import { SdFileExplorerMenuTrigger } from './menu-trigger.component';

/** One list row / grid card with its selection and command state. */
interface SdFileExplorerItemRow<T = unknown> {
  readonly view: SdFileExplorerItemView<T>;
  /** A file while the selector is on: it gets a checkbox. */
  readonly selectable: boolean;
  readonly selected: boolean;
  readonly selectDisabled: boolean;
  /** Desktop: `fileCommands` or `folderCommands` for the item kind; `null` when none are declared, and in compact. */
  readonly commands: readonly SdFileExplorerCommand<T>[] | null;
  readonly source: 'fileCommands' | 'folderCommands';
  /** Compact: the trigger of the item's command drawer; `null` when the drawer would be empty, and on desktop. */
  readonly menu: SdFileExplorerCommandMenu | null;
}

/** Item whose command drawer a compact trigger asks for, with the trigger focus goes back to. */
export interface SdFileExplorerCommandsRequest<T = unknown> {
  readonly item: SdFileExplorerItem<T>;
  readonly trigger: HTMLElement;
}

/** Rows and cards ignore clicks and Enter / Space coming from these areas: they belong to a checkbox or a command. */
const CONTROL_AREAS = '.cell--select, .card-top, .commands, .sd-file-explorer-menu-trigger';

/**
 * Items of the current folder (or search results) as a list or a grid (internal).
 * Rows and cards are focusable; `Enter` / `Space` activate them like a click. Selection checkboxes and commands sit
 * next to the name and never activate the item.
 *
 * In the compact layout a row or card carries one actions trigger instead of its commands and row shortcuts: the
 * explorer lists them in its command drawer.
 */
@Component({
  selector: 'sd-file-explorer-item-list',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    MatCheckbox,
    MatTooltip,
    SdButton,
    SdTranslatePipe,
    SdFileExplorerActions,
    SdFileExplorerFileIcon,
    SdFileExplorerMenuTrigger,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer-item-list',
    '[class.sd-file-explorer-item-list--compact]': 'compact()',
    '[class.sd-file-explorer-item-list--touch]': 'touch()',
    '[style.--sd-fe-actions-width]': 'actionsWidth()',
  },
  template: `
    @let _rows = rows();
    @let _canDownload = canDownload();
    @let _canShare = canShare();
    @let _compact = compact();
    @let _touch = touch();
    @let _actionColumn = _compact ? menuColumn() : _canDownload || _canShare;
    @let _activeId = activeId();
    @let _menuOpenId = menuOpenId();
    @let _selection = selection();
    @let _commandSize = _touch && !_compact ? 'lg' : 'sm';
    @if (view() === 'list') {
      <div
        class="list"
        role="table"
        [class.list--selectable]="!!_selection"
        [class.list--custom]="columns().length > 0"
        [style.--sd-fe-custom-cols]="columnWidths()"
        [attr.aria-label]="label()"
        [attr.aria-colcount]="(_selection ? 1 : 0) + (_compact ? 2 : 3) + columns().length + (_actionColumn ? 1 : 0)">
        <div class="list-head" role="rowgroup">
          <div class="row row--head" role="row">
            @if (_selection) {
              <span class="cell cell--select" role="columnheader">
                <mat-checkbox
                  class="select-all"
                  color="primary"
                  [checked]="_selection.state === 'all'"
                  [indeterminate]="_selection.state === 'some'"
                  [disabled]="!_selection.eligibleCount"
                  [aria-label]="_selection.allLabel"
                  [matTooltip]="_selection.allLabel"
                  [attr.data-autoid]="_selection.autoId ?? null"
                  (change)="toggleSelectAll.emit()" />
              </span>
            }
            <span class="cell cell--name" role="columnheader">{{ 'core.component.file-explorer.column.name' | sdTranslate }}</span>
            @if (!_compact) {
              <span class="cell cell--modified" role="columnheader">{{
                'core.component.file-explorer.column.modified' | sdTranslate
              }}</span>
            }
            <span class="cell cell--size" role="columnheader">{{ 'core.component.file-explorer.column.size' | sdTranslate }}</span>
            @for (column of columns(); track column.id(); let index = $index) {
              <span class="cell cell--custom" role="columnheader" [style.grid-column]="5 + index">{{ column.title() }}</span>
            }
            @if (_actionColumn) {
              <span class="cell cell--action" role="columnheader" [style.grid-column]="5 + columns().length"></span>
            }
          </div>
        </div>
        <div role="rowgroup">
          @for (row of _rows; track row.view.item.id; let rowIndex = $index) {
            @let view = row.view;
            <div
              class="row"
              role="row"
              tabindex="0"
              [class.row--active]="view.item.id === _activeId"
              [class.row--selected]="row.selected"
              [class.row--commands]="!!row.commands"
              [class.row--movable]="canMove() && view.item.kind === 'file'"
              [attr.data-item-id]="view.item.id"
              [attr.data-move-target]="view.item.kind === 'folder' ? view.item.id : null"
              [class.move-drop-target]="view.item.kind === 'folder' && moveDropTarget() === view.item.id"
              [attr.data-autoid]="view.autoId"
              (click)="onClick($event, view)"
              (keydown)="onKeydown($event, view)">
              @if (_selection) {
                <span class="cell cell--select" role="cell">
                  @if (row.selectable) {
                    <mat-checkbox
                      class="select"
                      color="primary"
                      [checked]="row.selected"
                      [disabled]="row.selectDisabled"
                      [aria-label]="view.selectLabel"
                      [attr.data-autoid]="view.autoId ? view.autoId + '-select' : null"
                      (change)="toggleSelect.emit(view.item)" />
                  }
                </span>
              }
              <span class="cell cell--name" role="cell">
                <sd-file-explorer-file-icon [icon]="view.icon" [size]="32" />
                <span class="name" [draggable]="canMove() && view.item.kind === 'file'" [title]="view.item.name">{{ view.item.name }}</span>
                @if (view.item.kind === 'folder' && moveDropTarget() === view.item.id) {
                  <span class="move-drop-label">{{ 'core.component.file-explorer.move.confirm' | sdTranslate }}</span>
                }
                @if (canMove() && view.item.kind === 'file') {
                  <sd-button
                    htmlType="button"
                    class="move-file-button commands"
                    type="text"
                    color="secondary"
                    [size]="_compact ? 'sm' : 'md'"
                    [disabled]="movePending()"
                    [title]="'core.component.file-explorer.move.to' | sdTranslate"
                    [tooltip]="('core.component.file-explorer.move.to' | sdTranslate) + ': ' + view.item.name"
                    (click)="$event.stopPropagation(); move.emit(view.item)"
                    (keydown)="$event.stopPropagation()" />
                }
                @if (row.commands) {
                  <sd-file-explorer-actions
                    class="commands"
                    [actions]="row.commands"
                    [context]="view.item"
                    [size]="_commandSize"
                    [source]="row.source"
                    [autoId]="view.autoId ? view.autoId + '-command' : undefined" />
                }
              </span>
              @if (!_compact) {
                <span class="cell cell--modified" role="cell" [title]="view.modifiedTitle">{{ view.modifiedLabel || '—' }}</span>
              }
              <span class="cell cell--size" role="cell">{{ view.sizeLabel || '—' }}</span>
              @for (column of columns(); track column.id(); let index = $index) {
                <span class="cell cell--custom" role="cell" [style.grid-column]="5 + index">
                  <ng-container
                    [ngTemplateOutlet]="column.template"
                    [ngTemplateOutletContext]="{ $implicit: view.item, item: view.item, data: view.item.data, index: rowIndex }" />
                </span>
              }
              @if (_actionColumn) {
                <!-- why: sd-button already keeps its click from reaching the row; Enter/Space are stopped here so the key does not open the file too. -->
                <span class="cell cell--action" role="cell" [style.grid-column]="5 + columns().length">
                  @if (_compact) {
                    @if (row.menu; as menu) {
                      <sd-file-explorer-menu-trigger
                        class="row-menu"
                        [label]="view.actionsLabel"
                        [busy]="menu.busy"
                        [expanded]="view.item.id === _menuOpenId"
                        [touch]="_touch"
                        [autoId]="view.autoId ? view.autoId + '-commands' : undefined"
                        (activate)="openCommands.emit({ item: view.item, trigger: $event })" />
                    }
                  } @else if (view.item.kind === 'file') {
                    @if (_canShare) {
                      <sd-button
                        class="row-action row-share"
                        [disabled]="view.shareDisabled ?? false"
                        [attr.aria-description]="view.shareDisabled ? view.unavailableReason : null"
                        type="text"
                        color="secondary"
                        size="sm"
                        prefixIcon="share"
                        [tooltip]="view.shareLabel"
                        [attr.data-autoid]="view.autoId ? view.autoId + '-share' : null"
                        (click)="share.emit(view)"
                        (keydown.enter)="$event.stopPropagation()"
                        (keydown.space)="$event.stopPropagation()" />
                    }
                    @if (_canDownload) {
                      <sd-button
                        class="row-action row-download"
                        [disabled]="view.downloadDisabled ?? false"
                        [attr.aria-description]="view.downloadDisabled ? view.unavailableReason : null"
                        type="text"
                        color="secondary"
                        size="sm"
                        prefixIcon="file_download"
                        [tooltip]="view.downloadLabel"
                        [attr.data-autoid]="view.autoId ? view.autoId + '-download' : null"
                        (click)="download.emit(view)"
                        (keydown.enter)="$event.stopPropagation()"
                        (keydown.space)="$event.stopPropagation()" />
                    }
                  }
                </span>
              }
            </div>
          }
        </div>
      </div>
    } @else {
      @let _cardTop = !!_selection || hasCommands();
      @if (_selection) {
        <div class="grid-head">
          <mat-checkbox
            class="select-all"
            color="primary"
            [checked]="_selection.state === 'all'"
            [indeterminate]="_selection.state === 'some'"
            [disabled]="!_selection.eligibleCount"
            [aria-label]="_selection.allLabel"
            [matTooltip]="_selection.allLabel"
            [attr.data-autoid]="_selection.autoId ?? null"
            (change)="toggleSelectAll.emit()" />
        </div>
      }
      <ul class="grid" [attr.aria-label]="label()">
        @for (row of _rows; track row.view.item.id) {
          @let view = row.view;
          <li
            class="card"
            tabindex="0"
            [class.card--active]="view.item.id === _activeId"
            [class.card--selected]="row.selected"
            [attr.data-item-id]="view.item.id"
            [attr.data-move-target]="view.item.kind === 'folder' ? view.item.id : null"
            [class.move-drop-target]="view.item.kind === 'folder' && moveDropTarget() === view.item.id"
            [attr.data-autoid]="view.autoId"
            [attr.aria-label]="view.item.name + ', ' + view.typeLabel"
            (click)="onClick($event, view)"
            (keydown)="onKeydown($event, view)">
            @if (_cardTop) {
              <span class="card-top">
                @if (row.selectable) {
                  <mat-checkbox
                    class="select"
                    color="primary"
                    [checked]="row.selected"
                    [disabled]="row.selectDisabled"
                    [aria-label]="view.selectLabel"
                    [attr.data-autoid]="view.autoId ? view.autoId + '-select' : null"
                    (change)="toggleSelect.emit(view.item)" />
                }
                @if (row.commands) {
                  <sd-file-explorer-actions
                    class="commands"
                    [actions]="row.commands"
                    [context]="view.item"
                    [size]="_commandSize"
                    [source]="row.source"
                    [autoId]="view.autoId ? view.autoId + '-command' : undefined" />
                }
                @if (row.menu; as menu) {
                  <sd-file-explorer-menu-trigger
                    class="card-menu"
                    [label]="view.actionsLabel"
                    [busy]="menu.busy"
                    [expanded]="view.item.id === _menuOpenId"
                    [touch]="_touch"
                    [autoId]="view.autoId ? view.autoId + '-commands' : undefined"
                    (activate)="openCommands.emit({ item: view.item, trigger: $event })" />
                }
              </span>
            }
            <span class="thumb">
              @if (view.item.thumbnailUrl) {
                <img [src]="view.item.thumbnailUrl" alt="" loading="lazy" />
              } @else {
                <sd-file-explorer-file-icon [icon]="view.icon" [size]="48" />
              }
            </span>
            <span class="card-name" [draggable]="canMove() && view.item.kind === 'file'" [title]="view.item.name">{{
              view.item.name
            }}</span>
            @if (canMove() && view.item.kind === 'file') {
              <sd-button
                htmlType="button"
                class="move-file-button commands"
                type="text"
                color="secondary"
                [size]="_compact ? 'sm' : 'md'"
                [disabled]="movePending()"
                [title]="'core.component.file-explorer.move.to' | sdTranslate"
                (click)="$event.stopPropagation(); move.emit(view.item)"
                (keydown)="$event.stopPropagation()" />
            }
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './item-list.component.scss',
})
export class SdFileExplorerItemList<T = unknown> {
  readonly canMove = input(false);
  readonly moveDropTarget = input<string | null | undefined>();
  readonly movePending = input(false);
  readonly move = output<SdFileExplorerItem<T>>();
  readonly columns = input<readonly SdFileExplorerColumnDef<T>[]>([]);
  protected readonly columnWidths = computed(() =>
    this.columns()
      .map(column => column.width())
      .join(' ')
  );
  /** Items to render, already formatted. */
  readonly items = input.required<readonly SdFileExplorerItemView<T>[]>();
  /** `list` or `grid`. */
  readonly view = input<SdFileExplorerView>('list');
  /** Show download buttons for files. */
  readonly canDownload = input(false);
  /** Show share buttons for files. */
  readonly canShare = input(false);
  /** Narrow layout: hides the modified column and replaces commands and row shortcuts with an actions trigger. */
  readonly compact = input(false);
  /** Touch screen: commands always visible, with 48 px touch targets. */
  readonly touch = input(false);
  /** Id of the file currently shown in the preview panel. */
  readonly activeId = input<string | null>(null);
  /** Accessible name of the list. */
  readonly label = input<string>('');
  /** Selection state; `null` hides every checkbox. */
  readonly selection = input<SdFileExplorerSelectionView | null>(null);
  /** Commands of file rows and cards. */
  readonly fileCommands = input<readonly SdFileExplorerCommand<T>[] | null | undefined>(undefined);
  /** Commands of folder rows and cards. */
  readonly folderCommands = input<readonly SdFileExplorerCommand<T>[] | null | undefined>(undefined);
  /** Id of the item whose command drawer is open from this list. */
  readonly menuOpenId = input<string | null>(null);
  /** Row / card activated. */
  readonly activate = output<SdFileExplorerItemView<T>>();
  /** Compact actions trigger pressed. */
  readonly openCommands = output<SdFileExplorerCommandsRequest<T>>();
  /** Download button pressed. */
  readonly download = output<SdFileExplorerItemView<T>>();
  /** Share button pressed. */
  readonly share = output<SdFileExplorerItemView<T>>();
  /** Checkbox of a file toggled. */
  readonly toggleSelect = output<SdFileExplorerItem<T>>();
  /** Select-all checkbox toggled. */
  readonly toggleSelectAll = output<void>();

  /**
   * Width of the row action column: one 32 px icon button per row shortcut on desktop; the actions trigger (32 px,
   * 48 px on touch) in compact.
   */
  protected readonly actionsWidth = computed(() => {
    if (this.compact()) return this.menuColumn() ? `${(this.touch() ? 48 : 32) + 4}px` : null;
    const count = (this.canDownload() ? 1 : 0) + (this.canShare() ? 1 : 0);
    if (!count) return null;
    return `${count * 32 + (count - 1) * 2 + 12}px`;
  });

  protected readonly hasCommands = computed(() => !!(this.fileCommands()?.length || this.folderCommands()?.length));

  protected readonly rows = computed<readonly SdFileExplorerItemRow<T>[]>(() => {
    const selection = this.selection();
    const fileCommands = this.fileCommands();
    const folderCommands = this.folderCommands();
    const compact = this.compact();
    // why: only list rows carry the download / share shortcuts — grid cards never did — so only they bring them into
    // the drawer. The explorer turns them off as soon as fileCommands is declared.
    const shortcuts = this.view() === 'list' && (this.canDownload() || this.canShare());
    return this.items().map(view => {
      const isFile = view.item.kind === 'file';
      const commands = isFile ? fileCommands : folderCommands;
      const source = isFile ? 'fileCommands' : 'folderCommands';
      return {
        view,
        selectable: !!selection && isFile,
        selected: !!selection?.selectedIds.has(view.item.id),
        selectDisabled: !!selection?.disabledIds.has(view.item.id),
        commands: !compact && commands?.length ? commands : null,
        source,
        menu: compact ? this.#menu(commands, view.item, source, isFile && shortcuts) : null,
      };
    });
  });

  /** Compact list with at least one actions trigger: the action column holds them. */
  protected readonly menuColumn = computed(() => this.rows().some(row => row.menu));

  /** Trigger state of one item: `null` when its drawer would be empty. Same filtering as the drawer and the buttons. */
  #menu(
    commands: readonly SdFileExplorerCommand<T>[] | null | undefined,
    item: SdFileExplorerItem<T>,
    source: string,
    shortcuts: boolean
  ): SdFileExplorerCommandMenu | null {
    const resolved = sdFileExplorerResolveActions(commands, item, SD_FILE_EXPLORER_COMMAND_DEFAULTS, source);
    return resolved.length || shortcuts ? { busy: sdFileExplorerActionsBusy(resolved) } : null;
  }

  protected onClick(event: MouseEvent, view: SdFileExplorerItemView<T>): void {
    if (this.#fromControl(event)) return;
    this.activate.emit(view);
  }

  protected onKeydown(event: KeyboardEvent, view: SdFileExplorerItemView<T>): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    if (this.#fromControl(event)) return;
    event.preventDefault();
    this.activate.emit(view);
  }

  /** The event started on a checkbox or a command (or the space around it) inside the row / card. */
  #fromControl(event: Event): boolean {
    const target = event.target instanceof Element ? event.target : null;
    const area = target?.closest(CONTROL_AREAS);
    return !!area && event.currentTarget instanceof Element && event.currentTarget.contains(area);
  }
}
