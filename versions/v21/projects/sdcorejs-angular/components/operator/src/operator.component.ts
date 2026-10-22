import { ChangeDetectionStrategy, Component, booleanAttribute, computed, input, model, viewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SafeHtml } from '@angular/platform-browser';
import { Operator } from '@sdcorejs/utils/models';
import { ɵSD_OPERATOR_FALLBACK_ICON, ɵSdOperatorItem, ɵsdOperatorResolver } from './operator-items';

@Component({
  selector: 'sd-operator',
  templateUrl: './operator.component.html',
  styleUrl: './operator.component.scss',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatMenuModule, MatTooltipModule],
})
export class SdOperator {
  // Inner SVG markup (hình phễu) dùng khi chưa chọn operator.
  static readonly FALLBACK_ICON = ɵSD_OPERATOR_FALLBACK_ICON;

  readonly #operators = ɵsdOperatorResolver();

  /** Operator hiện tại — binding hai chiều [(model)]. */
  model = model<Operator | undefined>();

  /** Danh sách operator cho phép, giữ nguyên thứ tự truyền vào. */
  operators = input<Operator[]>([]);

  /** Vô hiệu hóa trigger (không mở được menu). */
  disabled = input(false, { transform: booleanAttribute });

  /** data-autoId cho e2e selector. */
  autoId = input<string>();

  /** Allowed operators map sang { value, icon, display } theo thứ tự input. */
  readonly items = computed<ɵSdOperatorItem[]>(() => this.#operators.items(this.operators()));

  /** Icon SVG ở trigger — fallback phễu khi model chưa set / không tìm thấy. */
  readonly currentIcon = computed<SafeHtml>(() => this.#operators.icon(this.model()));

  /** Tooltip = i18n label của operator hiện tại ('' khi chưa chọn). */
  readonly currentLabel = computed<string>(() => this.#operators.label(this.model()));

  private readonly trigger = viewChild(MatMenuTrigger);

  /** Open the operator menu programmatically (used by the query-bar build flow). */
  open(): void {
    this.trigger()?.openMenu();
  }

  /** Chọn operator từ menu. */
  select(value: Operator): void {
    this.model.set(value);
  }
}
