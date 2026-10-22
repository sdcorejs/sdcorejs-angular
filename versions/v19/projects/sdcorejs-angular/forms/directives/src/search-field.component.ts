import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  DoCheck,
  ElementRef,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { SdTranslatePipe } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { Size } from '@sdcorejs/utils/models';

export type ɵSdSearchFieldSize = Extract<Size, 'sm' | 'md'>;

/**
 * Gắn lên `<input>` thật được chiếu vào `<sd-search-field>`. Chỉ đọc trạng thái của input (có giá trị,
 * disabled) cho khung; mọi binding, phím và accessible name vẫn đặt ở nơi dùng.
 *
 * Nội bộ (`ɵ`): không nằm trong SemVer, ứng dụng không dùng trực tiếp.
 */
@Directive({
  selector: 'input[sdSearchFieldInput]',
  host: { '(input)': 'sync()' },
})
export class ɵSdSearchFieldInputDirective implements DoCheck {
  readonly #element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  readonly #hasValue = signal(false);
  readonly #disabled = signal(false);

  readonly hasValue = this.#hasValue.asReadonly();
  readonly disabled = this.#disabled.asReadonly();

  // why: value/disabled thường đến qua property binding của nơi dùng (`[value]`, `[disabled]`), không phát
  // event nào — đọc lại sau mỗi lượt check của view chứa input. Gõ phím thì đã có `(input)`.
  ngDoCheck(): void {
    this.sync();
  }

  focus(): void {
    this.#element.focus();
  }

  sync(): void {
    this.#hasValue.set(this.#element.value !== '');
    this.#disabled.set(this.#element.disabled);
  }
}

/**
 * Khung ô tìm kiếm dùng chung cho các ô tự viết (kanban, quick search của table, palette form builder,
 * ô lọc trong panel sd-select). Primitive chỉ lo hình dạng: cỡ, viền/focus theo token control, icon
 * `search`, nút xoá và slot cuối `[sdSearchFieldEnd]`. Logic (debounce, Enter để áp dụng, Escape để xoá)
 * thuộc component dùng nó.
 *
 * Nội bộ (`ɵ`): không nằm trong SemVer, ứng dụng không dùng trực tiếp.
 */
@Component({
  selector: 'sd-search-field',
  imports: [SdIcon, SdTranslatePipe],
  templateUrl: './search-field.component.html',
  styleUrl: './search-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sd-search-field',
    '[class.sd-sm]': "size() === 'sm'",
    '[class.sd-md]': "size() !== 'sm'",
    '[class.sd-disabled]': 'disabled()',
    '(click)': 'focusInput($event)',
  },
})
export class ɵSdSearchField {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  readonly size = input<ɵSdSearchFieldSize>('md');
  /** Hiện nút xoá khi input có giá trị. Nút chỉ phát `cleared`; xoá giá trị là việc của nơi dùng. */
  readonly clearable = input(false, { transform: booleanAttribute });
  /** Accessible name của nút xoá; mặc định là key `core.form.search-field.clear`. */
  readonly clearLabel = input<string>();
  /** Nút xoá nhận `data-autoid="<autoId>-clear"`. */
  readonly autoId = input<string>();
  readonly cleared = output<void>();

  // why: query signal không đặt được trên field ES private (#).
  private readonly searchInput = contentChild(ɵSdSearchFieldInputDirective);

  protected readonly disabled = computed(() => this.searchInput()?.disabled() ?? false);
  protected readonly showClear = computed(() => this.clearable() && (this.searchInput()?.hasValue() ?? false));

  // why: các ô cũ bọc input bằng <label>, nên bấm vào icon hay phần đệm cũng focus ô nhập — giữ hành vi đó.
  // Nút xoá, slot cuối và chính input tự xử lý click của chúng.
  protected focusInput(event: MouseEvent): void {
    const hit = (event.target as Element | null)?.closest('input, button, a, [sdSearchFieldEnd]');
    if (hit && this.#host.contains(hit)) return;
    this.searchInput()?.focus();
  }
}
