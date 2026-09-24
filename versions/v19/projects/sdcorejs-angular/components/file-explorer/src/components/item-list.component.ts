import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import type { SdFileExplorerView } from '../file-explorer.model';
import type { SdFileExplorerItemView } from '../file-explorer.view-model';
import { SdFileExplorerFileIcon } from './file-icon.component';

/**
 * Items of the current folder (or search results) as a list or a grid (internal).
 * Rows and cards are focusable; `Enter` / `Space` activate them like a click.
 */
@Component({
  selector: 'sd-file-explorer-item-list',
  standalone: true,
  imports: [SdButton, SdTranslatePipe, SdFileExplorerFileIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer-item-list',
    '[class.sd-file-explorer-item-list--compact]': 'compact()',
    '[style.--sd-fe-actions-width]': 'actionsWidth()',
  },
  template: `
    @let _items = items();
    @let _canDownload = canDownload();
    @let _canShare = canShare();
    @let _hasActions = _canDownload || _canShare;
    @let _compact = compact();
    @let _activeId = activeId();
    @if (view() === 'list') {
      <div class="list" role="table" [attr.aria-label]="label()">
        <div class="list-head" role="rowgroup">
          <div class="row row--head" role="row">
            <span class="cell cell--name" role="columnheader">{{ 'core.component.file-explorer.column.name' | sdTranslate }}</span>
            @if (!_compact) {
              <span class="cell cell--modified" role="columnheader">{{
                'core.component.file-explorer.column.modified' | sdTranslate
              }}</span>
            }
            <span class="cell cell--size" role="columnheader">{{ 'core.component.file-explorer.column.size' | sdTranslate }}</span>
            @if (_hasActions) {
              <span class="cell cell--action" role="columnheader"></span>
            }
          </div>
        </div>
        <div role="rowgroup">
          @for (view of _items; track view.item.id) {
            <div
              class="row"
              role="row"
              tabindex="0"
              [class.row--active]="view.item.id === _activeId"
              [attr.data-item-id]="view.item.id"
              [attr.data-autoid]="view.autoId"
              (click)="activate.emit(view)"
              (keydown)="onKeydown($event, view)">
              <span class="cell cell--name" role="cell">
                <sd-file-explorer-file-icon [icon]="view.icon" [size]="32" />
                <span class="name" [title]="view.item.name">{{ view.item.name }}</span>
              </span>
              @if (!_compact) {
                <span class="cell cell--modified" role="cell" [title]="view.modifiedTitle">{{ view.modifiedLabel || '—' }}</span>
              }
              <span class="cell cell--size" role="cell">{{ view.sizeLabel || '—' }}</span>
              @if (_hasActions) {
                <!-- why: sd-button already keeps its click from reaching the row; Enter/Space are stopped here so the key does not open the file too. -->
                <span class="cell cell--action" role="cell">
                  @if (view.item.kind === 'file') {
                    @if (_canShare) {
                      <sd-button
                        class="row-action row-share"
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
      <ul class="grid" [attr.aria-label]="label()">
        @for (view of _items; track view.item.id) {
          <li
            class="card"
            tabindex="0"
            [class.card--active]="view.item.id === _activeId"
            [attr.data-item-id]="view.item.id"
            [attr.data-autoid]="view.autoId"
            [attr.aria-label]="view.item.name + ', ' + view.typeLabel"
            (click)="activate.emit(view)"
            (keydown)="onKeydown($event, view)">
            <span class="thumb">
              @if (view.item.thumbnailUrl) {
                <img [src]="view.item.thumbnailUrl" alt="" loading="lazy" />
              } @else {
                <sd-file-explorer-file-icon [icon]="view.icon" [size]="48" />
              }
            </span>
            <span class="card-name" [title]="view.item.name">{{ view.item.name }}</span>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './item-list.component.scss',
})
export class SdFileExplorerItemList {
  /** Items to render, already formatted. */
  readonly items = input.required<readonly SdFileExplorerItemView[]>();
  /** `list` or `grid`. */
  readonly view = input<SdFileExplorerView>('list');
  /** Show download buttons for files. */
  readonly canDownload = input(false);
  /** Show share buttons for files. */
  readonly canShare = input(false);
  /** Narrow layout: hides the modified column. */
  readonly compact = input(false);
  /** Id of the file currently shown in the preview panel. */
  readonly activeId = input<string | null>(null);
  /** Accessible name of the list. */
  readonly label = input<string>('');
  /** Row / card activated. */
  readonly activate = output<SdFileExplorerItemView>();
  /** Download button pressed. */
  readonly download = output<SdFileExplorerItemView>();
  /** Share button pressed. */
  readonly share = output<SdFileExplorerItemView>();

  /** Width of the row action column: one 32 px icon button per enabled action. */
  protected readonly actionsWidth = computed(() => {
    const count = (this.canDownload() ? 1 : 0) + (this.canShare() ? 1 : 0);
    if (!count) return null;
    return `${count * 32 + (count - 1) * 2 + (this.compact() ? 4 : 12)}px`;
  });

  protected onKeydown(event: KeyboardEvent, view: SdFileExplorerItemView): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.activate.emit(view);
  }
}
