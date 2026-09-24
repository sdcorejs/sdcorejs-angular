import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdFileExplorerTransferView } from '../file-explorer.view-model';

let nextTransferPanelId = 0;

/**
 * Transfer queue docked at the bottom of the explorer (internal). Shows one card per upload / download with
 * its status, a progress bar and the cancel / retry / dismiss actions allowed by its state.
 */
@Component({
  selector: 'sd-file-explorer-transfer-panel',
  standalone: true,
  imports: [SdButton, SdIcon, SdTranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'sd-file-explorer-transfer-panel', '[class.sd-file-explorer-transfer-panel--compact]': 'compact()' },
  template: `
    @let _collapsed = collapsed();
    @let _autoId = autoId();
    @let _compact = compact();
    @let _clearLabel = 'core.component.file-explorer.transfers.clear' | sdTranslate;
    <section class="panel" [attr.aria-labelledby]="titleId">
      <header class="head">
        <svg class="head-icon" viewBox="0 0 24 24" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 4v16M7.5 8.5 12 4l4.5 4.5M7.5 15.5 12 20l4.5-4.5"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round" />
        </svg>
        <h3 class="title" [id]="titleId" [title]="title()">{{ title() }}</h3>
        @if (canClear()) {
          <sd-button
            class="clear-button"
            type="text"
            color="primary"
            size="sm"
            [prefixIcon]="_compact ? 'delete_sweep' : undefined"
            [title]="_compact ? undefined : _clearLabel"
            [tooltip]="_compact ? _clearLabel : undefined"
            [attr.data-autoid]="_autoId ? _autoId + '-clear' : null"
            (click)="clear.emit()" />
        }
        <button
          type="button"
          class="icon-button"
          [attr.aria-expanded]="!_collapsed"
          [attr.aria-controls]="listId"
          [attr.aria-label]="
            (_collapsed ? 'core.component.file-explorer.transfers.expand' : 'core.component.file-explorer.transfers.collapse') | sdTranslate
          "
          [attr.data-autoid]="_autoId ? _autoId + '-toggle' : null"
          (click)="toggleCollapsed.emit()">
          <sd-icon [name]="_collapsed ? 'expand_less' : 'expand_more'" size="22px" />
        </button>
      </header>
      <ul class="cards" [id]="listId" [hidden]="_collapsed" [attr.aria-label]="'core.component.file-explorer.transfers.list' | sdTranslate">
        @for (view of transfers(); track view.transfer.id) {
          <li class="card" [class]="'card--' + view.tone" [attr.data-autoid]="view.autoId">
            <div class="card-row">
              <sd-icon
                class="direction"
                [name]="view.transfer.direction === 'upload' ? 'file_upload' : 'file_download'"
                size="22px"
                [ariaLabel]="view.directionLabel" />
              <span class="name" [title]="view.transfer.name">{{ view.transfer.name }}</span>
              <span class="status">{{ view.statusLabel }}</span>
              @if (view.canCancel) {
                <sd-button
                  class="card-action"
                  type="text"
                  color="secondary"
                  size="sm"
                  prefixIcon="close"
                  [tooltip]="view.cancelLabel"
                  [attr.data-autoid]="view.autoId ? view.autoId + '-cancel' : null"
                  (click)="cancel.emit(view.transfer.id)" />
              }
              @if (view.canRetry) {
                <sd-button
                  class="card-action"
                  type="text"
                  color="secondary"
                  size="sm"
                  prefixIcon="refresh"
                  [tooltip]="view.retryLabel"
                  [attr.data-autoid]="view.autoId ? view.autoId + '-retry' : null"
                  (click)="retry.emit(view.transfer.id)" />
              }
              @if (view.canDismiss) {
                <sd-button
                  class="card-action"
                  type="text"
                  color="secondary"
                  size="sm"
                  prefixIcon="close"
                  [tooltip]="view.dismissLabel"
                  [attr.data-autoid]="view.autoId ? view.autoId + '-dismiss' : null"
                  (click)="dismiss.emit(view.transfer.id)" />
              }
            </div>
            <div
              class="bar"
              role="progressbar"
              aria-valuemin="0"
              aria-valuemax="100"
              [class.bar--indeterminate]="view.progress === 'indeterminate'"
              [attr.aria-valuenow]="view.progress === 'determinate' ? view.percent : view.progress === 'full' ? 100 : null"
              [attr.aria-label]="view.transfer.name + ': ' + view.statusLabel">
              <span
                class="bar-fill"
                [style.width.%]="view.progress === 'determinate' ? view.percent : view.progress === 'none' ? 0 : 100"></span>
            </div>
            @if (view.errorMessage) {
              <p class="error" [title]="view.errorMessage">{{ view.errorMessage }}</p>
            }
          </li>
        }
      </ul>
    </section>
  `,
  styleUrl: './transfer-panel.component.scss',
})
export class SdFileExplorerTransferPanel {
  /** Cards to render, newest last. */
  readonly transfers = input.required<readonly SdFileExplorerTransferView[]>();
  /** Header text ("Transfers · 2 items"). */
  readonly title = input<string>('');
  /** Hide the cards, keep the header. */
  readonly collapsed = input(false);
  /** Show the "Clear finished" button. */
  readonly canClear = input(false);
  /** Narrow layout: "Clear finished" becomes an icon button so the header stays on one line. */
  readonly compact = input(false);
  /** E2E scope of the panel. */
  readonly autoId = input<string | undefined>(undefined);
  readonly toggleCollapsed = output<void>();
  readonly clear = output<void>();
  readonly cancel = output<string>();
  readonly retry = output<string>();
  readonly dismiss = output<string>();

  protected readonly titleId = `sd-file-explorer-transfers-title-${nextTransferPanelId}`;
  protected readonly listId = `sd-file-explorer-transfers-list-${nextTransferPanelId++}`;
}
