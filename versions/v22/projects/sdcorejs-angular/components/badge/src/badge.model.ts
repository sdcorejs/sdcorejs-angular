import type { Color } from '@sdcorejs/utils/models';
import type { SdBadgeType } from './badge.component';

/**
 * Dữ liệu của một badge truyền qua option thay vì viết thẻ `<sd-badge>`: `useBadge` của cột `sd-table`,
 * `[badges]` của `sd-page`.
 *
 * Không có `size`, `description`, `pulse`, `fontSet`: nơi render tự quyết các input đó.
 */
export interface SdBadgeData {
  /** Chữ hoặc số hiển thị (giá trị của `pair`). */
  // why: model badge cũ của sd-table nhận `title: null`; giữ `null` để object cũ vẫn gán được.
  title?: string | number | null;
  /** Mặc định do nơi render quyết: `sd-table` và `sd-page` dùng `'round'`. */
  type?: SdBadgeType;
  color?: Color;
  icon?: string | null;
  /** Phần trái của `type: 'pair'`; các type khác bỏ qua. */
  label?: string | null;
  tooltip?: string | null;
}
