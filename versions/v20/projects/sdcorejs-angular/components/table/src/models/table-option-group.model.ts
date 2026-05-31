import { NestedKeyOf } from '@sdcorejs/utils/models';

export interface SdTableOptionGroup<T = any> {
  /**
   * Danh sách field dùng để nhóm. Item có cùng giá trị tất cả `fields` sẽ vào cùng group.
   * Ví dụ `['customerId']` group orders theo khách hàng.
   * Type-safe qua `NestedKeyOf<T>` — hỗ trợ dot-notation cho nested object (vd `'customer.id'`).
   */
  fields: NestedKeyOf<T>[];
  /**
   * Mặc định group có collapse được không. true = render với UI có thể expand/collapse;
   * false = luôn show toàn bộ children (mặc định).
   */
  collapsible?: boolean;
  /** Nếu collapsible, mặc định trạng thái ban đầu: true = collapsed, false = expanded (default). */
  defaultCollapsed?: boolean;
  /**
   * Predicate tùy chọn cho selection. Khi check `selectable` của group header.
   * Mặc định: chỉ nhóm có >=1 child `selectable` mới hiển thị checkbox.
   */
  selectable?: (children: T[]) => boolean;
}
