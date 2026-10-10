import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, Type, computed, effect, input, output, signal, untracked, viewChild } from '@angular/core';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdSideDrawer } from '@sdcorejs/angular/components/side-drawer';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import type { SdFileExplorerItemView, SdFileExplorerMetaRow, SdFileExplorerPreviewState } from '../file-explorer.view-model';
import { SdFileExplorerFileIcon } from './file-icon.component';

/**
 * File detail of the explorer (internal): an `<sd-side-drawer>` opened in the explorer's item area (right of the
 * folder tree, below the header) through the drawer's `container` input, with the preview stage and metadata in its
 * body and share / download in its footer.
 *
 * The explorer owns the open file: a non-null `view` opens the drawer, `null` closes it. When the user closes
 * the drawer (close button, `Escape`, backdrop) the panel emits `close`.
 *
 * PDFs render with `<sd-preview-pdf>` and videos with `<sd-preview-video>`. Both come from
 * `@sdcorejs/angular/components/preview`, imported on demand: that chunk (PDF.js included) is only fetched the
 * first time a PDF or a video is previewed.
 */
@Component({
  selector: 'sd-file-explorer-preview-panel',
  standalone: true,
  imports: [NgComponentOutlet, NgTemplateOutlet, SdButton, SdIcon, SdSideDrawer, SdTranslatePipe, SdFileExplorerFileIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-file-explorer-preview-panel',
  },
  template: `
    @let _view = view();
    @let _state = state();
    @let _autoId = autoId();
    @let _canDownload = canDownload();
    @let _canShare = canShare();
    <sd-side-drawer width="420px" [container]="container()" [title]="drawerTitle()" [autoId]="drawerAutoId()" (sdClosed)="onDrawerClosed()">
      @if (_view) {
        <div class="detail" [attr.data-autoid]="_autoId ?? null">
          <div
            class="stage"
            [class.stage--pdf]="_state.status === 'pdf'"
            [class.stage--video]="_state.status === 'video'"
            [attr.aria-busy]="_state.status === 'loading' ? true : null">
            @switch (_state.status) {
              @case ('image') {
                <img class="image" [src]="_state.url" [alt]="_view.item.name" (error)="imageError.emit()" />
              }
              @case ('pdf') {
                @let _pdf = pdfComponent();
                @if (_pdf) {
                  <ng-container *ngComponentOutlet="_pdf; inputs: pdfInputs()" />
                } @else {
                  <ng-container [ngTemplateOutlet]="viewerPending" />
                }
              }
              @case ('video') {
                @let _video = videoComponent();
                @if (_video) {
                  <ng-container *ngComponentOutlet="_video; inputs: videoInputs()" />
                } @else {
                  <ng-container [ngTemplateOutlet]="viewerPending" />
                }
              }
              @case ('loading') {
                <div class="placeholder">
                  <span class="spinner" aria-hidden="true"></span>
                  <p class="placeholder-hint">{{ 'core.component.file-explorer.preview.loading' | sdTranslate }}</p>
                </div>
              }
              @case ('error') {
                <div class="placeholder placeholder--error" role="alert">
                  <sd-icon name="error_outline" size="32px" />
                  <p class="placeholder-title">{{ 'core.component.file-explorer.preview.error' | sdTranslate }}</p>
                  @if (_state.message) {
                    <p class="placeholder-hint">{{ _state.message }}</p>
                  }
                  <sd-button
                    class="retry-button"
                    type="outline"
                    color="secondary"
                    size="sm"
                    prefixIcon="refresh"
                    [title]="'core.component.file-explorer.retry' | sdTranslate"
                    [attr.data-autoid]="_autoId ? _autoId + '-retry' : null"
                    (click)="retry.emit()" />
                </div>
              }
              @default {
                <div class="placeholder">
                  <sd-file-explorer-file-icon [icon]="_view.icon" [size]="64" />
                  <p class="placeholder-title">{{ 'core.component.file-explorer.preview.unavailable' | sdTranslate }}</p>
                  @if (_canDownload) {
                    <p class="placeholder-hint">{{ 'core.component.file-explorer.preview.unavailable-hint' | sdTranslate }}</p>
                  }
                </div>
              }
            }
          </div>

          <dl class="meta">
            @for (row of meta(); track row.label) {
              <div class="meta-row">
                <dt>{{ row.label }}</dt>
                <dd [title]="row.value">{{ row.value }}</dd>
              </div>
            }
          </dl>
        </div>
      }
      <!-- why: each @if has a single root element carrying sdFooterRight, so Angular projects it into the drawer right footer slot. -->
      @if (_view && _canShare) {
        <sd-button
          sdFooterRight
          class="share-button"
          [size]="compact() ? 'sm' : 'md'"
          [disabled]="_view?.shareDisabled ?? false"
          [attr.aria-description]="_view?.shareDisabled ? _view?.unavailableReason : null"
          [type]="_canDownload ? 'outline' : 'fill'"
          [color]="_canDownload ? 'secondary' : 'primary'"
          prefixIcon="share"
          [title]="'core.component.file-explorer.share' | sdTranslate"
          [attr.data-autoid]="_autoId ? _autoId + '-share' : null"
          (click)="share.emit()" />
      }
      @if (_view && _canDownload) {
        <sd-button
          sdFooterRight
          class="download-button"
          [size]="compact() ? 'sm' : 'md'"
          [disabled]="_view?.downloadDisabled ?? false"
          [attr.aria-description]="_view?.downloadDisabled ? _view?.unavailableReason : null"
          type="fill"
          color="primary"
          prefixIcon="file_download"
          [title]="'core.component.file-explorer.download' | sdTranslate"
          [attr.data-autoid]="_autoId ? _autoId + '-download' : null"
          (click)="download.emit()" />
      }
    </sd-side-drawer>

    <!-- Stage of a PDF or video while its viewer chunk loads, or when that import failed. -->
    <ng-template #viewerPending>
      @if (viewerFailed()) {
        <div class="placeholder placeholder--error">
          <sd-icon name="error_outline" size="32px" />
          <p class="placeholder-title">{{ 'core.component.file-explorer.preview.error' | sdTranslate }}</p>
        </div>
      } @else {
        <div class="placeholder">
          <span class="spinner" aria-hidden="true"></span>
          <p class="placeholder-hint">{{ 'core.component.file-explorer.preview.loading' | sdTranslate }}</p>
        </div>
      }
    </ng-template>
  `,
  styleUrl: './preview-panel.component.scss',
})
export class SdFileExplorerPreviewPanel<T = unknown> {
  /** File shown in the drawer; `null` closes the drawer. */
  readonly view = input<SdFileExplorerItemView<T> | null>(null);
  /** What the stage renders. */
  readonly state = input.required<SdFileExplorerPreviewState>();
  /** Metadata rows (name, type, size, modified). */
  readonly meta = input<readonly SdFileExplorerMetaRow[]>([]);
  /** Show the download button. */
  readonly canDownload = input(false);
  /** Show the share button. */
  readonly canShare = input(false);
  /** Matches the explorer's narrow layout; footer buttons retain Core's 48 px touch span. */
  readonly compact = input(false);
  /** Element the drawer opens inside: the explorer's item area, right of the folder tree. */
  readonly container = input<HTMLElement | null>(null);
  /** E2E scope of the detail content and its buttons. */
  readonly autoId = input<string | undefined>(undefined);
  /** The user closed the drawer (close button, `Escape` or backdrop). */
  readonly close = output<void>();
  /** Download button pressed. */
  readonly download = output<void>();
  /** Share button pressed. */
  readonly share = output<void>();
  /** Retry button of the error state pressed. */
  readonly retry = output<void>();
  /** The `<img>` failed to load. */
  readonly imageError = output<void>();

  protected readonly drawer = viewChild(SdSideDrawer);
  protected readonly drawerTitle = computed(() => this.view()?.item.name ?? '');
  // why: sd-side-drawer tự thêm tiền tố `components-side-drawer-`; bỏ `components-` của autoId explorer cho khỏi lặp.
  protected readonly drawerAutoId = computed(() => this.autoId()?.replace(/^components-/, ''));
  protected readonly pdfComponent = signal<Type<unknown> | null>(null);
  protected readonly videoComponent = signal<Type<unknown> | null>(null);
  protected readonly viewerFailed = signal(false);
  #viewersRequested = false;

  protected readonly pdfInputs = computed<Record<string, unknown>>(() => {
    const state = this.state();
    if (state.status !== 'pdf') return {};
    return {
      source: state.source,
      title: this.view()?.item.name ?? '',
      theme: 'light',
      sidebar: 'none',
      sidebarOpen: false,
      // why: toolbar nổi (trang/zoom) tràn ngang trong panel ~350px; header của viewer vẫn giữ tìm kiếm/in/toàn màn hình.
      showToolbar: false,
      downloadable: false,
      initialZoom: 'page-width',
    };
  });

  protected readonly videoInputs = computed<Record<string, unknown>>(() => {
    const state = this.state();
    if (state.status !== 'video') return {};
    return {
      source: state.source,
      fileName: this.view()?.item.name ?? '',
      // why: the drawer footer already downloads through option.download, so the player hides its own button.
      downloadable: false,
      autoId: this.drawerAutoId(),
    };
  });

  constructor() {
    effect(() => {
      const drawer = this.drawer();
      const open = this.view() !== null;
      if (!drawer) return;
      untracked(() => {
        if (open && !drawer.isOpened()) drawer.open();
        else if (!open && drawer.isOpened()) drawer.forceClose();
      });
    });

    effect(() => {
      const status = this.state().status;
      if (status !== 'pdf' && status !== 'video') return;
      untracked(() => this.#loadViewers());
    });
  }

  protected onDrawerClosed(): void {
    // Explorer tự đóng (view đã là null) thì không báo lại; chỉ báo khi người dùng đóng drawer.
    if (this.view()) this.close.emit();
  }

  async #loadViewers(): Promise<void> {
    if (this.#viewersRequested) return;
    this.#viewersRequested = true;
    try {
      // why: import động để PDF.js (+ worker inline ~1.4 MB) tách chunk riêng — consumer không xem PDF/video thì không tải.
      const module = await import('@sdcorejs/angular/components/preview');
      this.pdfComponent.set(module.SdPreviewPdf);
      this.videoComponent.set(module.SdPreviewVideo);
    } catch {
      this.#viewersRequested = false;
      this.viewerFailed.set(true);
    }
  }
}
