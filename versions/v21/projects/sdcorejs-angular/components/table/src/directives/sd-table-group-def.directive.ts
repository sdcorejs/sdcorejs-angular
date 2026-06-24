import { Directive, TemplateRef, inject } from '@angular/core';
import { SdTableItem } from '../models/table-item.model';

export interface SdTableGroupDefContext<T = any> {
  /** Children items thuộc group hiện tại (kèm wrapper SdTableItem). */
  items: SdTableItem<T>[];
  /** Children raw data (đã unwrap khỏi SdTableItem) — tiện dùng trong template. */
  data: T[];
  /** Hash key của group (Utilities.hash(values)). */
  key: string;
  /** Resolved giá trị các field group — vd `{ customerId: 1, customerName: 'A' }`. */
  values: Record<string, any>;
  /** true nếu group đang expand, false nếu collapse (chỉ ý nghĩa khi option.group.collapsible). */
  isExpanded: boolean;
  /** true nếu mọi children selectable đều selected. */
  isSelected: boolean;
  /** true nếu một phần children selected (partial). */
  indeterminate: boolean;
  /** Toggle expand/collapse (chỉ chạy nếu collapsible). */
  toggleExpand: () => void;
  /** Toggle select-all cho cả group (chỉ chạy nếu selector visible). */
  toggleSelect: () => void;
}

/**
 * Directive cung cấp custom template render group header row trong sd-table.
 * Thay thế cho htmlTemplate callback cũ — cho phép Angular template binding,
 * pipes, components con (sd-badge, sd-button, …) bên trong.
 *
 * Ví dụ:
 * ```html
 * <sd-table [option]="opt">
 *   <ng-template sdTableGroupDef let-values="values" let-items="items" let-indeterminate="indeterminate">
 *     <b>Khách hàng: {{ values.customerName }}</b>
 *     <span>{{ items.length }} đơn hàng</span>
 *   </ng-template>
 * </sd-table>
 * ```
 */
@Directive({ selector: '[sdTableGroupDef]' })
export class SdTableGroupDefDirective<T = any> {
  static ngTemplateContextGuard<T>(_dir: SdTableGroupDefDirective<T>, _ctx: unknown): _ctx is SdTableGroupDefContext<T> {
    return true;
  }
  templateRef: TemplateRef<SdTableGroupDefContext<T>> = inject(TemplateRef);
}
