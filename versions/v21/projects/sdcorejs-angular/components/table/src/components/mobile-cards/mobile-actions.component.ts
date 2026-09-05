import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  Signal,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatBottomSheet, MatBottomSheetModule, MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SdQuickAction } from '@sdcorejs/angular/components/quick-action';
import { SdButton } from '@sdcorejs/angular/components/button';
import { I18nService, SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdTableMobileAction } from './mobile-action.model';

interface SheetData {
  title: string;
  actions: SdTableMobileAction[];
  busy: Signal<boolean>;
  error: Signal<string>;
  run: (action: SdTableMobileAction) => Promise<void>;
}

@Component({
  selector: 'sd-table-mobile-action-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, SdIcon, SdTranslatePipe],
  styleUrl: './mobile-actions.component.scss',
  template: `
    <div class="sd-mobile-sheet">
      <header class="d-flex align-items-center gap-8">
        <h2 class="T16M flex-1">{{ data.title }}</h2>
        <button mat-button type="button" (click)="close()">{{ 'core.common.close' | sdTranslate }}</button>
      </header>
      @let _busy = data.busy();
      @for (action of data.actions; track action.key) {
        @if (action.children; as children) {
          <section [attr.aria-label]="action.title" class="sd-mobile-action-group">
            <h3 class="T14M">{{ action.title }}</h3>
            @for (child of children; track child.key) {
              <button
                mat-button
                type="button"
                class="sd-mobile-sheet-action"
                [disabled]="_busy || action.disabled || child.disabled"
                (click)="run(child)">
                <sd-icon [name]="child.icon || 'chevron_right'" [fontSet]="child.fontSet" [color]="child.color"></sd-icon>
                <span>{{ child.title }}</span>
                @if (child.htmlTemplate) {
                  <span [innerHTML]="child.htmlTemplate"></span>
                }
              </button>
            }
          </section>
        } @else {
          <button mat-button type="button" class="sd-mobile-sheet-action" [disabled]="_busy || action.disabled" (click)="run(action)">
            <sd-icon [name]="action.icon || 'chevron_right'" [fontSet]="action.fontSet" [color]="action.color"></sd-icon>
            <span>{{ action.title }}</span>
            @if (action.htmlTemplate) {
              <span [innerHTML]="action.htmlTemplate"></span>
            }
          </button>
        }
      }
      @if (data.error(); as error) {
        <p role="alert">{{ error }}</p>
      }
    </div>
  `,
})
class SdTableMobileActionSheet {
  readonly data = inject<SheetData>(MAT_BOTTOM_SHEET_DATA);
  readonly #ref = inject(MatBottomSheetRef<SdTableMobileActionSheet>);
  close(): void {
    this.#ref.dismiss();
  }
  async run(action: SdTableMobileAction): Promise<void> {
    await this.data.run(action);
    if (!this.data.error()) this.close();
  }
}

@Component({
  selector: 'sd-table-mobile-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdQuickAction, SdButton, MatButtonModule, MatCheckboxModule, MatBottomSheetModule, SdIcon, SdTranslatePipe],
  templateUrl: './mobile-actions.component.html',
  styleUrl: './mobile-actions.component.scss',
})
export class SdTableMobileActionsComponent implements OnDestroy {
  readonly actions = input.required<SdTableMobileAction[]>();
  readonly title = input.required<string>();
  readonly selection = input(false);
  readonly autoId = input<string>();
  readonly message = input<string>();
  readonly showSelectPage = input(false);
  readonly pageChecked = input(false);
  readonly pageIndeterminate = input(false);
  readonly selectPage = output<boolean>();
  readonly end = output<void>();
  readonly busy = signal(false);
  readonly error = signal('');
  readonly sheetOpen = signal(false);
  readonly bar = viewChild<ElementRef<HTMLElement>>('bar');
  readonly #sheet = inject(MatBottomSheet);
  readonly #view = inject(ViewContainerRef);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly #i18n = inject(I18nService);
  readonly #width = signal(0);
  #resize?: ResizeObserver;
  #sheetRef?: MatBottomSheetRef<SdTableMobileActionSheet>;

  // why: đo container thật (kể cả drawer), không dùng thêm một breakpoint riêng.
  readonly direct = computed(() => {
    const available = this.#width() - 88; // More control and gaps; the close control lives in the header.
    const result: SdTableMobileAction[] = [];
    let used = 0;
    for (const action of this.actions()) {
      const estimate = 64 + action.title.length * 8;
      if (action.children || action.htmlTemplate || result.length === 2 || used + estimate > available) break;
      used += estimate;
      result.push(action);
    }
    return result;
  });
  readonly overflow = computed(() => this.actions().slice(this.direct().length));

  constructor() {
    effect(onCleanup => {
      const bar = this.bar()?.nativeElement;
      if (!bar) return;
      this.#width.set(bar.getBoundingClientRect().width);
      if (typeof ResizeObserver !== 'undefined') {
        this.#resize = new ResizeObserver(entries => this.#width.set(entries[0].contentRect.width));
        this.#resize.observe(bar);
        onCleanup(() => this.#resize?.disconnect());
      }
    });
    effect(() => {
      this.actions();
      this.title();
      this.closeSheet();
    });
  }

  openMore(): void {
    if (this.sheetOpen() || !this.overflow().length) return;
    this.sheetOpen.set(true);
    const ref = this.#sheet.open(SdTableMobileActionSheet, {
      data: {
        title: this.title(),
        actions: this.overflow(),
        busy: this.busy,
        error: this.error,
        run: action => this.run(action),
      } satisfies SheetData,
      viewContainerRef: this.#view,
      ariaLabel: this.title(),
      panelClass: 'sd-table-mobile-sheet-panel',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
    this.#sheetRef = ref;
    ref.afterDismissed().subscribe(() => {
      if (this.#sheetRef === ref) {
        this.#sheetRef = undefined;
        this.sheetOpen.set(false);
      }
    });
  }

  closeSheet(): void {
    this.#sheetRef?.dismiss();
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
      this.error.set(this.#i18n.t('core.component.table.error-occurred'));
    } finally {
      this.busy.set(false);
    }
  }

  onEscape(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || this.sheetOpen()) return;
    event.stopPropagation();
    // Selection is data, not an overlay. Escape only closes the row-command layer.
    if (!this.selection()) this.end.emit();
  }

  ngOnDestroy(): void {
    this.#resize?.disconnect();
    this.#sheetRef?.dismiss();
    // why: Material trả focus về trigger; nếu trigger đã bị hủy, table là fallback.
    const owner = this.#host.nativeElement.closest<HTMLElement>('sd-table');
    if (this.#sheetRef && owner?.isConnected) owner.focus();
  }
}
