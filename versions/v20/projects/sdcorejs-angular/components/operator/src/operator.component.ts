import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model, viewChild } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SafeHtml } from '@angular/platform-browser';
import { Operator } from '@sdcorejs/utils/models';
import { ɵSdOperatorChip } from './operator-chip.component';
import { ɵSD_OPERATOR_FALLBACK_ICON, ɵSD_OPERATOR_GLYPHS, ɵSdOperatorItem, ɵsdOperatorResolver } from './operator-items';

/** Cỡ trigger của `sd-operator`: `xs` glyph trơn 14px (vùng bấm 24px), `sm` chip 24px, `md` chip 28px. */
export type SdOperatorSize = 'xs' | 'sm' | 'md';

@Component({
  selector: 'sd-operator',
  templateUrl: './operator.component.html',
  styleUrl: './operator.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule, ɵSdOperatorChip],
})
export class SdOperator {
  // Inner SVG markup (hình phễu) dùng khi chưa chọn operator.
  static readonly FALLBACK_ICON = ɵSD_OPERATOR_FALLBACK_ICON;

  readonly #operators = ɵsdOperatorResolver();

  /** Operator hiện tại — binding hai chiều [(model)]. */
  model = model<Operator | undefined>();

  /** Danh sách operator cho phép, giữ nguyên thứ tự truyền vào. */
  operators = input<Operator[]>([]);

  /** Vô hiệu hóa trigger (không mở được menu). Thắng `readonly`. */
  disabled = input(false, { transform: booleanAttribute });

  /** data-autoId cho e2e selector. */
  autoId = input<string>();

  /** Cỡ trigger: `xs` glyph trơn có vùng bấm 24px, `sm` / `md` là chip giống chip operator trong control. */
  size = input<SdOperatorSize, SdOperatorSize | null | undefined>('md', {
    transform: (value): SdOperatorSize => value || 'md',
  });

  /** Chỉ hiện glyph và tooltip: không mở menu, không nhận Tab (chip chỉ-xem của query-bar). */
  readonly = input(false, { transform: booleanAttribute });

  /** Điều kiện đang có giá trị: chip đổi sang tông primary. */
  active = input(false, { transform: booleanAttribute });

  /** Hiện mã operator (`EQUAL`…) sau nhãn trong menu. */
  showCode = input(false, { transform: booleanAttribute });

  /** Allowed operators map sang { value, icon, display } theo thứ tự input. */
  readonly items = computed<ɵSdOperatorItem[]>(() => this.#operators.items(this.operators()));

  /** Icon SVG của operator hiện tại ở cỡ trigger — fallback phễu khi model chưa set / không tìm thấy. */
  readonly currentIcon = computed<SafeHtml>(() => this.#operators.icon(this.model(), ɵSD_OPERATOR_GLYPHS[this.size()]));

  /** Tooltip = i18n label của operator hiện tại ('' khi chưa chọn). */
  readonly currentLabel = computed<string>(() => this.#operators.label(this.model()));

  /** `readonly` chỉ có hiệu lực khi không `disabled`. */
  readonly isReadonly = computed(() => this.readonly() && !this.disabled());

  // why: query signal không đặt được trên field ES private (#).
  private readonly chip = viewChild(ɵSdOperatorChip);

  /** Open the operator menu programmatically (used by the query-bar build flow). */
  open(): void {
    this.chip()?.open();
  }

  /** Chọn operator từ menu. */
  select(value: Operator): void {
    this.model.set(value);
  }
}
