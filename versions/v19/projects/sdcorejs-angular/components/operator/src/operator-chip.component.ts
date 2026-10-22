import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
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
import { DOCUMENT } from '@angular/common';
import { MatMenu, MatMenuModule, MatMenuTrigger, type MenuCloseReason } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Operator, Size } from '@sdcorejs/utils/models';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { ɵsdOperatorResolver } from './operator-items';

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
  },
})
export class ɵSdOperatorChip {
  readonly #operators = ɵsdOperatorResolver();
  readonly #i18n = inject(I18nService);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly #document = inject(DOCUMENT);
  readonly #injector = inject(Injector);

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

  // why: query signal không đặt được trên field ES private (#).
  private readonly trigger = viewChild(MatMenuTrigger);
  private readonly menu = viewChild.required(MatMenu);
  private readonly button = viewChild.required<ElementRef<HTMLButtonElement>>('button');

  /** Mở menu bằng code (dùng cho Alt+↓ và spec). */
  open(): void {
    this.trigger()?.openMenu();
  }

  /** Focus nút chip. */
  focus(): void {
    this.button().nativeElement.focus();
  }

  protected onMenuOpened(): void {
    this.menuOpen.set(true);
    afterNextRender(() => this.#alignMenu(), { injector: this.#injector });
  }

  /**
   * Menu bám chip, mà chip nằm lọt trong khung ô: đặt lên panel khoảng từ chip tới khung ô theo từng phía để CSS
   * của `_operator-menu.scss` đẩy menu cách khung ô 6px và thẳng mép đầu ô, như panel sd-select (review 2026-10-22).
   */
  #alignMenu(): void {
    const panel = this.#document.getElementById(this.menu().panelId);
    const field = this.#host.closest<HTMLElement>('.mat-mdc-text-field-wrapper');
    if (!panel || !field) return;
    const box = field.getBoundingClientRect();
    const chip = this.button().nativeElement.getBoundingClientRect();
    const rtl = getComputedStyle(field).direction === 'rtl';
    const px = (value: number) => `${Math.max(0, value)}px`;
    panel.style.setProperty('--sd-operator-menu-below', px(box.bottom - chip.bottom));
    panel.style.setProperty('--sd-operator-menu-above', px(chip.top - box.top));
    panel.style.setProperty('--sd-operator-menu-start', px(rtl ? box.right - chip.right : chip.left - box.left));
    panel.style.setProperty('--sd-operator-menu-end', px(rtl ? chip.left - box.left : box.right - chip.right));
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
