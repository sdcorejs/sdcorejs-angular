import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ModelSignal,
  Signal,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { MatMenuModule, MatMenuTrigger, type MenuCloseReason } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Operator, Size } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { ɵsdOperatorResolver } from './operator-items';

/** Dưới bề rộng này (px) của ô chứa chip, mũi tên của chip bị ẩn. */
const NARROW_FIELD_WIDTH = 120;

/**
 * Chip operator đặt làm `matPrefix` trong ô của sd-input, sd-input-number, sd-select, sd-date, sd-date-range
 * (thiết kế đợt 2 · G). Dùng chung bảng `OPERATORS`, i18n và icon với `sd-operator`; menu dùng panel của mục D.
 *
 * Bàn phím: Enter / Space / Alt+↓ mở menu; chọn xong phát `chosen` để control đưa focus về ô nhập; Escape
 * đóng menu và trả focus về chip.
 *
 * Nội bộ (`ɵ`): không nằm trong SemVer, ứng dụng không dùng trực tiếp.
 */
@Component({
  selector: 'sd-operator-chip',
  templateUrl: './operator-chip.component.html',
  styleUrl: './operator-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, MatTooltipModule, SdIcon],
  host: {
    class: 'sd-operator-chip',
    '[class.sd-sm]': "size() === 'sm'",
    '[class.sd-md]': "size() !== 'sm'",
    '[class.sd-operator-chip--narrow]': 'narrow()',
  },
})
export class ɵSdOperatorChip {
  readonly #operators = ɵsdOperatorResolver();
  readonly #i18n = inject(I18nService);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Operator cho phép, theo thứ tự hiển thị. */
  readonly operators = input<readonly Operator[]>([]);
  /** Operator hiện tại. */
  readonly operator = model<Operator | undefined>();
  /** Cỡ của ô chứa chip; `lg` dùng hình học của `md`. */
  readonly size = input<Size>('md');
  /** Ô đang có giá trị: chip đổi sang tông primary. */
  readonly hasValue = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly autoId = input<string>();
  /** Đã chọn một operator trong menu (control đưa focus về ô nhập). */
  readonly chosen = output<Operator>();

  protected readonly items = computed(() => this.#operators.items(this.operators()));
  protected readonly currentIcon = computed(() => this.#operators.icon(this.operator()));
  protected readonly currentLabel = computed(() => this.#operators.label(this.operator()));
  protected readonly ariaLabel = computed(() => {
    const label = this.currentLabel();
    return label ? this.#i18n.t('core.component.operator.current', { operator: label }) : this.#i18n.t('core.component.operator.choose');
  });
  protected readonly menuOpen = signal(false);
  protected readonly narrow = signal(false);

  // why: query signal không đặt được trên field ES private (#).
  private readonly trigger = viewChild(MatMenuTrigger);
  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // Ô hẹp (cột filter của bảng…): bỏ mũi tên để còn chỗ cho giá trị. Đo khung của mat-form-field.
      const field = this.#host.closest<HTMLElement>('.mat-mdc-text-field-wrapper') ?? this.#host.parentElement;
      if (!field || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(entries => {
        const width = entries[0]?.contentRect.width ?? field.clientWidth;
        this.narrow.set(width > 0 && width < NARROW_FIELD_WIDTH);
      });
      observer.observe(field);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** Mở menu bằng code (dùng cho Alt+↓ và spec). */
  open(): void {
    this.trigger()?.openMenu();
  }

  /** Focus nút chip. */
  focus(): void {
    this.button().nativeElement.focus();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      this.open();
    }
  }

  protected choose(value: Operator): void {
    this.operator.set(value);
  }

  protected onClosed(reason: MenuCloseReason): void {
    this.menuOpen.set(false);
    // Chọn một hàng: focus về ô nhập (control lo). Escape: focus về chip. Tab / click ngoài: để focus tự nhiên.
    if (reason === 'click') {
      const value = this.operator();
      if (value !== undefined) this.chosen.emit(value);
    } else if (reason === 'keydown') {
      this.focus();
    }
  }
}

/**
 * Giá trị của control có "đang có" không, để chip đổi tông: `null`, `undefined`, `''`, mảng rỗng và object mà
 * mọi trường đều trống (vd khoảng ngày `{ from: null, to: null }`) là chưa có.
 *
 * Nội bộ (`ɵ`): không nằm trong SemVer, ứng dụng không dùng trực tiếp.
 */
export function ɵsdOperatorHasValue(value: unknown): boolean {
  if (value == null || value === '') return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object' && !(value instanceof Date)) {
    return Object.values(value as Record<string, unknown>).some(item => ɵsdOperatorHasValue(item));
  }
  return true;
}

/**
 * `NULL` / `NOT_NULL` không cần giá trị: control khoá ô nhập và xoá giá trị khi chọn một trong hai.
 *
 * Nội bộ (`ɵ`): không nằm trong SemVer, ứng dụng không dùng trực tiếp.
 */
export function ɵsdIsNoDataOperator(operator: Operator | null | undefined): boolean {
  return operator === 'NULL' || operator === 'NOT_NULL';
}

/**
 * Có đúng một operator thì control dùng luôn operator đó và không hiện chip. Gọi trong injection context.
 *
 * Nội bộ (`ɵ`): không nằm trong SemVer, ứng dụng không dùng trực tiếp.
 */
export function ɵsdSingleOperator(operators: Signal<readonly Operator[]>, operator: ModelSignal<Operator | undefined>): void {
  effect(() => {
    const list = operators();
    if (list.length !== 1) return;
    untracked(() => {
      if (operator() !== list[0]) operator.set(list[0]);
    });
  });
}
