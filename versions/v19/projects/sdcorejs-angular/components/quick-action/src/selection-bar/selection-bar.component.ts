import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { SdButton, SdButtonItem, SdButtonItemDivider } from '@sdcorejs/angular/components/button';
import { I18nService } from '@sdcorejs/angular/i18n';
import { SdIcon } from '@sdcorejs/angular/modules/icon';
import { SdQuickAction } from '../quick-action.component';
import { SdSelectionBarAction, SdSelectionBarActionNormal } from './selection-bar.model';

/** Dưới bề rộng này (của chính thanh, không phải của màn hình) thanh chuyển sang bố cục xếp dọc. */
const NARROW_WIDTH = 600;
/** Số lệnh hiện thành nút; phần còn lại gom vào nút "Thêm". */
const DIRECT_ACTIONS = 2;

/**
 * Thanh chọn nhiều nằm trong khung, dùng chung cho `sd-table` và `sd-tree`. Nội bộ thư viện (export `ɵ`):
 * consumer dùng `selector.actions` của bảng hoặc cây, không dùng trực tiếp component này.
 *
 * why: bảng và cây từng có hai thanh khác nhau (cây dùng `sd-quick-action` nổi, đè lên nội dung). Thanh này
 * không biết gì về hàng của bảng hay nút của cây: chủ sở hữu đưa vào message và danh sách lệnh đã lọc, rồi tự
 * chạy lệnh khi nhận `action`.
 */
@Component({
  selector: 'sd-selection-bar',
  standalone: true,
  templateUrl: './selection-bar.component.html',
  styleUrl: './selection-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SdIcon, SdButton, SdButtonItem, SdButtonItemDivider, SdQuickAction],
  host: { '[class.sd-selection-bar--narrow]': 'narrow()' },
})
export class SdSelectionBar {
  readonly #i18n = inject(I18nService);
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly opened = input(false, { transform: booleanAttribute });
  readonly message = input<string | null | undefined>('');
  readonly actions = input<readonly SdSelectionBarAction[] | null | undefined>([]);
  /** Gốc autoId của chủ sở hữu (`components-table-<x>`, `components-tree-<x>`). Trống: không sinh autoId. */
  readonly autoId = input<string | null | undefined>(undefined);
  /** Phần giữa autoId của từng lệnh: `<autoId>-<prefix>-<index>`. */
  readonly actionAutoIdPrefix = input('action');

  /** Người dùng chọn một lệnh (nút trực tiếp, mục trong "Thêm" hoặc lệnh con). */
  readonly action = output<SdSelectionBarActionNormal>();
  readonly clear = output<void>();

  /** Bề rộng của thanh nhỏ hơn 600px. */
  readonly narrow = signal(false);

  readonly #entries = computed(() => (this.actions() ?? []).map((action, index) => ({ action, index })));
  readonly directActions = computed(() => this.#entries().slice(0, DIRECT_ACTIONS));
  readonly overflowActions = computed(() => this.#entries().slice(DIRECT_ACTIONS));
  // why: key thuộc bảng vì thanh sinh ra ở đó; cây dùng lại đúng chữ này, không thêm key trùng nghĩa.
  readonly moreLabel = computed(() => this.#i18n.t('core.component.table.selector-action.more'));
  readonly clearLabel = computed(() => this.#i18n.t('core.component.table.clear-selection'));

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      // Thiếu ResizeObserver (trình duyệt cũ, một số môi trường test): giữ bố cục rộng.
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(entries => {
        const width = entries[entries.length - 1]?.contentRect.width ?? 0;
        // Bề rộng 0 là lúc thanh đang ẩn hoặc chưa gắn vào trang, không phải thanh hẹp.
        this.narrow.set(width > 0 && width < NARROW_WIDTH);
      });
      observer.observe(this.#host.nativeElement);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  actionAutoId(index: number, child?: number): string | null {
    const base = this.autoId();
    if (!base) return null;
    const id = `${base}-${this.actionAutoIdPrefix()}-${index}`;
    return child === undefined ? id : `${id}-${child}`;
  }
}
