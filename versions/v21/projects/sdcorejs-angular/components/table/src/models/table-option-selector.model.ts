import { SdButton } from '@sdcorejs/angular/components/button';
import { SdUnwrapSignal } from '@sdcorejs/angular/utilities/models';

export interface SdTableOptionSelector<T = any> {
  /** Bật/tắt cột checkbox selector. Mặc định: true. */
  visible?: boolean;
  /** Chỉ cho chọn 1 dòng tại một thời điểm. */
  single?: boolean;
  /** Danh sách action hiển thị khi có item được chọn. */
  actions?: SdTableAction<T>[];
  /** Nội dung hiển thị bên cạnh selector/action bar. */
  message?: string | ((selectedItems?: T[]) => string);
  /** Callback khi user chọn/bỏ chọn một dòng. */
  onSelect?: (rowData?: T, selectedItems?: T[]) => void;
  /** Callback khi user chọn tất cả hoặc bỏ chọn tất cả. */
  onSelectAll?: (selectedItems: T[]) => void;
  /** Disable checkbox của từng dòng theo điều kiện. */
  disabled?: (rowData?: T, selectedItems?: T[]) => boolean;
  /**
   * Predicate để tự động pre-select item sau mỗi lần load.
   * Table sẽ gọi hàm này cho từng item và set isSelected = true nếu trả về true.
   * Dùng khi cần programmatically set selected items từ bên ngoài.
   */
  defaultSelected?: (rowData: T) => boolean;
  /**
   * Giữ lại selection khi user chuyển trang / filter / sort / reload.
   * Selection chỉ bị clear khi user bấm nút X (onClearSelection) hoặc bỏ chọn từng item.
   *
   * - Default (false): selection bị mất khi data items được re-fetch (server-side) hoặc
   *   item references thay đổi. Action bar chỉ hiển thị số item selected ở page hiện tại.
   * - Enabled (true): table giữ map nội bộ selectedItems theo `meta.id`.
   *   Sau mỗi #render, restore `isSelected` cho item nào id đã có trong map.
   *   `selectedTableItems()` trả về TOÀN BỘ item đã chọn xuyên trang (kể cả off-page),
   *   nên action bar + callback `click(items)` nhận đầy đủ data đang được chọn.
   *
   * ⚠️ Matching dựa trên `meta.id`. Không khai báo `option.rowKey` thì id được sinh theo
   * IDENTITY của object data — sống qua filter/sort/paging phía client, nhưng KHÔNG sống
   * qua một lần fetch mới của server (object mới → id mới). Với `type: 'server'`, HÃY
   * khai báo `option.rowKey` trỏ vào field định danh của dòng.
   */
  preserveSelection?: boolean;
}

export type SdTableAction<T = any> = SdTableActionNormal<T> | SdTableActionChildren<T>;

export interface SdTableActionNormal<T = any> {
  /**
   * Tên icon hiển thị trên action button.
   * Giá trị này được render qua `sd-icon`, vì vậy nên dùng đúng tên glyph của configured icon set.
   * Tra cứu icon tại: https://fonts.google.com/icons
   */
  icon?: string;
  /**
   * Font set của icon.
   * Kiểu thực tế lấy từ `SdButton['fontSet']` và chỉ hỗ trợ các giá trị thuộc `SdIconSet`,
   * ví dụ: `material-icons`, `material-icons-outlined`, `material-icons-round`,
   * `material-icons-sharp`.
   * Nếu không truyền, `SdButton` sẽ dùng font set mặc định của nó.
   */
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  /** Tooltip hiển thị khi hover action button. */
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  /** Text label hiển thị trên button action. */
  title?: SdUnwrapSignal<SdButton['title']>;
  /**
   * Màu của `SdButton`.
   * Kiểu thực tế map theo `SdButton['color']`, hiện dùng các token như
   * `primary`, `secondary`, `info`, `success`, `warning`, `error`.
   */
  color?: SdUnwrapSignal<SdButton['color']>;
  /**
   * Variant hiển thị của `SdButton`.
   * Kiểu thực tế là `fill | light | outline | link`.
   */
  type?: SdUnwrapSignal<SdButton['type']>;
  /** Ẩn action theo cờ tĩnh hoặc theo điều kiện của dữ liệu dòng. */
  hidden?: boolean | ((rowData?: T) => boolean);
  /** Gom action vào nhóm hiển thị compact nếu table hỗ trợ grouped actions. */
  isGrouped?: boolean;
  /** Hàm xử lý khi click action, nhận toàn bộ item đang được chọn. */
  click: (selectedItems?: T[]) => void;
}

interface SdTableActionChildren<T = any> {
  /**
   * Tên icon của action cha (group action).
   * Giá trị nên là tên glyph configured icon set: https://fonts.google.com/icons
   */
  icon?: string;
  /**
   * Font set của icon cho action cha.
   * Dùng cùng kiểu dữ liệu với `SdButton['fontSet']`.
   */
  fontSet?: SdUnwrapSignal<SdButton['fontSet']>;
  /** Tooltip của action cha. */
  tooltip?: SdUnwrapSignal<SdButton['tooltip']>;
  /** Label của action cha. */
  title?: SdUnwrapSignal<SdButton['title']>;
  /** Màu của action cha theo kiểu `SdButton['color']`. */
  color?: SdUnwrapSignal<SdButton['color']>;
  /** Variant hiển thị của action cha theo kiểu `SdButton['type']`. */
  type?: SdUnwrapSignal<SdButton['type']>;
  /** Ẩn action cha theo cờ tĩnh hoặc theo điều kiện của dữ liệu dòng. */
  hidden?: boolean | ((rowData?: T) => boolean);
  /** Gom action cha vào nhóm hiển thị compact nếu table hỗ trợ grouped actions. */
  isGrouped?: boolean;
  /** Danh sách action con hiển thị bên trong group action này. */
  children: SdTableActionNormal<T>[];
}
