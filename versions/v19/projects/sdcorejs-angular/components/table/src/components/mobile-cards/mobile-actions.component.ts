import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdButton } from '@sdcorejs/angular/components/button';
import { SdModal } from '@sdcorejs/angular/components/modal';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTableMobileAction } from './mobile-action.model';

@Component({
  selector: 'sd-table-mobile-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdQuickAction, SdButton, SdModal, MatButtonModule, SdIcon, SdTranslatePipe],
  templateUrl: './mobile-actions.component.html',
  styleUrl: './mobile-actions.component.scss',
})
export class SdTableMobileActionsComponent implements OnDestroy {
  readonly actions = input.required<SdTableMobileAction[]>();
  readonly title = input.required<string>();
  readonly selection = input(false);
  readonly count = input(0);
  readonly autoOpen = input(true);
  readonly autoId = input<string>();
  readonly end = output<void>();
  readonly busy = signal(false);
  readonly error = signal('');
  readonly sheet = viewChild<SdModal>('sheet');
  readonly sheetOpen = computed(() => this.sheet()?.isOpened() ?? false);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #i18n = inject(I18nService);
  #destroyed = false;
  #pending?: SdTableMobileAction;

  // why: flat actions wrap in the toolbar; groups keep their declaration order in More.
  readonly direct = computed(() => {
    const result: SdTableMobileAction[] = [];
    for (const action of this.actions()) {
      if (action.children || action.htmlTemplate) break;
      result.push(action);
    }
    return result;
  });
  readonly overflow = computed(() => this.actions().slice(this.direct().length));
  readonly sheetActions = computed(() => (this.selection() ? this.overflow() : this.actions()));

  constructor() {
    // why: opening a newly created SdModal requires its title/dismiss bindings to be rendered first.
    afterRenderEffect(() => {
      const actions = this.actions();
      const selection = this.selection();
      const autoOpen = this.autoOpen();
      const sheet = this.sheet();
      untracked(() => {
        if (!selection && autoOpen && actions.length) sheet?.open();
        else sheet?.close();
      });
    });
  }

  openMore(): void {
    if (!this.sheetOpen() && this.sheetActions().length) this.sheet()?.open();
  }

  closeSheet(): void {
    this.sheet()?.close();
  }

  onSheetClosed(): void {
    if (this.#destroyed) return;
    const pending = this.#pending;
    this.#pending = undefined;
    if (pending) void this.run(pending);
    if (!this.selection() && this.autoOpen()) this.end.emit();
  }

  async runSheet(action: SdTableMobileAction): Promise<void> {
    if (this.busy() || action.disabled) return;
    // why: finish closing before another drawer/dialog takes focus and overlay ownership.
    if (action.closeBeforeRun) {
      this.#pending = action;
      this.closeSheet();
      return;
    }
    await this.run(action);
    if (!this.error()) this.closeSheet();
  }

  async run(action: SdTableMobileAction): Promise<void> {
    if (this.busy() || action.disabled || action.children || !action.run) return;
    this.error.set('');
    try {
      const result = action.run();
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
        this.busy.set(true);
        await result;
      }
    } catch (error) {
      console.error(error);
      if (!this.#destroyed) this.error.set(this.#i18n.t('core.component.table.error-occurred'));
    } finally {
      if (!this.#destroyed) this.busy.set(false);
    }
  }

  ngOnDestroy(): void {
    this.#destroyed = true;
    this.#pending = undefined;
    const wasOpen = this.sheetOpen();
    this.sheet()?.forceClose();
    const owner = this.#host.nativeElement.closest<HTMLElement>('sd-table');
    if (wasOpen && owner?.isConnected) owner.focus();
  }
}
